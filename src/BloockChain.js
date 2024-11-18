import React, { useState } from 'react';
import SHA256 from "crypto-js/sha256";
import forge from 'node-forge';
import './style.css';

const generateRSAKeys = () => {
    const keypair = forge.pki.rsa.generateKeyPair(2048);
    return {
        privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
        publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
    };
};

const { privateKey, publicKey } = generateRSAKeys();

const Block = ({ index, previousHash, timestamp, merkleRoot, nonce, transactions, hash }) => (
    <div className="block">
        <h3>Block #{index}</h3>
        <p>Hash: {hash}</p>
        <p>Előző Hash: {previousHash}</p>
        <p>Merkle Gyökér: {merkleRoot}</p>
        <p>Nonce: {nonce}</p>
        <p>Tranzakciók:</p>6
        <ul>
            {transactions.map((t, id) => (
                <li key={id}>{`Tranzakció #${t.index-1} Befizető: ${t.sender}, Kedvezményezett: ${t.receiver}, Összeg: ${t.amount} BTC, Aláírás: ${t.signature}`}</li>
            ))}
        </ul>
    </div>
);

const Blockchain = () => {  
    const [blockchain, setBlockchain] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [sender, setSender] = useState('');
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');

    const createGenesisBlock = () => {
        const genesisBlock = {
            index: 0,
            previousHash: "0",
            timestamp: Date.now(),
            merkleRoot: "",
            nonce: 0,
            transactions: [],
            hash: calculateHash(0, "0", Date.now(), "", 0, [])
        };
        setBlockchain([genesisBlock]);
    };

    const calculateHash = (index, previousHash, timestamp, merkleRoot, nonce, transactions) => {
        return SHA256(index + previousHash + timestamp + merkleRoot + nonce + JSON.stringify(transactions)).toString();
    };

    const buildMerkleTree = (transactions) => {
        if (transactions.length === 0) return [];
        if (transactions.length === 1) return [SHA256(JSON.stringify(transactions[0])).toString()];

        const newTransactions = [];

        for (let i = 0; i < transactions.length; i += 2) {
            const combined = i + 1 < transactions.length ? SHA256(JSON.stringify(transactions[i]) + JSON.stringify(transactions[i + 1])).toString() : SHA256((JSON.stringify(transactions[i]))+(JSON.stringify(transactions[i]))).toString();
            newTransactions.push(combined);
        }
        return buildMerkleTree(newTransactions);
    };

    const createNewBlock = () => {
        if (transactions.length === 0) {
            alert("Nincs tranzakció! Kérlek, adj meg egy tranzakciót a blokk létrehozásához.");
            return;
        }

        const previousBlock = blockchain[blockchain.length - 1];
        const index = previousBlock.index + 1;
        const timestamp = Date.now();
        const merkleTree = buildMerkleTree(transactions);
        const merkleRoot = merkleTree.length ? merkleTree[merkleTree.length - 1] : "";
        let nonce = 0;
        let hashAttempt;

        do {
            nonce++;
            hashAttempt = calculateHash(index, previousBlock.hash, timestamp, merkleRoot, nonce, transactions);
        } while (!hashAttempt.startsWith("0000"));
        const newBlock = {
            index,
            previousHash: previousBlock.hash,
            timestamp,
            merkleRoot,
            nonce,
            transactions,
            hash: hashAttempt
        };

        setBlockchain([...blockchain, newBlock]);
        setTransactions([]);
        setSender('');
        setReceiver('');
        setAmount('');
    };

    const signTransaction = (transaction) => {
        const md = forge.md.sha256.create();
        md.update(JSON.stringify(transaction), 'utf8');
        const signature = forge.util.encode64(forge.pki.privateKeyFromPem(privateKey).sign(md));
        return signature;
    };

   
    const addTransaction = () => {
        if (sender && receiver && amount) {
            const newTransaction = {
                index: blockchain.length + 1,
                sender,
                receiver,
                amount: parseFloat(amount),
            };

            const signature = signTransaction(newTransaction);
            const signedTransaction = { ...newTransaction, signature };

            setTransactions([...transactions, signedTransaction]);
            setSender('');
            setReceiver('');
            setAmount('');
        } else {
            alert("Kérlek, töltsd ki az összes mezőt!");
        }
    };

    

    return (
        <div className="container">
            <h1>Blokklánc</h1>
            <button onClick={createGenesisBlock}>Genesis Block Létrehozása</button>
            <div>
                <input
                    type="text"
                    placeholder="Befizető neve"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Kedvezményezett neve"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Összeg (BTC)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={addTransaction}>Tranzakció Hozzáadása</button>
            </div>
            <button onClick={createNewBlock}>Új Blokk Létrehozása</button>
            <div className="block-container">
                {blockchain.map(block => (
                    <Block key={block.index} {...block} />
                ))}
            </div>
        </div>
    );
};

export default Blockchain;
