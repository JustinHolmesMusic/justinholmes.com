/* To connect using MetaMask */
let account;
let myContract;
const contractABI = [{"inputs":[{"internalType":"uint256","name":"_countdownPeriod","type":"uint256"},{"internalType":"uint256","name":"_threshold","type":"uint256"},{"internalType":"uint256","name":"_minContribution","type":"uint256"},{"internalType":"address payable","name":"_beneficiary","type":"address"},{"internalType":"bool","name":"_testnet","type":"bool"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"ClockReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"contributor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Contribute","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"lastContributor","type":"address"}],"name":"Decryptable","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"beneficiary","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Withdraw","type":"event"},{"inputs":[],"name":"artifactContract","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"beneficiary","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_hash","type":"bytes32"},{"internalType":"bytes","name":"_ciphertext","type":"bytes"}],"name":"commitSecret","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"contribute","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"contributeAndCombine","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"contributionsByAddress","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"contributors","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"countdownPeriod","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"deadline","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contributor","type":"address"}],"name":"getContributionsByAddress","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getContributors","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isKeySet","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"keyCiphertext","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"keyPlaintext","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"keyPlaintextHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"materialReleaseConditionMet","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minContribution","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"resetClock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"secret","type":"bytes"}],"name":"revealSecret","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_artifactContract","type":"address"}],"name":"setArtifactContract","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"status","type":"bool"}],"name":"setMaterialReleaseConditionMet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"setThreshold","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"testnet","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"threshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"contributor","type":"address"}],"name":"totalContributedByAddress","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
const contractAddress = '0x1AC29F2e1d16ce2CDF6A68C9B85cFFE7025dA86C';

function getContract() {
    myContract = new window.web3.eth.Contract(contractABI, contractAddress);
}

function connect() {
    if (window.ethereum) {
        window.ethereum.request({method: "eth_requestAccounts"});
        window.web3 = new Web3(window.ethereum);
        account = window.web3.eth.accounts;     //Get the current MetaMask selected/active wallet
        const walletAddress = account.givenProvider.selectedAddress;
        account = walletAddress; // todo: remove this line
        console.log(`Wallet: ${walletAddress}`);
        document.getElementById("connect-wallet").innerHTML =
            walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
        getContract();
    } else {
        console.log("No wallet");
    }
}

async function contribute() {
    if (!account) return;

    let web3 = window.web3;

    let userAmount = document.getElementById("user-amount").value;
    const amount = web3.utils.toWei(userAmount, 'ether'); // Change the value as needed

    window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
            {
                from: account,
                to: contractAddress,
                data: myContract.methods.contribute().encodeABI(), // This encodes the function call to contribute
                value: web3.utils.toHex(amount),
            },
        ],
    })
        .then((txHash) => console.log(txHash))
        .catch((error) => console.error);
}

// Update the count down every 1 second
let countDownDate;
var x = setInterval(function () {
    if (!account) return;

    myContract.methods.deadline().call()
        .then((deadline) => {
            countDownDate = deadline * 1000;
            console.log('Deadline: ', deadline);
        })
        .catch((error) => console.error);

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate - now;

    // If the count down is finished, write some text
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


}, 1000);

function updateFundingStatus() {
    if (!account) return;

    // Read the balance of the contract
    window.web3.eth.getBalance(contractAddress)
        .then((balanceInWei) => {
            // Convert balance from Wei to Ether
            const balanceInEth = web3.utils.fromWei(balanceInWei, 'ether');

            // Fetch threshold from contract
            myContract.methods.threshold().call()
                .then((thresholdInWei) => {
                    const thresholdInEth = web3.utils.fromWei(thresholdInWei, 'ether');

                    // Calculate the remaining amount needed to reach the threshold
                    const remainingAmount = thresholdInEth - balanceInEth;

                    // Update the HTML element
                    document.getElementById('remainingEth').textContent = remainingAmount.toFixed(3);
                })
                .catch((error) => console.error);
        })
        .catch((error) => console.error);
}

var x = setInterval(function () {
    updateFundingStatus();
}, 1000);

function updateContributorsTable() {
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
