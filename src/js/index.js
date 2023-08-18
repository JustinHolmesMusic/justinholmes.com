import contractABI from './contributionABI.js'
import '../styles/style.css';
import {fetchBalance, writeContract} from '@wagmi/core'
import {EthereumClient, w3mConnectors, w3mProvider} from '@web3modal/ethereum'
import {Web3Modal} from '@web3modal/html'
import {configureChains, createConfig, fetchBlockNumber} from '@wagmi/core'
import {mainnet, goerli} from '@wagmi/core/chains'
import {readContract} from '@wagmi/core'
import {formatEther, parseEther} from "viem";

require.context('../images', false, /\.(png|jpe?g|gif|svg)$/);
require.context('../images/thumbnails', false, /\.(png|jpe?g|gif|svg)$/);

// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, goerli]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const contractAddress = '0xD49A66A88Fc85050a15aBa2F82Cb3eA8ac16a611';

/////////////
// Web3Modal Things
/////////////

const {publicClient} = configureChains(chains, [w3mProvider({projectId})])
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({projectId, chains}),
    publicClient
})
const ethereumClient = new EthereumClient(wagmiConfig, chains)
export const web3modal = new Web3Modal({
    projectId: projectId,
    themeVariables: {
        "--w3m-font-family": "monospace, sans-serif",
        "--w3m-accent-color": "blueviolet",
        "--w3m-background-color": "blueviolet",
    }
}, ethereumClient);


//////////////////
//// Funding Threshold Things
//////////////////

// Call updateFundingThreshold when DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
    updateFundingThreshold();
});

// Update the countdown every 1 second
async function updateFundingThreshold() {


    // Instead of awaiting these, do them concurrently.
    const balance = await fetchBalance({
        address: contractAddress,
        chainId: 5,
        formatUnits: "wei",
    });

    const thresholdInEth = await readContract({
        address: contractAddress,
        abi: contractABI,
        chainId: 5,
        functionName: 'threshold',
    });

    // Calculate the remaining amount needed to reach the threshold
    const remainingAmountInWei = Number(thresholdInEth) - Number(balance.value);

    // Convert the remaining amount to ETH
    const remainingAmount = formatEther(remainingAmountInWei);

    // Update the HTML element
    document.getElementById('remainingEth').textContent = remainingAmount;

    // If the threshold has been reached, stop the countdown
    if (remainingAmount <= 0) {
        // Put "hurrah" in the 'remainingEth' element
        document.getElementById('remainingEth').textContent = "hurrah";
    }
}


var x = setInterval(function () {
    updateCountdownDisplay();
}, 10000);

async function updateCountdownDisplay() {

    const deadline = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deadline',
        chainId: 5,
    });

    console.log('Deadline: ', deadline);

    let countDownDate = Number(deadline) * 1000;
    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the counter-downer date
    let distance = countDownDate - now;

    // If the countdown is finished, write some text
    if (distance < 0) {
        clearInterval(x);
        document.getElementById("countdown").innerHTML = "EXPIRED";
        return;
    }

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById("countdown").innerHTML =
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";


}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("contribute-button").onclick = contribute;
});

function setMinPreset() {
    document.getElementById("user-amount").value = 0.1;
}

function setTenPreset() {
    document.getElementById("user-amount").value = 0.5;  // TODO: read from contract
}

function setLeaderPreset() {
    document.getElementById("user-amount").value = 1;  // TODO: read from contract
}

async function contribute() {

    let userAmount = document.getElementById("user-amount").value;

    const {hash} = await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'contribute',  // TODO: if they combined, this needs to be contributeAndCombine
        value: parseEther(userAmount),
        chainId: 5,
    })
}

var x = setInterval(function () {
    updateFundingThreshold();
}, 10000);


//////////////////
//// Contributors Table Things
//////////////////


// Call updateContributorsTable when DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
    updateContributorsTable();
});

async function updateContributorsTable() {

    const contributors = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'contributionsByAddress',
        chainId: 5,
    });

    return;

    // Assuming the smart contract has a method 'getContributors' to fetch the array of contributors
    myContract.methods.contributors().call()
        .then((contributors) => {
            // Get the table body
            const tableBody = document.getElementById('contributorsTable');

            // Clear the table body
            tableBody.innerHTML = "";

            // Loop through the contributors and append a row for each
            contributors.forEach((contributorAddress, index) => {
                // Create a new row and cells
                let row = document.createElement('tr');
                let th = document.createElement('th');
                let td = document.createElement('td');

                // Set the cell contents
                th.textContent = index + 1; // Add 1 to index to start counting from 1
                td.textContent = contributorAddress;

                // Add the cells to the row
                row.appendChild(th);
                row.appendChild(td);

                // Add the row to the table body
                tableBody.appendChild(row);
            });
        })
        .catch((error) => console.error);
}

// updateContributorsTable()
