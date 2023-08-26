import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'popper.js';
import 'tippy.js'
import 'tippy.js/dist/tippy.css'
import $ from 'jquery';
import 'spotlight.js';

import contractABI from './contributionABI.js'
import '../styles/style.css';
import {fetchBalance, fetchEnsName, writeContract} from '@wagmi/core'
import {EthereumClient, w3mConnectors, w3mProvider} from '@web3modal/ethereum'
import {Web3Modal} from '@web3modal/html'
import {configureChains, createConfig, fetchBlockNumber} from '@wagmi/core'
import {mainnet, goerli} from '@wagmi/core/chains'
import {readContract} from '@wagmi/core'
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

// Contract with min bid of 0.1 ETH and threshold of 10 ETH
// const contractAddress = '0x6Fc000Ba711d333427670482853A4604A3Bc0E03';

// Contract with min bid of 0.001 ETH and threshold of 0.1 ETH
const contractAddress = '0xb96a231384eeea72a0edf8b2e896fa4bacaa22ff';


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
    hookupBootstrapLinkButtons();
    hookupContributeButton();
    updateCountdownDisplay();
    updateContributorsTable();
    document.getElementById("min-preset").onclick = setMinPreset;
    setMinContributionAmount();
});

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
    document.getElementById('remainingEth').textContent = remainingAmount;

    // If the threshold has been reached, stop the countdown
    if (remainingAmount <= 0) {
        // Put "hurrah" in the 'remainingEth' element
        document.getElementById('remainingEth').textContent = "hurrah";
    }
}


var x = setInterval(function () {
    updateCountdownDisplay();
}, 1000); // This is unfortunate, because we are reading the contract every second and making many requests

async function updateCountdownDisplay() {

    const materialReleaseConditionMet = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'materialReleaseConditionMet',
        chainId: chainId,
    });


    if (!materialReleaseConditionMet) {
        // Show the countdown only after the material is set for release
        return;
    }

    const deadline = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'deadline',
        chainId: chainId,
    });


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

    tippy('#countdown', {
        content: "If no one bids before this timer expires, the contract will be closed and the funding will end. If you contribute, the countdown will reset.",
        placement: "bottom"
    });
}

function setMinPreset() {
    document.getElementById("user-amount").value = minContributionAmount;
}

function isUserInTopN(topContributions, address, n) {
    for(var i = 0; i < Math.min(n, topContributions.length); i++) {
        if (topContributions[i][1] == address) {
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
    const contributeButton = document.getElementById('contribute-button');
    const inputElement = document.getElementById('user-amount');

    contributeButton.addEventListener('click', async function(event) {
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

    setTimeout(function() {
        $(alertDiv).fadeOut(1000, function() {
            alertDiv.remove();
        }
    )}, 2000);
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
}, 10000);


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
    for (var i = 0; i < leaderRows.length; i++) {
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


const vowelSoundsImageFiles = ['a.jpg', 'i.jpg', 'oe.jpg'];

function chooseNewImage() {
    // Randomly select an image from along the vowel sounds image files
    let randomImageFile = vowelSoundsImageFiles[Math.floor(Math.random() * vowelSoundsImageFiles.length)];
    return randomImageFile;
}

let randomImageFile = chooseNewImage();
document.getElementById("album-letter-image").src = "images/" + randomImageFile;

function setNewImage() {
    let currentImage = randomImageFile;
    while (randomImageFile == currentImage) {
        randomImageFile = chooseNewImage();
    }

    // Fade the old image out, and the new one in, using jquery
    $("#album-letter-image").fadeOut(100, function () {
        document.getElementById("album-letter-image").src = "images/" + randomImageFile;
        $("#album-letter-image").fadeIn(100);
    });
}


var x = setInterval(function () {
    setNewImage();
}, 10000);
