import {createConfig, http, readContract, fetchBlockNumber} from '@wagmi/core';
import {mainnet, optimism, optimismSepolia} from '@wagmi/core/chains';
import {brABI as abi} from "../abi/blueRailroadABI.js";
import {setStoneABI} from "../abi/setStoneABI.js";
import {JsonRpcVersionUnsupportedError} from 'viem';

function stringify(obj) {
    // Custom replacer function to handle BigInt
    return JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2);
}


export const config = createConfig({
    chains: [mainnet, optimism, optimismSepolia],
    transports: {
        [mainnet.id]: http(),
        [optimism.id]: http(),
        [optimismSepolia.id]: http(),
    },
})

const blueRailroadAddress = "0xCe09A2d0d0BDE635722D8EF31901b430E651dB52";
const setStoneContractAddress = "0xdFa0f0633514d10Dab3FB9B2bcac17f0b883ee0a";

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
            chainId: optimismSepolia.id,
            args: [artist_id, blockheight],
        });

        // (bytes32 showBytes1, uint16 stonesPossible1, uint8 numberOfSets1, uint256 stonePrice1, bytes32[] memory rabbitHashes1)
        // This is the return type of the solidity getShowData function
        // unpack the showData
        const unpackedShowData = {
            showBytes: showData[0],  // This is actually just artist_id and blockheight again
            stonesPossible: showData[1],
            numberOfSets: showData[2],
            stonePrice: showData[3],
            rabbitHashes: showData[4],
            setShapes: showData[5],

        };

        show["artist_id"] = parseInt(artist_id);
        show["blockheight"] = parseInt(blockheight)
        show["rabbit_hashes"] = unpackedShowData.rabbitHashes;
        show["stone_price"] = unpackedShowData.stonePrice;
        show["set_shapes"] = unpackedShowData.setShapes;

        // integrity check: the number of sets on chain is the same as the number of sets in the yaml, raise an error if not
        if (unpackedShowData.numberOfSets !== Object.keys(show.sets).length) {
            // throw new Error(`Number of sets on chain (${unpackedShowData.numberOfSets}) does not match the number of sets in the yaml (${show.sets.length}) for show ID ${show_id}`);
            console.log(`Error: Number of sets on chain (${unpackedShowData.numberOfSets}) does not match the number of sets in the yaml (${show.sets.length}) for show ID ${show_id}`);
        }

        // showSetStoneData[showID] = showData;
    }
    // console.log("shows", stringify(shows));
    return shows;
}

///////////BACK TO TONY

const blueRailroadCount = await readContract(config,
    {
        abi,
        address: blueRailroadAddress,
        functionName: 'totalSupply',
        chainId: optimism.id,
    })

let blueRailroads = {};

for (let i = 0; i < blueRailroadCount; i++) {
    let tokenId = await readContract(config, {
        abi,
        address: blueRailroadAddress,
        functionName: 'tokenByIndex',
        chainId: optimism.id,
        args: [i],
    });

    let ownerOfThisToken = await readContract(config, {
        abi,
        address: blueRailroadAddress,
        functionName: 'ownerOf',
        chainId: optimism.id,
        args: [tokenId],
    });

    let uriOfVideo = await readContract(config, {
        abi,
        address: blueRailroadAddress,
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


export const chainData = {
    blueRailroads: blueRailroads,
    mainnetBlockNumber: mainnetBlockNumber,
    optimismBlockNumber: optimismBlockNumber,
    optimismSepoliaBlockNumber: optimismSepoliaBlockNumber,
}
