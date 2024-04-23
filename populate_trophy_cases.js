import {configureChains, createConfig, readContract} from '@wagmi/core';
import {infuraProvider} from 'wagmi/providers/infura';
import {mainnet, optimism} from '@wagmi/core/chains';
import {w3mConnectors} from '@web3modal/ethereum';
// Import ./blueRailroadABI.json as JSON
import {brABI} from "./blueRailroadABI.js";

const blueRailroadAddress = "0xCe09A2d0d0BDE635722D8EF31901b430E651dB52";

let bullshitCentralizedProvider;

if (process.env.NODE_ENV === 'development') {
    console.log("Using Infura in development.");
    bullshitCentralizedProvider = infuraProvider({apiKey: '2096b0699ab146b1a019961a2a9f9127'});
} else {
    // Infrua seems to be working for now.
    console.log("Using Infura in production.  Gross.");
    bullshitCentralizedProvider = infuraProvider({apiKey: '2096b0699ab146b1a019961a2a9f9127'});
}


// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, optimism]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const minContributionAmount = 0.1;
const outbidAmountEpsilon = 0.01;

const {publicClient} = configureChains(chains, [bullshitCentralizedProvider])

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({projectId, chains}),
    publicClient
})

const blueRailroadCount = await readContract({
    abi: brABI,
    address: blueRailroadAddress,
    functionName: 'totalSupply',
    chainId: optimism.id,
})

let blueRailroads = {};

for (let i = 0; i < blueRailroadCount; i++) {
    let tokenId = await readContract({
        abi: brABI,
        address: blueRailroadAddress,
        functionName: 'tokenByIndex',
        chainId: optimism.id,
        args: [i],
    });

    let ownerOfThisToken = await readContract({
        abi: brABI,
        address: blueRailroadAddress,
        functionName: 'ownerOf',
        chainId: optimism.id,
        args: [tokenId],
    });

    blueRailroads[tokenId] = ownerOfThisToken;

}

export {blueRailroads};
