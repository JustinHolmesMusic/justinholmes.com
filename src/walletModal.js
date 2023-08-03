import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/html'
import { configureChains, createConfig } from '@wagmi/core'
import { arbitrum, mainnet, polygon } from '@wagmi/core/chains'

// Equivalent to importing from @wagmi/core/providers
const chains = [arbitrum, mainnet, polygon]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'

const {publicClient} = configureChains(chains, [w3mProvider({projectId})])
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({projectId, chains}),
    publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)
export const web3modal = new Web3Modal({projectId}, ethereumClient)

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('connect-wallet').addEventListener('click', () => {
        web3modal.openModal();
    });
});