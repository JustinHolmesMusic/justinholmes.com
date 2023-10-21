import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'popper.js';
import 'tippy.js';
import 'tippy.js/dist/tippy.css';
import $ from 'jquery';
import 'spotlight.js';
import {
  configureChains,
  createConfig,
} from '@wagmi/core';

import '../styles/style.css';
import { EthereumClient, w3mConnectors } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/html';
import { goerli, mainnet } from '@wagmi/core/chains';
import { infuraProvider } from 'wagmi/providers/infura';

var AES = require('crypto-js/aes');
const CryptoJS = require('crypto-js');

let bullshitCentralizedProvider;

if (process.env.NODE_ENV === 'development') {
  console.log('Using Infura in development.');
  bullshitCentralizedProvider = infuraProvider({ apiKey: 'adc98e27c31d4eca8ed8e4e7f7d35b8f' });
} else {
  // Infrua seems to be working for now.
  console.log('Using Infura in production.  Gross.');
  bullshitCentralizedProvider = infuraProvider({ apiKey: 'adc98e27c31d4eca8ed8e4e7f7d35b8f' });
}

require.context('../images', false, /\.(png|jpe?g|gif|svg|avif)$/);
require.context('../images/thumbnails', false, /\.(png|jpe?g|gif|svg)$/);
require.context('../audio', false, /\.(mp3|flac)$/);


// Equivalent to importing from @wagmi/core/providers
const chains = [mainnet, goerli];
const projectId = '3e6e7e58a5918c44fa42816d90b735a6';
const minContributionAmount = 0.1;
const outbidAmountEpsilon = 0.01;
const chainId = 1;

// Final test contract deployed on Goerli with initialWindow feature
const contractAddress = '0xa812137EFf2B368d0B2880A39B609fB60c426850';


/////////////
// Web3Modal Things
/////////////

const { publicClient } = configureChains(chains, [bullshitCentralizedProvider]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);
export const web3modal = new Web3Modal({
  projectId: projectId,
  themeVariables: {
    '--w3m-font-family': 'monospace, sans-serif',
    '--w3m-accent-color': 'blueviolet',
    '--w3m-background-color': 'blueviolet',
  },
}, ethereumClient);

web3modal.subscribeEvents((event) => {
    if (event.name === 'ACCOUNT_CONNECTED') {
      updateContributorsTable(); // This has a side-effect of updating the combine contribution toggle visibility
    }
  },
);

function displayArtifactMinimumWarningIfNeeded() {

  let userAmount = document.getElementById('user-amount').value;
  let combine = document.getElementById('combine-contribution-toggle').checked;

  if (combine) {
    document.getElementById('artifact-warning').style.display = 'none';

    // if the amount is less than the minimum, display the epsilon warning.
    if (userAmount < minContributionAmount) {
      document.getElementById('combine-epsilon-warning').style.display = 'block';
      return;
    } else {
      // Otherwise, they must be above the min and there's no need for a warning.
      document.getElementById('combine-epsilon-warning').style.display = 'none';
      return;
    }
  } else {
    document.getElementById('combine-epsilon-warning').style.display = 'none';
  }

  // console.log("User amount: " + userAmount)

  if (userAmount < minContributionAmount) {
    document.getElementById('artifact-warning').style.display = 'block';
  } else {
    document.getElementById('artifact-warning').style.display = 'none';
  }
}

//////////////////
//// Funding Threshold Things
//////////////////

// Call updateFundingThreshold when DOM is loaded.
document.addEventListener('DOMContentLoaded', () => {
  openBooklet();
  updateFundingThreshold();
  hookupBootstrapLinkButtons();
  hookupContributeButton();
  updateCountdownDisplay();
  updateContributorsTable();
  document.getElementById('min-preset').onclick = setMinPreset;
  setMinContributionAmount();
  fetchCountdownContractData();
  updateCountdownDisplay();
  useSecretToDecryptMaterial();
  // Set the onclick of the button with ID 'decrypt' to call readFilesToDecrypt
  document.getElementById('decrypt').onclick = decodeAndReadFilesToDecrypt;

  // If the number in #user-amount is changed to below .1, reveal a message telling them they won't get an Artifact.
  $('#user-amount').on('keyup', function() {
    displayArtifactMinimumWarningIfNeeded();
  });

  $('#user-amount').on('change', function() {
    displayArtifactMinimumWarningIfNeeded();
  });

  $('#combine-contribution-toggle').on('change', function() {
    displayArtifactMinimumWarningIfNeeded();
  });


  // In case they refreshed the page with the value set lower than the minimum.
  displayArtifactMinimumWarningIfNeeded();

});

let currentBookletPage = 1;
let maxBookletPage = document.querySelectorAll('[data-booklet-page]').length;


function openBooklet() {
  let firstPage = document.querySelector('[data-booklet-page="1"]');
  document.getElementById('booklet-content').innerHTML = firstPage.innerHTML;
  setupBookletNavigation();
}

function getNextBookletPage() {
  currentBookletPage = currentBookletPage + 1;
  if (currentBookletPage > maxBookletPage) {
    currentBookletPage = 1;
  }
  return currentBookletPage;
}
function hookupBootstrapLinkButtons() {
  const btnLinks = document.querySelectorAll('.button-link');
  btnLinks.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const href = this.getAttribute('data-href');
      window.open(href, '_blank');
    });
  });
}

