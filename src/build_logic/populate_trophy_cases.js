// import {w3mConnectors} from '@web3modal/ethereum';
// Import ./blueRailroadABI.json as JSON
import {createConfig, http, readContract, fetchBlockNumber} from '@wagmi/core';
import {mainnet, optimism} from '@wagmi/core/chains';
import {brABI as abi} from "../abi/blueRailroadABI.js";

export const config = createConfig({
    chains: [mainnet, optimism],
    transports: {
        [mainnet.id]: http(),
        [optimism.id]: http(),
    },
})

const blueRailroadAddress = "0xCe09A2d0d0BDE635722D8EF31901b430E651dB52";

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

export const chainData = {
    blueRailroads: blueRailroads,
    mainnetBlockNumber: mainnetBlockNumber,
    optimismBlockNumber: optimismBlockNumber
}

