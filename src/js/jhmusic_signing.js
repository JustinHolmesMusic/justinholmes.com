import {getAccount, signMessage, verifyMessage} from '@wagmi/core';
import {mainnet, optimism} from '@wagmi/core/chains';
// import {EthereumClient, w3mConnectors} from '@web3modal/ethereum'
import {createWeb3Modal, defaultWagmiConfig} from '@web3modal/wagmi'
const projectId = '3e6e7e58a5918c44fa42816d90b735a6'

// const {publicClient} = configureChains(chains, [bullshitCentralizedProvider])

// 2. Create wagmiConfig
const metadata = {
    name: 'Web3Modal',
    description: 'Web3Modal Example',
    url: 'https://web3modal.com', // origin must match your domain & subdomain.
    icons: ['https://avatars.githubusercontent.com/u/37784886']
}
const chains = [mainnet, optimism]
export const config = defaultWagmiConfig({
    chains,
    projectId,
    metadata,
})

function splitAndReconstituteSignature(signature, newV) {
    // Ensure the signature includes '0x' and is the correct length
    if (!signature.startsWith('0x') || signature.length !== 132) {
        throw new Error('Invalid signature length or format');
    }

    const r = signature.slice(2, 66);   // Extracts 'r' component
    const s = signature.slice(66, 130); // Extracts 's' component
    let v = parseInt(signature.slice(130, 132), 16); // Parses 'v' as a hexadecimal integer

    // Adjust 'v' if a new value is provided
    if (newV !== undefined && typeof newV === 'number') {
        v = newV;
    }

    // Ensure 'v' is in hexadecimal form and padded to two characters
    const vHex = v.toString(16).padStart(2, '0');

    // Reconstitute the signature with the new 'v'
    const reconstitutedSignature = `0x${r}${s}${vHex}`;

    return {
        r: '0x' + r,
        s: '0x' + s,
        v: v,
        fullSignature: reconstitutedSignature
    };
}


async function signPlaintextAndVerify() {
    let signatureBeforeVSwap;
    let signatureAfterVSwap;
    const account = getAccount(config);
    console.log("Running signPlaintextAndVerify")
    const plaintext = document.getElementById('plaintext').value;
    if (!plaintext) {
        alert('Please enter some plaintext to sign.');
        return;
    }

    try {
        console.log("Signing message:", plaintext);

        // Sign the message
        signatureBeforeVSwap = await signMessage(config, {
            message: plaintext,
        })

        // Display the signature
        document.getElementById('signatureOutput').innerText = `Signature: ${signature}`;
    } catch (error) {
        console.error('Error signing message:', error);
        alert('Failed to sign the message. See console for details.');
        return
    }

    console.log("Signature:", signatureAfterVSwap)

    // Now that we've signed, let's verify.

    const parts = splitAndReconstituteSignature(signatureBeforeVSwap, 31);
    console.log('r:', parts.r);
    console.log('s:', parts.s);
    console.log('v:', parts.v);


    signatureAfterVSwap = parts.signature;

    const isValid = await verifyMessage(config, {
        address: account['address'],
        message: plaintext,
        signature: signatureAfterVSwap,
    });

    console.log("isValid", isValid, "for address: ", account['address']);

}

document.addEventListener('DOMContentLoaded', () => {
    const signButton = document.getElementById('signButton');
    if (signButton) {
        console.log("Binding signButton");
        signButton.addEventListener('click', signPlaintextAndVerify);
    }

    const modal = createWeb3Modal({
        wagmiConfig: config,
        projectId,
    });
});