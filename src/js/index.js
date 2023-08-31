import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'popper.js';
import 'tippy.js'
import 'tippy.js/dist/tippy.css'
import $ from 'jquery';
import 'spotlight.js';

import contractABI from './contributionABI.js'
import '../styles/style.css';
import {configureChains, createConfig, fetchBalance, fetchEnsName, readContract, writeContract} from '@wagmi/core'
import {EthereumClient, w3mConnectors} from '@web3modal/ethereum'
import {Web3Modal} from '@web3modal/html'
import {goerli, mainnet} from '@wagmi/core/chains'
import {infuraProvider} from 'wagmi/providers/infura'
import {formatEther, parseEther} from "viem";
import tippy from 'tippy.js';

require.context('../images', false, /\.(png|jpe?g|gif|svg)$/);
require.context('../images/thumbnails', false, /\.(png|jpe?g|gif|svg)$/);

// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, goerli]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const minContributionAmount = 0.001;
const outbidAmountEpsilon = 0.0001;
const chainId = 5;

// Final test contract deployed on Goerli with initialWindow feature
const contractAddress = '0x96ebdf35199219BDd16E3c3E1aD8C89C9185b734';


/////////////
// Web3Modal Things
/////////////

const {publicClient} = configureChains(chains, [
    // w3mProvider({projectId}),
    infuraProvider({apiKey: '2096b0699ab146b1a019961a2a9f9127'})])

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
    openBooklet();
    updateFundingThreshold();
    hookupBootstrapLinkButtons();
    hookupContributeButton();
    updateCountdownDisplay();
    updateContributorsTable();
    document.getElementById("min-preset").onclick = setMinPreset;
    setMinContributionAmount();
    fetchCountdownContractData();
    updateCountdownDisplay();
});

let currentBookletPage = 1;
let maxBookletPage = document.querySelectorAll('[data-booklet-page]').length;


function openBooklet() {
    let firstPage = document.querySelector('[data-booklet-page="1"]');
    document.getElementById("booklet-content").innerHTML = firstPage.innerHTML;
    setupBookletNavigation();
}

function getNextBookletPage() {
    currentBookletPage = currentBookletPage + 1;
    if (currentBookletPage > maxBookletPage) {
        currentBookletPage = 1;
    }
    return currentBookletPage;
}

function setupBookletNavigation() {
    document.getElementById("next-booklet-page").onclick = () => {
        let nextBookletPage = getNextBookletPage();
        let selector = `[data-booklet-page="${nextBookletPage}"]`;
        let nextBookletPageElement = document.querySelector(selector);
        document.getElementById("booklet-content").innerHTML = nextBookletPageElement.innerHTML;
        setupBookletNavigation();
    };
}

function setMinContributionAmount() {
    document.getElementById("min-preset").innerHTML = minContributionAmount + " ETH";
}


// Update the countdown every 1 second
async function updateFundingThreshold() {


    // Instead of awaiting these, do them concurrently.
    const balance = await fetchBalance({
        address: contractAddress,
        chainId: chainId,
        formatUnits: "wei",
    });

    const thresholdInEth = await readContract({
        address: contractAddress,
        abi: contractABI,
        chainId: chainId,
        functionName: 'threshold',
    });

    // Calculate the remaining amount needed to reach the threshold
    const remainingAmountInWei = Number(thresholdInEth) - Number(balance.value);

    // Convert the remaining amount to ETH
    const remainingAmount = formatEther(remainingAmountInWei);

    // Update the HTML element
    document.getElementById('remainingEth').textContent = remainingAmount + " ETH";

    // If the threshold has been reached, stop the countdown
    if (remainingAmount <= 0) {
        // Put "hurrah" in the 'remainingEth' element
        document.getElementById('remainingEth').textContent = "Album Dropped 🎉";
    }
}

let isKeySet = false;
let materialReleaseConditionMet = false;
let deadline;

// Fetch contract data initially and every 20 seconds
async function fetchCountdownContractData() {
    isKeySet = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'isKeySet',
        chainId: chainId,
    });

    materialReleaseConditionMet = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'materialReleaseConditionMet',
        chainId: chainId,
    });

    deadline = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deadline',
        chainId: chainId,
    });
}

// Update the countdown display based on the fetched data
function updateCountdownDisplay() {

    let countDownDate = Number(deadline) * 1000;
    let now = new Date().getTime();
    let distance = countDownDate - now;

    if (deadline === undefined) {
        // If the deadline is undefined, most likely there is some kind of network error reading the contract.
        document.getElementById("countdown").innerHTML = "-";
        return;
    } else if (!isKeySet) {
        document.getElementById("countdown").innerHTML = "Waiting for Artist to Upload Encrypted Material 🕰️";
        return;
    } else if (distance < 0) {
        clearInterval(countdownInterval);
        // document.getElementById("countdown").innerHTML = "Artist Funded 🎉";
        document.getElementById("countdown").innerHTML = "Artist Funded 🎉";
        return;
    }

    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML =
        days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

    tippy('#countdown', {
        content: "If no one bids before this timer expires, the contract will be closed and the funding will end. If you contribute, the countdown will reset.",
        placement: "bottom"
    });
}


setInterval(fetchCountdownContractData, 20000);
let countdownInterval = setInterval(updateCountdownDisplay, 1000);


function setMinPreset() {
    document.getElementById("user-amount").value = minContributionAmount;
}

function isUserInTopN(topContributions, address, n) {
    for (let i = 0; i < Math.min(n, topContributions.length); i++) {
        if (topContributions[i][1] === address) {
            return true;
        }
    }

    return false;
}


function amountOfEthToGetIntoTopN(contributionsByAddress, userAddress, combine, n) {
    let topContributions = getTopContributions(contributionsByAddress);

    if (isUserInTopN(topContributions, userAddress, n)) {
        return 0;
    }

    if (topContributions.length < n) {
        return minContributionAmount;
    }

    let nthContributionAmount = topContributions[n - 1][0];
    nthContributionAmount = Number(formatEther(nthContributionAmount));


    if (!combine) {
        return nthContributionAmount + outbidAmountEpsilon;
    }


    // If the user hasn't contributed yet
    if (contributionsByAddress[userAddress] == undefined) {
        return nthContributionAmount + outbidAmountEpsilon;
    }


    let alreadyContributed = Number(formatEther(contributionsByAddress[userAddress][0]));
    return nthContributionAmount - alreadyContributed + outbidAmountEpsilon;
}

function setTenPreset(contributionsByAddress) {
    if (!isWalletConnected()) {
        showWalletNotConnectedError();
        return;
    }

    // contributionsByAddress is a dictionary of address -> [amount, amount, amount, ...]
    let combine = document.getElementById("combine-contribution-toggle").checked;
    let userAmountElement = document.getElementById("user-amount");
    let userAddress = ethereumClient.getAccount()["address"];
    let amountToGetIntoTopTen = amountOfEthToGetIntoTopN(contributionsByAddress, userAddress, combine, 10);

    // Round to 5 decimal places
    amountToGetIntoTopTen = Math.ceil(amountToGetIntoTopTen * 100000) / 100000;

    if (amountToGetIntoTopTen == 0) {
        showError("You're already in the top 10");
        return;
    }

    userAmountElement.value = amountToGetIntoTopTen;
}

function setLeaderPreset(contributionsByAddress) {
    if (!isWalletConnected()) {
        showWalletNotConnectedError();
        return;
    }

    let combine = document.getElementById("combine-contribution-toggle").checked;
    let userAmountElement = document.getElementById("user-amount");
    let userAddress = ethereumClient.getAccount()['address'];
    let amountToGetIntoTopTen = amountOfEthToGetIntoTopN(contributionsByAddress, userAddress, combine, 1);

    // Round to 5 decimal places
    amountToGetIntoTopTen = Math.ceil(amountToGetIntoTopTen * 100000) / 100000;

    if (amountToGetIntoTopTen == 0) {
        showError("You're already in the leader spot");
        return;
    }

    userAmountElement.value = amountToGetIntoTopTen;
}

function hookupBootstrapLinkButtons() {
    const btnLinks = document.querySelectorAll('.button-link');
    btnLinks.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const href = this.getAttribute('data-href');
            window.open(href, '_blank');
        });
    });
}

function hookupContributeButton() {
    const contributeButton = document.getElementById('pay');
    const inputElement = document.getElementById('user-amount');

    contributeButton.addEventListener('click', async function (event) {
        if (event.target !== inputElement) {
            await contribute();
        }
    });
}

function showError(text) {
    var alertDiv = document.createElement("div");
    alertDiv.className = "alert alert-danger position-fixed top-0 start-50 translate-middle-x";
    alertDiv.style.marginTop = "50px";
    alertDiv.role = "alert";
    alertDiv.innerHTML = `<strong>Error:</strong> ${text}`;

    document.body.appendChild(alertDiv);

    setTimeout(function () {
        $(alertDiv).fadeOut(1000, function () {
                alertDiv.remove();
            }
        )
    }, 2000);
}

function showWalletNotConnectedError() {
    showError("Please connect a wallet first");
}

async function contribute() {
    if (!isWalletConnected()) {
        showWalletNotConnectedError();
        return;
    }

    let userAmount = document.getElementById("user-amount").value;
    let combine = document.getElementById("combine-contribution-toggle").checked;

    // if `combine` is true, we need to call contributeAndCombine, otherwise we call contribute
    let functionToCall = combine ? 'contributeAndCombine' : 'contribute';

    const {hash} = await writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: functionToCall,
        value: parseEther(userAmount),
        chainId: chainId,
    });
}

var x = setInterval(function () {
    updateFundingThreshold();
}, 20000);


//////////////////
//// Contributors Table Things
//////////////////
function isWalletConnected() {
    return ethereumClient.getAccount()['isConnected'];
}

function getContributionsByAddress(contributionsMetadata) {

    let contributionsByAddress = {}

    let contributors = contributionsMetadata[0]
    let amounts = contributionsMetadata[1]
    let combined = contributionsMetadata[2]
    let datetimes = contributionsMetadata[3]

    for (var i = 0; i < contributors.length; i++) {

        const address = contributors[i]
        if (!(address in contributionsByAddress)) {
            contributionsByAddress[address] = []
        }

        const is_combined = combined[i]
        const amount = amounts[i]
        const contributionMoment = datetimes[i]

        if (is_combined) {
            if (contributionsByAddress[address].length == 0) {
                console.log("wtf");
                // This ought to be an impossible situaiton - how did they dcombine with a bid that didn't exist?
                contributionsByAddress[address].push(0)
            }
            contributionsByAddress[address][0] += amount
        } else {
            contributionsByAddress[address].push(amount)
        }
    }
    return contributionsByAddress;
}

function getTopContributions(contributionsByAddress) {
    let topContributions = []
    for (let address in contributionsByAddress) {
        let contributions = contributionsByAddress[address];
        for (var c = 0; c < contributions.length; c++) {
            topContributions.push([contributions[c], address]);
        }
    }

    function compareContributions(a, b) {
        if (a[0] > b[0]) {
            return -1;
        }
        if (a[0] < b[0]) {
            return 1;
        }
        return 0;
    }

    topContributions.sort(compareContributions);
    return topContributions;
}


function getLeaderboardTableBody() {
    const leaderboardTable = document.getElementById('leaderboard-table');
    return leaderboardTable.getElementsByTagName("tbody")[0];
}


async function updateContributorsTable() {

    const contributionsMetadata = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getAllContributions',
        chainId: chainId,
    });

    let contributionsByAddress = getContributionsByAddress(contributionsMetadata)

    // Inject the contributionsByAddress into the Take the Lead / Top 10 buttons onclick functions
    // We avoid making another call to the contract when the user clicks one of those buttons, saving 400ms and making the UI more responsive.
    document.getElementById("ten-preset").onclick = () => setTenPreset(contributionsByAddress);
    document.getElementById("leader-preset").onclick = () => setLeaderPreset(contributionsByAddress);

    // array, sorted by contribution amount, of arrays of [amount, address]
    let leaders = getTopContributions(contributionsByAddress)
    const leaderRows = getLeaderboardTableBody().getElementsByTagName('tr');

    // Loop through the contributors and append a row for each
    for (let i = 0; i < leaderRows.length; i++) {
        let row = leaderRows[i];
        let thisLeader = leaders[i];

        if (thisLeader == undefined) {
            console.log("Not enough leaders to fill the rows.")
            return;
        }

        let bidSlot = row.getElementsByTagName('td')[1];
        let addressSlot = row.getElementsByTagName('td')[2];

        let amountInWei = thisLeader[0];
        bidSlot.innerHTML = formatEther(amountInWei) + " ETH";


        let ensName = await fetchEnsName({address: thisLeader[1], chainId: 1});
        if (ensName == undefined) {
            ensName = thisLeader[1];
        }
        addressSlot.innerHTML = ensName;
    }
    ;

}
