import {getAccount, signMessage, verifyMessage} from '@wagmi/core';
import {mainnet, optimism} from '@wagmi/core/chains';
import {createWeb3Modal, defaultWagmiConfig} from '@web3modal/wagmi'
import { hexToBytes } from 'viem'

const projectId = '3e6e7e58a5918c44fa42816d90b735a6'
const take = 23;

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

function splitAndReconstituteSignature(signature, vOffset) {
    // Ensure the signature includes '0x' and is the correct length
    if (!signature.startsWith('0x') || signature.length !== 132) {
        throw new Error('Invalid signature length or format');
    }

    const r = signature.slice(2, 66);   // Extracts 'r' component
    const s = signature.slice(66, 130); // Extracts 's' component
    let v = parseInt(signature.slice(130, 132), 16); // Parses 'v' as a hexadecimal integer
    const oldV = v;

    // Adjust 'v' if a new value is provided
    if (vOffset !== undefined && typeof vOffset === 'number') {
        v += vOffset;
    }

    // Ensure 'v' is in hexadecimal form and padded to two characters
    const vHex = v.toString(16).padStart(2, '0');

    // Reconstitute the signature with the new 'v'
    const reconstitutedSignature = `0x${r}${s}${vHex}`;

    return {
        r: '0x' + r,
        s: '0x' + s,
        v: v,
        oldV: oldV,
        fullSignature: reconstitutedSignature
    };
}

let details = {};

async function signPlaintextAndVerify() {
    let signatureBeforeVSwap;
    let signatureAfterVSwap;
    const account = getAccount(config);
    console.log("Running signPlaintextAndVerify")
    const plaintext_as_hex_string = '0x969072f83e6bfe3b1b6605da7d94f5148d4f975542d4629c48850c6b62a5ca7b';
    const plaintext = hexToBytes(plaintext_as_hex_string);

    try {
        console.log("Signing message:", plaintext);
        console.log("Message length:", plaintext.length);

        // Sign the message
        signatureBeforeVSwap = await signMessage(config, {
            message: {raw: plaintext},
        })

    } catch (error) {
        console.error('Error signing message:', error);
        alert('Failed to sign the message. See console for details.');
        return
    }


    // Now that we've signed, let's verify.

    const parts = splitAndReconstituteSignature(signatureBeforeVSwap, 4);
    console.log('r:', parts.r);
    console.log('s:', parts.s);
    console.log('v:', parts.v);


    signatureAfterVSwap = parts.fullSignature;

    const isValid = await verifyMessage(config, {
        address: account['address'],
        message: {raw: plaintext},
        signature: signatureBeforeVSwap,
    });

    console.log("isValid", isValid, "for address: ", account['address'], "with message", plaintext, "and signature", signatureBeforeVSwap);

    // Display the signature
    details['signatureBefore'] = signatureBeforeVSwap;
    details['signatureAfter'] = signatureAfterVSwap;
    details['address'] = account['address'];
    details['r'] = parts.r;
    details['s'] = parts.s;
    details['v'] = parts.v;
    details['oldV'] = parts.oldV;
    details['take'] = take;
    details['isValid'] = isValid;

    document.getElementById('signatureOutput').innerHTML = JSON.stringify(details, null, 1);
    document.getElementById('messageOutput').innerHTML = "<br/>Plaintext: " + plaintext;
    console.log("Signature before V swap:", signatureBeforeVSwap)
    console.log("Signature after V swap:", signatureAfterVSwap)
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