import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import {Toast} from 'bootstrap';
import 'popper.js';
import 'tippy.js'
import 'tippy.js/dist/tippy.css'
import $ from 'jquery';
import 'spotlight.js';
import {encode, decode} from "@msgpack/msgpack";

import contractABI from './contributionABI.js'
import '../styles/style.css';
import {
    configureChains,
    createConfig,
    fetchBalance,
    fetchEnsName,
    readContract,
    waitForTransaction,
    writeContract
} from '@wagmi/core'
import {EthereumClient, w3mConnectors} from '@web3modal/ethereum'
import {Web3Modal} from '@web3modal/html'
import {goerli, mainnet} from '@wagmi/core/chains'
import {formatEther, parseEther} from "viem";
import tippy from 'tippy.js';
import fernet from 'fernet/fernetBrowser.js';
import {infuraProvider} from 'wagmi/providers/infura'

let bullshitCentralizedProvider;

if (process.env.NODE_ENV === 'development') {
    console.log("Using Infura in development.");
    bullshitCentralizedProvider = infuraProvider({apiKey: 'adc98e27c31d4eca8ed8e4e7f7d35b8f'});
} else {
    // Infrua seems to be working for now.
    console.log("Using Infura in production.  Gross.");
    bullshitCentralizedProvider = infuraProvider({apiKey: 'adc98e27c31d4eca8ed8e4e7f7d35b8f'});
}

require.context('../images', false, /\.(png|jpe?g|gif|svg|avif)$/);
require.context('../images/thumbnails', false, /\.(png|jpe?g|gif|svg)$/);
require.context('../audio', false, /\.(mp3|flac)$/);


// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, goerli]
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const minContributionAmount = 0.1;
const outbidAmountEpsilon = 0.01;
const chainId = 1;

// Final test contract deployed on Goerli with initialWindow feature
const contractAddress = '0xa812137EFf2B368d0B2880A39B609fB60c426850';


/////////////
// Web3Modal Things
/////////////

const {publicClient} = configureChains(chains, [bullshitCentralizedProvider])

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

web3modal.subscribeEvents((event) => {
        if (event.name === "ACCOUNT_CONNECTED") {
            updateContributorsTable(); // This has a side-effect of updating the combine contribution toggle visibility
        }
    }
)

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
    useSecretToDecryptMaterial();
    // Set the onclick of the button with ID 'decrypt' to call readFilesToDecrypt
    document.getElementById('decrypt').onclick = readFilesToDecrypt;

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

    const thresholdInWei = await readContract({
        address: contractAddress,
        abi: contractABI,
        chainId: chainId,
        functionName: 'threshold',
    });
    const thresholdInEth = formatEther(thresholdInWei);

    const contractBalanceAsEther =formatEther(Number(balance.value));

    // Calculate the remaining amount needed to reach the threshold

    const toBeFunded = Number(thresholdInEth) - contractBalanceAsEther;
    // const remainingAmountInWei = Number(thresholdInWei) - Number(balance.value);

    // Convert the remaining amount to ETH
    // const remainingAmount = formatEther(remainingAmountInWei);

    // Show how much has been funded out of the threshold
    document.getElementById('raisedSoFar').textContent = "(" + Number(contractBalanceAsEther).toFixed(2) + " ETH";

    // Show how much is remaining
    document.getElementById('remainingEth').textContent = Number(toBeFunded).toFixed(2) + " ETH";


    // If the threshold has been reached, stop the countdown
    // if (alreadyFunded >= formatEther(thresholdInWei)) {
    //     // Put "hurrah" in the 'remainingEth' element
    //     document.getElementById('remainingEth').textContent = "Album Dropped 🎉";
    // }
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


async function readFilesToDecrypt() {
// Read files from the DOM element with ID formFileMultiple
    const files = document.getElementById('formFileMultiple').files;

    if (files.length === 0) {
        showError("No files selected");
        return;
    }
    // use decode on the files
    const decodedFiles = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onerror = (error) => {
            console.log(new Error("File reading failed: " + error));
        };

        reader.onload = async (event) => {
            const decoded = decode(event.target.result);

            console.log(decoded);

            // decoded is json; lookup 'bulk_ciphertext' and pass it to fernet
            const ciphertext = decoded['bulk_ciphertext'];
            const ciphertextString = uInt8ArrayToString(ciphertext);

            const decrypted = window.token.decode(ciphertextString);

            // Write that to a file and let the user download it
            const blob = new Blob([decrypted], {type: 'image/jpeg'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
        }
        // now read the file
        await reader.readAsArrayBuffer(file);
    }


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
    alertDiv.style.zIndex = "1100"; // higher than the bootstrap modal
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

    // Check user is using correct network
    let chainIdToNetworkName = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
    }

    if (ethereumClient.getNetwork().chain.id !== chainId) {
        showError("Please switch to the " + chainIdToNetworkName[chainId] + " network");
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

    // show bootstrap toast "Waiting for transaction to be accepted"
    let toast = document.getElementById('pending-transaction-toast');
    let bsToast = new Toast(toast);
    bsToast.show();

    await waitForTransaction({hash, chainId});

    // hide toast
    bsToast.hide();

    let toastConfirmed = document.getElementById('transaction-confirmed-toast');
    let bsToastConfirmed = new Toast(toastConfirmed);
    bsToastConfirmed.show();

    // Update the funding threshold display
    updateContributorsTable();
    updateFundingThreshold();

    return hash;
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

    for (let i = 0; i < contributors.length; i++) {

        const address = contributors[i]
        if (!(address in contributionsByAddress)) {
            contributionsByAddress[address] = []
        }

        const is_combined = combined[i]
        const amount = Number(amounts[i])
        const contributionMoment = datetimes[i]

        if (is_combined) {
            if (contributionsByAddress[address].length === 0) {
                console.log("wtf");
                // This ought to be an impossible situaiton - how did they dcombine with a bid that didn't exist?
                contributionsByAddress[address].push(Number(0))
            }
            contributionsByAddress[address][0] += Number(amount)
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


//////// So unnecessarily boilerplatehy
function hexToBytes(hex) {
    // Ensure the hex string length is even
    if (hex.length % 2 !== 0) {
        console.error('Invalid hex string length.');
        return;
    }

    let bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

function uInt8ArrayToString(array) {
    const decoder = new TextDecoder();
    return decoder.decode(array);
}


async function useSecretToDecryptMaterial() {

    let keyPlaintextBytes = await readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'keyPlaintext',
        chainId: chainId,
    });

    if (keyPlaintextBytes === "0x") {
        console.log("key not revealed yet.");
        return;
    }

    document.getElementById("revealer").style.display = "flex";
    document.getElementById("key-plaintext").innerHTML = keyPlaintextBytes;

    // Slice keyPlaintextBytes to remove the leading 0x
    let keyPlaintextBytesSliced = keyPlaintextBytes.slice(2);
    const bytesOfKeyPlaintext = hexToBytes(keyPlaintextBytesSliced);
    const base64StringOfKeyPlaintext = uInt8ArrayToString(bytesOfKeyPlaintext);
    const openSecret = new fernet.Secret(base64StringOfKeyPlaintext);
    window.token = new fernet.Token({secret: openSecret, ttl: 0})
    console.log(base64StringOfKeyPlaintext);
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
    const leaderRows = getLeaderboardTableBody().getElementsByClassName("leaderboard-row");

    // Loop through the contributors and append a row for each
    for (let i = 0; i < leaderRows.length; i++) {
        let row = leaderRows[i];
        let thisLeader = leaders[i];

        if (thisLeader == undefined) {
            console.log("Not enough leaders to fill the rows.")
            break;
        }

        let bidSlot = row.getElementsByTagName('td')[1];
        let addressSlot = row.getElementsByTagName('td')[2];

        let amountInWei = thisLeader[0];
        bidSlot.innerHTML = formatEther(amountInWei) + " ETH";


        let ensName = await fetchEnsName({address: thisLeader[1], chainId: 1});
        if (ensName == undefined) {
            ensName = thisLeader[1];
        }

        const etherscanBaseUrl = "https://etherscan.io/address/";
        addressSlot.innerHTML = " <a href='" + etherscanBaseUrl + thisLeader[1] + "' target='_blank'>" + ensName + "</a>";
    }
    ;

    updateCombineContributionToggleVisibility(contributionsByAddress);
}


function updateCombineContributionToggleVisibility(contributionsByAddress) {
    // If the user already contributed, show the toggle
    if (!isWalletConnected()) {
        document.getElementById("combine-contribution-div").style.display = "none";
        return;
    }

    let userAddress = ethereumClient.getAccount()['address'];

    for (let address in contributionsByAddress) {
        address = address.toLowerCase();
        userAddress = userAddress.toLowerCase();

        if (address === userAddress) {
            document.getElementById("combine-contribution-div").style.display = "block";
            return;
        }
    }

    document.getElementById("combine-contribution-div").style.display = "none";
}
