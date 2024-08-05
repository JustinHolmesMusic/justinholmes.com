// @ts-check

import { readContract, fetchEnsName, http, createConfig} from "@wagmi/core";
import {mainnet} from '@wagmi/core/chains';
import { revealerContractAddress } from "../js/constants.js";
import { revealerContributionABI } from "../abi/revealerContributionABI.js";

const config = createConfig({
    chains: [mainnet],
    transports: {
        [mainnet.id]: http(),
    },
})

function getContributionsByAddress(contributionsMetadata) {

    let contributionsByAddress = {}

    let contributors = contributionsMetadata[0]
    let amounts = contributionsMetadata[1]
    let combined = contributionsMetadata[2]
    let datetimes = contributionsMetadata[3]

    for (let i = 0; i < contributors.length; i++) {

        const address = contributors[i]
        if (!(address in contributionsByAddress)) {
            contributionsByAddress[address] = []
        }

        const is_combined = combined[i]
        const amount = Number(amounts[i])
        const contributionMoment = datetimes[i]

        if (is_combined) {
            if (contributionsByAddress[address].length === 0) {
                // console.log("wtf");
                // This ought to be an impossible situaiton - how did they dcombine with a bid that didn't exist?
                contributionsByAddress[address].push(Number(0))
            }
            contributionsByAddress[address][0] += Number(amount)
        } else {
            contributionsByAddress[address].push(amount)
        }
    }
    return contributionsByAddress;
}

function getTopContributions(contributionsByAddress) {
    let topContributions = []
    for (let address in contributionsByAddress) {
        let contributions = contributionsByAddress[address];
        for (var c = 0; c < contributions.length; c++) {
            topContributions.push([contributions[c], address]);
        }
    }

    function compareContributions(a, b) {
        if (a[0] > b[0]) {
            return -1;
        }
        if (a[0] < b[0]) {
            return 1;
        }
        return 0;
    }

    topContributions.sort(compareContributions);
    return topContributions;
}


export async function getVowelsoundContributions() {

    const contributionsMetadata = await readContract(config, {
        address: revealerContractAddress,
        abi: revealerContributionABI,
        chainId: 1,
        functionName: 'getAllContributions',
    });

    let contributionsByAddress = getContributionsByAddress(contributionsMetadata)

    // array, sorted by contribution amount, of arrays of [amount, address]
    let leaders = getTopContributions(contributionsByAddress)

    // Loop through the contributors and append a row for each
    for (let i = 0; i < leaders.length; i++) {
        let thisLeader = leaders[i];
        let amountInWei = thisLeader[0];


        let ensName = await fetchEnsName(config, {address: thisLeader[1], chainId: 1});
        if (ensName == undefined) {
            ensName = thisLeader[1];
        }

        leaders[i] = {"amount": amountInWei, "address": ensName};
    };

    return leaders;
}