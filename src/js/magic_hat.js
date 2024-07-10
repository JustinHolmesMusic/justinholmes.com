import { createConfig, http, readContract, writeContract } from '@wagmi/core';
import { optimismSepolia } from '@wagmi/core/chains';
import Web3 from 'web3';
import $ from 'jquery';
import {createWeb3Modal} from '@web3modal/wagmi'

export const config = createConfig({
    chains: [optimismSepolia],
    transports: {
        [optimismSepolia.id]: http(),
    },
})

const web3 = new Web3();
const contractAddress = '0xD3564C0E5C3A78d507B2E039A8F519B195aBAF55';
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
import {mhABI as contractABI} from "../abi/magichatABI.js";


function keccak256(value) {
    return web3.utils.soliditySha3(value);
}

function verifyRabbit() {
    const secretRabbit = document.getElementById("secretRabbit");
    // compute the keccak256 hash of the secretRabbit.value
    const hash = keccak256(secretRabbit.value);
    // check if the hash is in the valid_rabbit_hashes array
    if (valid_rabbit_hashes.includes(hash)) {
        document.getElementById("verifyResult").innerHTML = "Valid rabbit";
    } else {
        document.getElementById("verifyResult").innerHTML = "Invalid rabbit";
    }
}

async function makePayment() {
    const secretRabbit = document.getElementById("secretRabbit").value;
    const amount = document.getElementById("amount").value;

    window.web3 = web3
    console.log(web3.utils.toWei(amount, 'ether'))

    const result = await writeContract(config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'makePayment',
        chainId: optimismSepolia.id,
        args: [secretRabbit],
        value: web3.utils.toWei(amount, 'ether'),
    });

}

document.addEventListener('DOMContentLoaded', () => {

    const modal = createWeb3Modal({
        wagmiConfig: config,
        projectId,
    });
    console.log("Modal created");

    window.verifyRabbit = verifyRabbit;
    window.makePayment = makePayment;
});

console.log("magic hat loaded");