# Deployed Contracts

*Last updated: 2026-02-09T21:37:04.768Z*

## Networks

### Base Mainnet (Chain ID: 8453)

| Contract | Address | Explorer |
|----------|---------|----------|
| **HouseNFT** | `0x776b8158269fbd7fd6a91a0514b8850777ac0227` | [View](https://base.blockscout.com/address/0x776b8158269fbd7fd6a91a0514b8850777ac0227) |
| **AuctionFactory** | `0x3347f6a853e04281daa0314f49a76964f010366f` | [View](https://base.blockscout.com/address/0x3347f6a853e04281daa0314f49a76964f010366f) |

### Base Sepolia (Chain ID: 84532)

| Contract | Address | Explorer |
|----------|---------|----------|
| **HouseNFT** | `0x2452791d09506e21eb2936f5748c5006965fb325` | [View](https://base-sepolia.blockscout.com/address/0x2452791d09506e21eb2936f5748c5006965fb325) |
| **AuctionFactory** | `0x9be95601c0b39705170b2424821aaab437be181c` | [View](https://base-sepolia.blockscout.com/address/0x9be95601c0b39705170b2424821aaab437be181c) |

## ABIs

Contract ABIs are available in [`deployments/abi/`](./abi/) directory:

- [`AuctionFactory.json`](./abi/AuctionFactory.json)
- [`HouseNFT.json`](./abi/HouseNFT.json)

## Usage

```javascript
const addresses = require('./deployments/addresses.json');
const houseNFTAbi = require('./deployments/abi/HouseNFT.json');

// Get contract address for specific chain
const chainId = '84532'; // Base Sepolia
const houseNFTAddress = addresses[chainId].contracts.HouseNFT;

// Use with ethers.js or viem
// const contract = new ethers.Contract(houseNFTAddress, houseNFTAbi, provider);
```
