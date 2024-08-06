import { createConfig, http, writeContract, getAccount } from '@wagmi/core';
import { optimismSepolia } from '@wagmi/core/chains';
import Web3 from 'web3';
import {createWeb3Modal} from '@web3modal/wagmi'
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // optional for styling
import jazzicon from 'jazzicon';
import { generateDiamondPattern, generateDiamondPatternFromNesPalette } from '../../setstone_drawing.js';
import { nesPalette } from '../../constants.js';
import { setStoneContractAddress } from '../../constants.js';

export const config = createConfig({
    chains: [optimismSepolia],
    transports: {
        [optimismSepolia.id]: http(),
    },
})

const web3 = new Web3();
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
    let secret_rabbit = url_params.rabbit || '';

    // compute the weccak256 hash of the secretRabbit.value
    const hash = keccak256(secret_rabbit);
    // check if the hash is in the valid_rabbit_hashes array

    if (valid_rabbit_hashes.includes(hash)) {
        // document.getElementById("verifyResult").innerHTML = "Valid rabbit";
    } else {
        tippy('verifyResult', { content: 'Invalid secret rabbit' });
        document.getElementById("donationModal").style.display = "none";
        document.getElementById("invalidRabbitErrorMessage").style.display = "block";
    }
}

async function mintStone() {
    const account = getAccount(config);
    const address = account?.address;
    const secretRabbit = getUrlParameters().rabbit;
    const amount = document.getElementById("amount").value;

    window.web3 = web3;

    if (!address) {
        console.error("No address found. Please connect your wallet.");
        return;
    }

    const order = document.getElementById("setPicker").value;


    // color1, color2, color3 are the indices of the colors in the nesPalette
    const color1 = Object.values(nesPalette).indexOf(document.getElementById("colorDropdown1").value);
    const color2 = Object.values(nesPalette).indexOf(document.getElementById("colorDropdown2").value);
    const color3 = Object.values(nesPalette).indexOf(document.getElementById("colorDropdown3").value);


    const crystalizationMessage = document.getElementById("crystalizationMessageText").value;

    const args = [
        address,
        artist_id,
        blockheight,
        order,
        color1,
        color2,
        color3,
        crystalizationMessage,
        secretRabbit
    ];


    /// TODO: call the right contract
    const result = await writeContract(config, {
        address: setStoneContractAddress,
        abi: setStoneABI,
        functionName: 'mintStone',
        chainId: optimismSepolia.id,
        args: args,
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

function createColorDropdown(palette, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    
    for (const [colorName, colorValue] of Object.entries(palette)) {
        const option = document.createElement('option');
        option.value = colorValue;
        option.style.backgroundColor = colorValue;
        option.innerHTML = colorName;
        dropdown.appendChild(option);
    }
    dropdown.addEventListener('change', () => onColorChange(dropdownId));
}

function createColorDropdowns() {
    createColorDropdown(nesPalette, 'colorDropdown1');
    createColorDropdown(nesPalette, 'colorDropdown2');
    createColorDropdown(nesPalette, 'colorDropdown3');
    randomizeColors();
}

function onColorChange(colorDropdownId) {
    const colorDropdown = document.getElementById(colorDropdownId);
    const color = colorDropdown.value;

    // set the current selected color as the background color of the dropdown
    colorDropdown.style.backgroundColor = color;
    renderSetStone();
}

function renderSetStone() {
    const stoneRenderArea = document.getElementById("stoneRenderArea");
    // clean the stoneRenderArea
    stoneRenderArea.innerHTML = "";

    const color1 = document.getElementById('colorDropdown1').value;
    const color2 = document.getElementById('colorDropdown2').value;
    const color3 = document.getElementById('colorDropdown3').value;

    generateDiamondPattern(color1, color2, color3, "transparent", "stoneRenderArea");

}

function randomizeColors() {
    let dropdowns = [document.getElementById('colorDropdown1'), document.getElementById('colorDropdown2'), document.getElementById('colorDropdown3')]

    // randomize the selected color of each dropdown
    // select random color from the nesPalette

    dropdowns.forEach(dropdown => {
        const randomColorIndex = Math.floor(Math.random() * Object.keys(nesPalette).length);
        // select randomColorIndex-th option from the dropdown
        dropdown.selectedIndex = randomColorIndex;
        onColorChange(dropdown.id);
    });
}

window.generateDiamondPatternFromNesPalette = generateDiamondPatternFromNesPalette;


document.addEventListener('DOMContentLoaded', () => {
    tippy('[data-tippy-content]');

    const modal = createWeb3Modal({
        wagmiConfig: config,
        projectId,
    });

    window.mintStone = mintStone;
    window.setAmount = setAmount;
    window.randomizeColors = randomizeColors;
    verifyRabbit();
    showHash();
    showStonePrice();
    createColorDropdowns();
});