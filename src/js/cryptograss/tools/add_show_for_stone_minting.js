import { createConfig, http, readContract, writeContract } from '@wagmi/core';
import { optimismSepolia, arbitrum } from '@wagmi/core/chains';
import Web3 from 'web3';
import $ from 'jquery';
import {createWeb3Modal} from '@web3modal/wagmi'
import {setStoneContractAddress} from '../../constants.js';

export const config = createConfig({
    chains: [optimismSepolia, arbitrum],
    transports: {
        [optimismSepolia.id]: http(),
        [arbitrum.id]: http(),
    },
})

const web3 = new Web3();
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
import {setStoneABI as contractABI} from "../../../abi/setStoneABI.js";

function keccak256(value) {
    return web3.utils.soliditySha3({ type: "string", value: value});
}

function parseShapes() {
    let shapesInput = $('#shapes').val();
    return shapesInput.split('\n').map(Number);
}


async function makeShowAvailableForStoneMinting() {
    let artist_id = parseInt($('#artist_id').val());
    let blockheight = parseInt($('#blockheight').val());
    let shapes = parseShapes()
    let numberOfSets = parseInt($('#numberOfSets').val());
    let stonePriceEth = parseFloat($('#stonePriceEth').val());
    let stonePriceWei = web3.utils.toWei(stonePriceEth, 'ether');

    // parser the rabbit secrets
    // split them by newline
    let rabbitSecrets = $('#rabbitSecrets').val().split('\n');

    // compute keccak256 hash of each secret
    let rabbitHashes = rabbitSecrets.map(secret => keccak256(secret));

    const result = await writeContract(config, {
        address: setStoneContractAddress,
        abi: contractABI,
        functionName: "makeShowAvailableForStoneMinting",
        chainId: arbitrum.id,
        args: [artist_id, blockheight, rabbitHashes, numberOfSets, shapes, stonePriceWei],
    });
}

document.addEventListener('DOMContentLoaded', () => {

    const modal = createWeb3Modal({
        wagmiConfig: config,
        projectId,
    });

    window.makeShowAvailableForStoneMinting = makeShowAvailableForStoneMinting;

    // show the etherscan link
    // document.getElementById("contractEtherscanLink").href = `https://sepolia-optimism.etherscan.io/address/${contractAddress}#code`;
});