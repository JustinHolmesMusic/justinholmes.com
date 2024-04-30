async function signPlaintext() {
    const plaintext = document.getElementById('plaintext').value;
    if (!plaintext) {
        alert('Please enter some plaintext to sign.');
        return;
    }

    if (!window.ethereum) {
        alert('Please install MetaMask.');
        return;
    }

    try {
        // Connect to MetaMask
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Sign the message
        const signer = window.wagmi.createProvider(window.ethereum).getSigner();
        const signature = await signer.signMessage(plaintext);

        // Display the signature
        document.getElementById('signatureOutput').innerText = `Signature: ${signature}`;
    } catch (error) {
        console.error('Error signing message:', error);
        alert('Failed to sign the message. See console for details.');
    }
}

export { signPlaintext };
