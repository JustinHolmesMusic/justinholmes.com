import {createConfig, http, readContract, fetchBlockNumber} from '@wagmi/core';
import {mainnet, optimism, optimismSepolia} from '@wagmi/core/chains';
import {brABI as abi} from "../abi/blueRailroadABI.js";
import {liveSetABI} from "../abi/liveSetABI.js";

export const config = createConfig({
    chains: [mainnet, optimism, optimismSepolia],
    transports: {
        [mainnet.id]: http(),
        [optimism.id]: http(),
        [optimismSepolia.id]: http(),
    },
})

const blueRailroadAddress = "0xCe09A2d0d0BDE635722D8EF31901b430E651dB52";
const liveSetContractAddress = "0xd16B72c7453133eA4406237A83014F3f8a9d581F";

let bullshitCentralizedProvider;

// if (process.env.NODE_ENV === 'development') {
//     console.log("Using Infura in development.");
//     bullshitCentralizedProvider = infuraProvider({apiKey: '2096b0699ab146b1a019961a2a9f9127'});
// } else {
//     // Infrua seems to be working for now.
//     console.log("Using Infura in production.  Gross.");
//     bullshitCentralizedProvider = infuraProvider({apiKey: '2096b0699ab146b1a019961a2a9f9127'});
// }


// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, optimism]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'

// const {publicClient} = configureChains(chains, [bullshitCentralizedProvider])


const liveShowIDs = await readContract(config,
    {
        abi: liveSetABI,
        address: liveSetContractAddress,
        functionName: 'getShowIds',
        chainId: optimismSepolia.id,
    })

let showsAndTheirYAMLs = {};

// Iterate through show IDs and parse the data.
for (let i = 0; i < liveShowIDs.length; i++) {
    let showBytes = liveShowIDs[i];

// Remove the "0x" prefix
    const cleanString = showBytes.slice(2);

// Extract the two elements
    const uint8Hex = cleanString.slice(0, 4); // First two characters represent the uint8
    const uint64Hex = cleanString.slice(4, 20); // Next 16 characters represent the uint64

// Convert hex to integers
    const artist_id = parseInt(uint8Hex, 16);
    const blockheight = BigInt(`0x${uint64Hex}`);
    const likely_yaml_filename = `${artist_id}-${blockheight}.yaml`;
    showsAndTheirYAMLs[showBytes] = likely_yaml_filename;
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
    liveShowIDs: liveShowIDs
}

