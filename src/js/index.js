import contractABI from './contributionABI.js'
import 'styles/style.css';

let account;
let myContract;

const contractAddress = '0x1AC29F2e1d16ce2CDF6A68C9B85cFFE7025dA86C';

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("contribute-button").onclick = contribute;
});


function getContract() {
    myContract = new window.web3.eth.Contract(contractABI, contractAddress);
}

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
    console.log("llamas");
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
