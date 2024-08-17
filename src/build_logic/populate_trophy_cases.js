// @ts-check
import {createConfig, http, readContract, fetchBlockNumber, fetchEnsName} from '@wagmi/core';
import {mainnet, optimism,  optimismSepolia, arbitrum } from '@wagmi/core/chains';
import {brABI as abi} from "../abi/blueRailroadABI.js";
import {setStoneABI} from "../abi/setStoneABI.js";
import {shows} from "./show_and_set_data.js";
import {serializeChainData} from "./chaindata_db.js";
import {stringify} from "../js/utils.js";
import {setStoneContractAddress, blueRailroadContractAddress} from "../js/constants.js";
import { getVowelsoundContributions } from "./revealer_utils.js";
import Web3 from 'web3';
const web3 = new Web3();



export const config = createConfig({
    chains: [mainnet, optimism, optimismSepolia, arbitrum],
    transports: {
        [mainnet.id]: http("https://mainnet.infura.io/v3/08ebc943a2844ce7a78678a320b67d54"),
        [optimism.id]: http("https://optimism-mainnet.infura.io/v3/08ebc943a2844ce7a78678a320b67d54"),
        [optimismSepolia.id]: http("https://optimism-sepolia.infura.io/v3/08ebc943a2844ce7a78678a320b67d54"),
        [arbitrum.id]: http("https://arbitrum-mainnet.infura.io/v3/08ebc943a2844ce7a78678a320b67d54"),
    },
})


export async function appendChainDataToShows(showsAsReadFromDisk) {
    // We expect shows to be the result of iterating through the show YAML files.
    // Now we'll add onchain data from those shows.

    // Make a copy of shows to mutate and eventually return.
    let shows = structuredClone(showsAsReadFromDisk);

    // Iterate through show IDs and parse the data.
    for (let [show_id, show] of Object.entries(shows)) {
        // Split ID by "-" into artist_id and blockheight
        const [artist_id, blockheight] = show_id.split('-');

        // Read the contract using the getShowData function
        const showData = await readContract(config, {
            abi: setStoneABI,
            address: setStoneContractAddress,
            functionName: 'getShowData',
            chainId: arbitrum.id,
            args: [artist_id, blockheight],
        });

        // (bytes32 showBytes1, uint16 stonesPossible1, uint8 numberOfSets1, uint256 stonePrice1, bytes32[] memory rabbitHashes1)
        // This is the return type of the solidity getShowData function
        // unpack the showData
        const unpackedShowData = {
            showBytes: showData[0],  // This is actually just artist_id and blockheight again
            numberOfSets: showData[1],
            stonePrice: showData[2],
            rabbitHashes: showData[3],
            setShapeBySetId: showData[4],

        };

        show["artist_id"] = parseInt(artist_id);
        show["blockheight"] = parseInt(blockheight)
        show["rabbit_hashes"] = unpackedShowData.rabbitHashes;
        show["stone_price"] = unpackedShowData.stonePrice;


        // integrity check: the number of sets on chain is the same as the number of sets in the yaml, raise an error if not
        if (unpackedShowData.numberOfSets !== Object.keys(show.sets).length) {
            // throw new Error(`Number of sets on chain (${unpackedShowData.numberOfSets}) does not match the number of sets in the yaml (${show.sets.length}) for show ID ${show_id}`);
            console.log(`Error: Number of sets on chain (${unpackedShowData.numberOfSets}) does not match the number of sets in the yaml (${Object.keys(show.sets).length}) for show ID ${show_id}`);
        }

        // unpack setShapeBySetId
        for (let i = 0; i < Object.keys(show["sets"]).length; i++) {
            show["sets"][i]["shape"] = unpackedShowData.setShapeBySetId[i];
        }

    }
    return shows;
}

export async function appendSetStoneDataToShows(shows) {
    // should be called after the shows data has been appended to the shows object

    let number_of_stones_in_sets = 0;


    for (let [show_id, show] of Object.entries(shows)) {
        // Split ID by "-" into artist_id and blockheight
        const [artist_id, blockheight] = show_id.split('-');

        for (let [set_order, set] of Object.entries(show.sets)) {
            set.setstones = [];

            const setStoneIds = await readContract(config, {
                abi: setStoneABI,
                address: setStoneContractAddress,
                functionName: 'getStonesBySetId',
                chainId: arbitrum.id,
                args: [artist_id, blockheight, set_order],
            });


            for (let setStoneId of setStoneIds) {
                let setstone = {}
                number_of_stones_in_sets++;

                // call getStoneColor, getCrystalizationMsg, getPaidAmountWei to get the stone metadata
                setstone["tokenId"] = setStoneId;

                const stoneColor = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'getStoneColor',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });

                setstone["color"] = [stoneColor.color1, stoneColor.color2, stoneColor.color3];

                const crystalizationMsg = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'getCrystalizationMsg',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });

                setstone["crystalizationMsg"] = crystalizationMsg;

                const favoriteSong = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'getFavoriteSong',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });
                setstone["favoriteSong"] = favoriteSong;


                const paidAmountWei = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'getPaidAmountWei',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });

                setstone["paidAmountWei"] = paidAmountWei;
                setstone["paidAmountEth"] = web3.utils.fromWei(paidAmountWei, 'ether');

                let ownerOfThisToken = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'ownerOf',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });


                let ensName = await fetchEnsName(config, {address: ownerOfThisToken, chainId: 1});
                if (ensName == undefined) {
                    ensName = ownerOfThisToken;
        }

                setstone["owner"] = ensName;

                let tokenURI = await readContract(config, {
                    abi: setStoneABI,
                    address: setStoneContractAddress,
                    functionName: 'tokenURI',
                    chainId: arbitrum.id,
                    args: [setStoneId],
                });

                setstone["tokenURI"] = tokenURI;

                set.setstones.push(setstone);
            }
        }

    }

    const setStoneCountOnChain = await readContract(config,
    {
        abi: setStoneABI,
        address: setStoneContractAddress,
        functionName: 'totalSupply',
        chainId: arbitrum.id,
    })


    if (number_of_stones_in_sets != setStoneCountOnChain) {
        console.log("Error: Number of stones in sets on chain does not match the number of stones in the sets object");
        console.log("Number of stones in sets on chain: ", setStoneCountOnChain);
        console.log("Number of stones in sets object: ", number_of_stones_in_sets);
    }
    

    return shows;
}


///////////////////////////
/// VowelSounds artifact
///////////////////////////
const vowelSoundContributions = await getVowelsoundContributions();


///////////BACK TO TONY

const blueRailroadCount = await readContract(config,
    {
        abi,
        address: blueRailroadContractAddress,
        functionName: 'totalSupply',
        chainId: optimism.id,
    })

let blueRailroads = {};

for (let i = 0; i < blueRailroadCount; i++) {
    let tokenId = await readContract(config, {
        abi,
        address: blueRailroadContractAddress,
        functionName: 'tokenByIndex',
        chainId: optimism.id,
        args: [i],
    });

    let ownerOfThisToken = await readContract(config, {
        abi,
        address: blueRailroadContractAddress,
        functionName: 'ownerOf',
        chainId: optimism.id,
        args: [tokenId],
    });

    let uriOfVideo = await readContract(config, {
        abi,
        address: blueRailroadContractAddress,
        functionName: 'tokenURI',
        chainId: optimism.id,
        args: [tokenId],
    });

    blueRailroads[tokenId] = {
        owner: ownerOfThisToken,
        uri: uriOfVideo,
        id: tokenId
    };

}



// And the current block number.
const mainnetBlockNumber = await fetchBlockNumber(config, {chainId: mainnet.id});
const optimismBlockNumber = await fetchBlockNumber(config, {chainId: optimism.id});
const optimismSepoliaBlockNumber = await fetchBlockNumber(config, {chainId: optimismSepolia.id});
let showsWithChainData = await appendChainDataToShows(shows);
let showsWithSetStoneData = await appendSetStoneDataToShows(showsWithChainData);

export const chainData = {
    blueRailroads: blueRailroads,
    mainnetBlockNumber: mainnetBlockNumber,
    optimismBlockNumber: optimismBlockNumber,
    optimismSepoliaBlockNumber: optimismSepoliaBlockNumber,
    showsWithChainData: showsWithSetStoneData,
    vowelSoundContributions: vowelSoundContributions,
}


serializeChainData(chainData);