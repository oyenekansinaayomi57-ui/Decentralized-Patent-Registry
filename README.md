# Decentralized Patent Registry

A blockchain-powered platform that decentralizes patent registration, enabling inventors to securely register, verify, and license intellectual property on-chain, reducing costs, eliminating intermediaries, and ensuring global transparency and immutability.

---

## Overview

Decentralized Patent Registry consists of four main smart contracts that together form a secure, transparent, and efficient ecosystem for intellectual property management:

1. **Patent Registry Contract** – Handles the registration and storage of patent metadata and proofs.
2. **Patent Ownership NFT Contract** – Issues and manages NFTs representing patent ownership and transfers.
3. **Licensing Agreement Contract** – Automates licensing deals, royalty distributions, and enforcement.
4. **Dispute Resolution DAO Contract** – Facilitates community-driven resolution of patent disputes and challenges.

---

## Features

- **Immutable patent registration** with cryptographic proofs and timestamps  
- **NFT-based ownership** for easy transfer and fractionalization of patents  
- **Automated licensing** with smart contract-enforced royalties and terms  
- **DAO governance** for dispute resolution and platform upgrades  
- **Global accessibility** without centralized authorities or high fees  
- **Novelty verification** through on-chain hashes and oracle integrations  
- **Royalty tracking** for transparent revenue sharing  
- **Challenge mechanisms** to contest invalid patents  

---

## Smart Contracts

### Patent Registry Contract
- Register patents with metadata, document hashes, and inventor details
- Store immutable records with blockchain timestamps
- Search and query functionality for existing patents

### Patent Ownership NFT Contract
- Mint NFTs as proof of patent ownership
- Handle transfers, sales, and fractional ownership
- Enforce resale royalties for inventors

### Licensing Agreement Contract
- Create customizable licensing templates
- Automate royalty payments upon usage or sales
- Track and enforce license compliance on-chain

### Dispute Resolution DAO Contract
- Submit disputes or challenges to registered patents
- Token-weighted voting for resolution outcomes
- Automated execution of decisions (e.g., invalidation or amendments)

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started)
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/decentralized-patent-registry.git
   ```
3. Run tests:
    ```bash
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## Usage

Each smart contract operates independently but integrates with others for a complete intellectual property management experience.
Refer to individual contract documentation for function calls, parameters, and usage examples.

## License

MIT License