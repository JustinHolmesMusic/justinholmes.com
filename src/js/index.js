import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'popper.js';
import 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'jquery';

import contractABI from './contributionABI.js'
import '../styles/style.css';
import {fetchBalance, writeContract} from '@wagmi/core'
import {EthereumClient, w3mConnectors, w3mProvider} from '@web3modal/ethereum'
import {Web3Modal} from '@web3modal/html'
import {configureChains, createConfig, fetchBlockNumber} from '@wagmi/core'
import {mainnet, goerli} from '@wagmi/core/chains'
import {readContract} from '@wagmi/core'
import {formatEther, parseEther} from "viem";

require.context('../images', false, /\.(png|jpe?g|gif|svg)$/);
require.context('../images/thumbnails', false, /\.(png|jpe?g|gif|svg)$/);

// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, goerli]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const contractAddress = '0x6Fc000Ba711d333427670482853A4604A3Bc0E03';

/////////////
// Web3Modal Things
/////////////

const {publicClient} = configureChains(chains, [w3mProvider({projectId})])
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({projectId, chains}),
    publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)
export const web3modal = new Web3Modal({
    projectId: projectId,
    themeVariables: {
        "--w3m-font-family": "monospace, sans-serif",
        "--w3m-accent-color": "blueviolet",
        "--w3m-background-color": "blueviolet",
    }
}, ethereumClient);


//////////////////
//// Funding Threshold Things
//////////////////

// Call updateFundingThreshold when DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
    updateFundingThreshold();
    document.getElementById("contribute-button").onclick = contribute;
    document.getElementById("min-preset").onclick = setMinPreset;
    document.getElementById("ten-preset").onclick = setTenPreset;
    document.getElementById("leader-preset").onclick = setLeaderPreset;
});

// Update the countdown every 1 second
async function updateFundingThreshold() {


    // Instead of awaiting these, do them concurrently.
    const balance = await fetchBalance({
        address: contractAddress,
        chainId: 5,
        formatUnits: "wei",
    });

    const thresholdInEth = await readContract({
        address: contractAddress,
        abi: contractABI,
        chainId: 5,
        functionName: 'threshold',
    });

    // Calculate the remaining amount needed to reach the threshold
    const remainingAmountInWei = Number(thresholdInEth) - Number(balance.value);

    // Convert the remaining amount to ETH
    const remainingAmount = formatEther(remainingAmountInWei);

    // Update the HTML element
    document.getElementById('remainingEth').textContent = remainingAmount;

    // If the threshold has been reached, stop the countdown
    if (remainingAmount <= 0) {
        // Put "hurrah" in the 'remainingEth' element
        document.getElementById('remainingEth').textContent = "hurrah";
    }
}


// var x = setInterval(function () {
//     updateCountdownDisplay();
// }, 10000);

async function updateCountdownDisplay() {

    const deadline = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deadline',
        chainId: 5,
    });

    console.log('Deadline: ', deadline);

    let countDownDate = Number(deadline) * 1000;
    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the counter-downer date
    let distance = countDownDate - now;

    // If the countdown is finished, write some text
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "EXPIRED";
        return;
    }

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById("countdown").innerHTML =
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";


}

function setMinPreset() {
    document.getElementById("user-amount").value = 0.1;
}

function setTenPreset() {
    document.getElementById("user-amount").value = 0.5;  // TODO: read from contract
}

function setLeaderPreset() {
    document.getElementById("user-amount").value = 1;  // TODO: read from contract
}

async function contribute() {

    let userAmount = document.getElementById("user-amount").value;

    const {hash} = await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'contribute',  // TODO: if they combined, this needs to be contributeAndCombine
        value: parseEther(userAmount),
        chainId: 5,
    })
}

var x = setInterval(function () {
    updateFundingThreshold();
}, 10000);


//////////////////
//// Contributors Table Things
//////////////////

function getContributionsByAddress(contributionsMetadata) {

    let contributionsByAdress = {}

    let contributors = contributionsMetadata[0]
    let amounts = contributionsMetadata[1]
    let combined = contributionsMetadata[2]
    let datetimes = contributionsMetadata[3]

    for (var i = 0; i < contributors.length; i++) {

        const address = contributors[i]
        if (!(address in contributionsByAdress)) {
            contributionsByAdress[address] = []
        }

        const is_combined = combined[i]
        const amount = amounts[i]
        const contributionMoment = datetimes[i]

        if (is_combined) {
            if (contributionsByAdress[address].length == 0) {
                console.log("wtf");
                // This ought to be an impossible situaiton - how did they dcombine with a bid that didn't exist?
                contributionsByAdress[address].push(0)
            }
            contributionsByAdress[address][0] += amount
        } else {
            contributionsByAdress[address].push(amount)
        }
    }
    return contributionsByAdress;
}

function getTopContributions(contributionsByAdress) {
    let topContributions = []
    for (let address in contributionsByAdress) {
        let contributions = contributionsByAdress[address];
        for (var c = 0; c < contributions.length; c++) {
            topContributions.push([contributions[c], address]);
        }
    }

    function compareContributions(a, b) {
        return a[0] - b[0];
    }

    topContributions.sort(compareContributions);
    return topContributions;
}

// Call updateContributorsTable when DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
    updateContributorsTable();
});

async function updateContributorsTable() {

    const contributionsMetadata = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getAllContributions',
        chainId: 5,
    });

    let contributionsByAddress = getContributionsByAddress(contributionsMetadata)
    let leaders = getTopContributions(contributionsByAddress)

    // Get the table body
    const leaderboardTable = document.getElementById('leaderboard-table');
    const leaderboardTableBody = leaderboardTable.childNodes[3]
    const leaderRows = leaderboardTableBody.getElementsByTagName("tr");

    // Loop through the contributors and append a row for each
    for (var i = 0; i < leaderRows.length; i++) {
        let row = leaderRows[i];
        let thisLeader = leaders[i];

        if (thisLeader == undefined) {
            console.log("Not enough leaders to fill the rows.")
            return;
        }

        let bidSlot = row.getElementsByTagName('td')[1];
        let addressSlot = row.getElementsByTagName('td')[2];

        bidSlot.innerHTML = thisLeader[0];
        addressSlot.innerHTML = thisLeader[1];
    }
    ;

}
