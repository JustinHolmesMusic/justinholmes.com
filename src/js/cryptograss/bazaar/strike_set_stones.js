import { createConfig, http, writeContract } from '@wagmi/core';
import { optimismSepolia } from '@wagmi/core/chains';
import Web3 from 'web3';
import {createWeb3Modal} from '@web3modal/wagmi'
import tippy from 'tippy.js';
import jazzicon from 'jazzicon';
import { generateDiamondPattern, nesPalette, setstoneColors } from '../../shapes.js';

export const config = createConfig({
    chains: [optimismSepolia],
    transports: {
        [optimismSepolia.id]: http(),
    },
})

const web3 = new Web3();
const setStoneContractAddress = "0xEF9c5924Ef8d4431B6Dc8843762Ac3c0fE526dFC";
const projectId = '3e6e7e58a5918c44fa42816d90b735a6';
import {setStoneABI } from "../../../abi/setStoneABI.js";


function keccak256(value) {
    return web3.utils.soliditySha3(value);
}

function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    let paramObj = {};
    for (const [key, value] of params.entries()) {
        paramObj[key] = value;
    }
    return paramObj;
}


function verifyRabbit() {
    const url_params = getUrlParameters();

    // compute the keccak256 hash of the secretRabbit.value
    const hash = keccak256(url_params.rabbit);
    // check if the hash is in the valid_rabbit_hashes array
    if (valid_rabbit_hashes.includes(hash)) {
        // document.getElementById("verifyResult").innerHTML = "Valid rabbit";
        console.log("Valid rabbit");
    } else {
        tippy('verifyResult', { content: 'Invalid secret rabbit' });
        document.getElementById("donationModal").style.display = "none";
        document.getElementById("invalidRabbitErrorMessage").style.display = "block";
    }
}

async function makePayment() {
    const secretRabbit = getUrlParameters().rabbit;
    const amount = document.getElementById("amount").value;

    window.web3 = web3
    console.log(web3.utils.toWei(amount, 'ether'))

    /// TODO: call the right contract
    const result = await writeContract(config, {
        address: setStoneContractAddress,
        abi: setStoneABI,
        functionName: 'makePayment',
        chainId: optimismSepolia.id,
        args: [secretRabbit],
        value: web3.utils.toWei(amount, 'ether'),

    });

}

function showHash() {
    const secretRabbit = getUrlParameters().rabbit;

    // compute the keccak256 hash of the secretRabbit.value
    const hash = keccak256(secretRabbit);
    document.getElementById("rabbithash").innerHTML = hash;

    // show the jazzicon
    var el = jazzicon(48, hash);
    document.getElementById("rabbitHashIcon").appendChild(el);
}

function setAmount(amount) {
    document.getElementById("amount").value = amount;
}

function showStonePrice() {
    const stonePriceElement = document.getElementById("stonePrice");
    // convert value of the variable stone_price_wei to ETH

    const stonePriceEth = web3.utils.fromWei(stone_price_wei.toString(), 'ether');
    stonePriceElement.innerHTML = stonePriceEth + ' ETH';
}



document.addEventListener('DOMContentLoaded', () => {

    const modal = createWeb3Modal({
        wagmiConfig: config,
        projectId,
    });
    console.log("Modal created");

    window.makePayment = makePayment;
    window.setAmount = setAmount;
    verifyRabbit();
    showHash();
    showStonePrice();
});

