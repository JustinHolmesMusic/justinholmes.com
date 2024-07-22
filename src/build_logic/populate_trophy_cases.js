import {createConfig, http, readContract, fetchBlockNumber} from '@wagmi/core';
import {mainnet, optimism, optimismSepolia} from '@wagmi/core/chains';
import {brABI as abi} from "../abi/blueRailroadABI.js";
import {setStoneABI} from "../abi/setStoneABI.js";
import fs from 'fs';
import {fileURLToPath} from "url";
import path from "path";
import {liveShowIDs} from "./show_and_set_data.js";

export const config = createConfig({
    chains: [mainnet, optimism, optimismSepolia],
    transports: {
        [mainnet.id]: http(),
        [optimism.id]: http(),
        [optimismSepolia.id]: http(),
    },
})

const blueRailroadAddress = "0xCe09A2d0d0BDE635722D8EF31901b430E651dB52";
const setStoneContractAddress = "0xD43e38D81C083CD28AdBC41754A3850DaC62bC46";


//////////////



let showSetStoneData = {}

// Iterate through show IDs and parse the data.
for (let i = 0; i < liveShowIDs.length; i++) {

    // Split ID by "-" into artist_id and blockheight
    const showID = liveShowIDs[i];
    const [artist_id, blockheight] = showID.split('-');

    // Read the contract using the getShowData function
    const showData = await readContract(config, {
        abi: setStoneABI,
        address: setStoneContractAddress,
        functionName: 'getShowData',
        chainId: optimismSepolia.id,
        args: [artist_id, blockheight],
    });
    showSetStoneData[showID] = showData;
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
    liveShowIDs: liveShowIDs,
}
