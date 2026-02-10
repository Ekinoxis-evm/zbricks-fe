# ZBricks - NFT Real Estate Auction Platform

A decentralized real estate tokenization platform featuring multi-chain NFT auctions with USDC payments, powered by Circle Programmable Wallets and Continuous Clearing Auction (CCA) mechanics.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Additional Documentation](#additional-documentation)

---

## Overview

ZBricks implements a **4-phase Continuous Clearing Auction (CCA)** system for real estate NFTs, where properties are progressively revealed across auction phases. The platform supports USDC transactions on Base Mainnet and Base Sepolia networks.

### Key Concepts

- **Continuous Clearing Auction**: Only the winner pays; all other bidders receive full refunds
- **Progressive Reveal**: Property metadata evolves through 4 auction phases
- **Multi-Chain Support**: Deployed on Base Mainnet (8453) and Base Sepolia (84532)
- **USDC Payments**: All transactions use USDC via standard wallet approvals
- **RainbowKit Integration**: Connect with Coinbase Wallet, MetaMask, WalletConnect, and more

---

## Features

### Core Functionality

- ✅ **Wallet Connection** - RainbowKit integration with multiple wallet options
- ✅ **Multi-Phase Auctions** - 4-phase CCA with progressive property reveals
- ✅ **Real-Time Bidding** - Live auction interface with automatic bid validation
- ✅ **Participation Fees** - Configurable entry fees with automatic USDC approval
- ✅ **Automated Refunds** - All non-winning bidders receive full refunds
- ✅ **NFT Management** - Admin dashboard for minting, phase control, and metadata updates
- ✅ **Auction Factory** - Deploy unlimited auction instances per NFT
- ✅ **Multi-Chain** - Seamless switching between Base Mainnet and Base Sepolia

### Admin Capabilities

- Mint real estate NFTs with phase-based metadata URIs
- Set and update phase-specific metadata
- Transfer NFTs to auction factory
- Configure auction parameters (floor price, participation fee, phase durations)
- Launch new auctions through factory contract
- Pause/resume auctions
- Finalize auctions and distribute proceeds

---

## Tech Stack

### Frontend

- **Next.js 16** - App Router with server/client components
- **React 19** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Styling with PostCSS
- **Viem v2** - TypeScript-first Ethereum library
- **Wagmi v2** - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI

### Blockchain

- **Solidity Smart Contracts**
  - `HouseNFT` - ERC721 with phase-based metadata
  - `AuctionFactory` - Factory pattern for auction deployment
  - `AuctionManager` - CCA auction logic
- **USDC** - ERC20 payment token

### Infrastructure

- **Pinata** - IPFS metadata storage
- **RPC Providers** - Base Sepolia, Base Mainnet

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Pinata Account** - For IPFS uploads ([https://pinata.cloud](https://pinata.cloud))
- **WalletConnect Project ID** - For RainbowKit connections ([https://cloud.reown.com](https://cloud.reown.com))

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hackmoney
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 16.1.6
- React 19.2.3
- Viem v2.45.2
- Wagmi v2.19.5
- RainbowKit v2.2.10
- @tanstack/react-query v5.90.20
- Tailwind CSS v4

---

## Environment Configuration

### 1. Create Environment File

Create a `.env.local` file in the Hackmoney directory:

```bash
cd Hackmoney
touch .env.local
```

### 2. Configure Required Variables

Edit `.env.local` with your credentials:

```env
# Pinata IPFS (Required for metadata uploads)
PINATA_JWT=your_pinata_jwt_token

# WalletConnect / Reown (Required for RainbowKit)
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# App Configuration
NEXT_PUBLIC_APP_NAME="ZBrick Auctions"

# Optional - RPC Endpoints (defaults provided)
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Optional - Network Selection (84532 for Base Sepolia, 8453 for Base Mainnet)
NEXT_PUBLIC_NETWORK=84532
```

### 3. Obtain Required Credentials

#### Pinata JWT (Required)
1. Sign up at [https://pinata.cloud](https://pinata.cloud)
2. Navigate to **API Keys**
3. Create new key with permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
4. Copy the JWT token

#### WalletConnect/Reown Project ID (Required)
1. Visit [https://cloud.reown.com](https://cloud.reown.com)
2. Create a new project
3. Copy the Project ID
4. Add your app domain to allowed origins (e.g., `http://localhost:3000`)

---

## Smart Contract Architecture

The platform uses a factory pattern with three core contracts deployed across multiple chains.

### Deployed Contracts

#### Base Mainnet (Chain ID: 8453)
```
HouseNFT:        0x44b659c474d1bcb0e6325ae17c882994d772e471
AuctionFactory:  0x1d5854ef9b5fd15e1f477a7d15c94ea0e795d9a5
AuctionManager:  0x24220aeb9360aaf896c99060c53332258736e30d (template)
USDC:            0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Explorer:        https://base.blockscout.com
```

#### Base Sepolia Testnet (Chain ID: 84532)
```
HouseNFT:        0x3911826c047726de1881f5518faa06e06413aba6
AuctionFactory:  0xd13e24354d6e9706b4bc89272e31374ec71a2e75
AuctionManager:  0x4aee0c5afe353fb9fa111e0b5221db715b53cb10 (template)
USDC:            0x036CbD53842c5426634e7929541eC2318f3dCF7e
Explorer:        https://base-sepolia.blockscout.com
```

**Note**: The application supports both Base Mainnet and Base Sepolia. All supported chains are defined in `deploymnets/addresses.json`.

### Contract ABIs

All contract ABIs are located in `/deploymnets/deployments/abi/`:
- `HouseNFT.json` - NFT with phase-based metadata
- `AuctionFactory.json` - Factory for creating auctions
- `AuctionManager.json` - Auction bidding and settlement logic

---

## Usage Guide

### 1. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. First-Time Setup

#### Connect Wallet
1. Navigate to **Account** (`/account`)
2. Click **Connect Wallet** button in the header
3. Choose from:
   - Coinbase Wallet
   - MetaMask
   - WalletConnect
   - Rainbow
   - And other supported wallets

### 3. Admin Workflow (NFT & Auction Management)

Access admin panel at `/admin`

#### Step 1: Mint NFT
1. Go to **Manage NFT** tab
2. Enter recipient address (your wallet)
3. Click **Mint NFT**
4. Approve transaction in wallet
5. Note the minted Token ID

#### Step 2: Set Phase URIs (Optional)
Configure metadata URIs for each auction phase:
```
Phase 0: ipfs://Qm.../phase0.json (Initial reveal)
Phase 1: ipfs://Qm.../phase1.json (Second reveal)
Phase 2: ipfs://Qm.../phase2.json (Final reveal)
Phase 3: ipfs://Qm.../phase3.json (Winner metadata)
```

#### Step 3: Transfer NFT to Factory
1. In **Manage NFT** tab
2. Enter Token ID
3. Click **Transfer NFT to Factory**
4. This is **required** before creating auction

#### Step 4: Create Auction
1. Switch to **Factory & Launch** tab
2. Configure auction parameters:
   - **NFT Contract**: Auto-filled (HouseNFT address)
   - **Token ID**: The minted NFT ID
   - **Payment Token**: Auto-filled (USDC address)
   - **Phase Durations**: [Phase0, Phase1, Phase2, Phase3] in seconds
     - Example: `[172800, 86400, 86400, 0]` (48h, 24h, 24h, indefinite)
   - **Floor Price**: Minimum bid in USDC (e.g., `1000`)
   - **Min Increment**: Minimum bid increase in basis points (e.g., `500` = 5%)
   - **Enforce Increment**: Check to require minimum increases
   - **Participation Fee**: Entry fee in USDC (e.g., `10`)
   - **Treasury**: Address to receive proceeds (your wallet)
3. Click **Create Auction**
4. Confirm the transaction in your wallet
5. Wait for confirmation and note the new auction address

### 4. User Workflow (Bidding)

#### Browse Auctions
1. Visit **Auctions** page (`/auctions`)
2. Filter by Active/Ended status
3. View auction cards with:
   - Current high bid
   - Time remaining
   - Bidder count
   - Property images

#### Place Bids
1. Click on an auction to open bidding interface (`/biddings?auction=0x...`)
2. **First time bidders**:
   - Pay participation fee (one-time per auction)
   - Approve USDC spending
   - Click **Pay Participation Fee**
3. **Place bid**:
   - Enter bid amount (must be ≥ floor price)
   - System auto-approves USDC
   - Click **Place Bid**
   - Confirm transaction in your wallet
4. **Monitor status**:
   - Green banner if you're winning
   - Yellow banner if outbid
   - Automatic refund if outbid

### 5. Auction Finalization

After all phases complete:

1. Admin visits auction management
2. Clicks **Finalize Auction**
3. NFT transfers to winner
4. Winner can view their NFT in their connected wallet
5. Admin withdraws proceeds

---

## Project Structure

```
Hackmoney/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout with RainbowKit providers
│   ├── providers.tsx             # Wagmi/RainbowKit/React Query setup
│   ├── account/                  # Wallet/account management
│   ├── admin/                    # Admin dashboard
│   │   └── contracts/            # NFT & auction management
│   ├── auctions/                 # Auction browsing
│   ├── biddings/                 # Bidding interface
│   ├── properties/               # Property listings
│   ├── components/               # Reusable UI components
│   │   ├── Header.tsx            # Navigation with wallet connection
│   │   ├── Button.tsx            # Custom button component
│   │   ├── Card.tsx              # Card component
│   │   └── ...                   # Other components
│   └── api/
│       ├── endpoints/            # API endpoints
│       └── pinata/               # IPFS upload endpoint
│
├── deploymnets/                  # Smart contract deployments
│   ├── AUCTION-FLOW.md          # Detailed auction mechanics
│   ├── CONTRACT-REFERENCE.md    # Contract documentation
│   ├── addresses.json            # Deployed contract addresses
│   └── abi/                      # Contract ABIs
│
├── lib/                          # Shared utilities
│   ├── wagmi-config.ts          # Wagmi/RainbowKit configuration
│   ├── contracts.ts             # Contract addresses and ABIs
│   ├── contracts-exports.ts     # Contract type exports
│   ├── evm.ts                   # EVM utilities
│   └── hooks/                   # Custom React hooks
│
├── public/                       # Static assets
│   ├── auctions/                # Auction images
│   ├── steam/                   # Additional images
│   └── subastas/                # Property images
│
├── .env.local                   # Environment variables (gitignored)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind configuration
└── next.config.ts               # Next.js configuration
```

---

## Troubleshooting

### Common Issues

#### "Chain mismatch" Error
**Problem**: Wallet network doesn't match selected chain in UI

**Solution**:
1. Check which network your wallet is connected to
2. Select matching chain in dropdown (top right)
3. UI auto-detects wallet chain on load
4. For manual switching, click dropdown and select desired chain

#### "NFT not transferred" Error
**Problem**: Trying to create auction before transferring NFT

**Solution**:
1. Go to **Manage NFT** tab in `/contracts`
2. Enter Token ID
3. Click **Transfer NFT to Factory**
4. Wait for transaction confirmation
5. Then return to **Factory & Launch** tab

#### "Failed to load data" with 429 Errors
**Problem**: RPC rate limiting

**Solution**:
1. Wait 10-30 seconds before refreshing
2. Use **Refresh** button instead of browser reload
3. Consider using custom RPC endpoint in `.env`:
   ```env
   NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=your_private_rpc_url
   NEXT_PUBLIC_BASE_MAINNET_RPC_URL=your_private_rpc_url
   ```

#### Transactions Not Appearing
**Problem**: Wallet shows "confirmed" but no transaction on explorer

**Solution**:
1. Check browser console for transaction hash
2. If no hash is present, transaction wasn't submitted
3. Verify wallet has sufficient gas token (ETH)
4. Try again after 30-60 seconds
5. Ensure wallet is connected to the correct network

#### Auction Not Showing in Marketplace
**Problem**: Created auction doesn't appear in Auctions page

**Solution**:
1. Wait 30 seconds for auto-refresh (interval: 30s)
2. Or click **Refresh** button manually
3. Verify auction creation transaction on explorer
4. Check console for "AuctionCreated" event logs
5. Ensure correct chain selected in dropdown

#### USDC Approval Fails
**Problem**: Cannot approve USDC for participation fee or bidding

**Solution**:
1. Verify USDC balance: Visit faucet for testnet USDC
   - Base Sepolia: Use Circle faucet or Base Sepolia faucet
2. Check wallet has gas tokens (ETH)
3. Approve USDC manually if auto-approval fails:
   - Go to **Account** (`/account`)
   - Use **Send USDC** to test transactions

---

## Additional Documentation

### Detailed Guides

- **[Auction Flow Documentation](deploymnets/AUCTION-FLOW.md)** - Complete CCA mechanics, phase transitions, refund system
- **[Contract Reference](deploymnets/CONTRACT-REFERENCE.md)** - Full smart contract API documentation

### Key Pages

- **Landing**: `/` - Project overview
- **Auctions**: `/auctions` - Browse active and ended auctions
- **Bidding**: `/biddings?auction=<address>` - Place bids
- **Admin**: `/admin` and `/admin/contracts` - NFT & auction management
- **Account**: `/account` - Wallet management and USDC operations
- **Properties**: `/properties` - View property listings

---

## Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## Support & Resources

- **Smart Contract Addresses**: See [addresses.json](deploymnets/addresses.json)
- **Auction Mechanics**: [AUCTION-FLOW.md](deploymnets/AUCTION-FLOW.md)
- **Contract Documentation**: [CONTRACT-REFERENCE.md](deploymnets/CONTRACT-REFERENCE.md)
- **Base Documentation**: [https://docs.base.org](https://docs.base.org)
- **Viem Documentation**: [https://viem.sh](https://viem.sh)
- **Wagmi Documentation**: [https://wagmi.sh](https://wagmi.sh)
- **RainbowKit Documentation**: [https://rainbowkit.com](https://rainbowkit.com)

---

**Built with ❤️ for real estate tokenization**
