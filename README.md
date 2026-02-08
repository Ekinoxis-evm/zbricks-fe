# Hackmoney - NFT Auction Platform

A decentralized auction platform for real estate NFTs with integrated USDC payments via Circle Programmable Wallets.

## Features

- **NFT Auctions**: Create and participate in real estate NFT auctions
- **Circle Wallets**: Email-based wallet creation and USDC transfers
- **Real-time Bidding**: Live auction interface with bid tracking
- **Marketplace**: Browse and trade NFT properties
- **Admin Dashboard**: Manage auctions and platform operations
- **Smart Contracts**: On-chain auction management with AuctionFactory and AuctionManager

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Circle Programmable Wallets SDK
- Solidity Smart Contracts
- Tailwind CSS

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Create `.env.local` with:
   ```env
   NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id
   CIRCLE_API_KEY=your_api_key
   NEXT_PUBLIC_CIRCLE_BASE_URL=https://api.circle.com
   CIRCLE_GATEWAY_BASE_URL=https://gateway-api-testnet.circle.com
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## Usage Flow

1. **Authentication** (`/auth`) - Email OTP verification to create Circle wallet
2. **Marketplace** (`/marketplace`) - Browse available NFT properties
3. **Auctions** (`/subastas`) - View active auctions
4. **Bidding** (`/pujas`) - Place bids on properties
5. **Account** (`/cuenta`) - Manage wallet and send USDC
6. **Winner** (`/ganador`) - Claim won auctions

## Smart Contracts

Contract ABIs and deployment addresses are in `/deploymnets/deployments/`. Key contracts:
- `HouseNFT.json` - Real estate NFT standard
- `AuctionFactory.json` - Auction creation
- `AuctionManager.json` - Bid and settlement logic

## Troubleshooting

- **Invalid session**: Re-authenticate at `/auth` and verify email
- **Insufficient balance**: Fund wallet with testnet USDC
- **Transfer failed**: Verify destination address and balance

## Architecture

```
app/
├── auth/          # Circle wallet authentication
├── marketplace/   # NFT browsing
├── subastas/      # Auction listings
├── pujas/         # Bidding interface
├── cuenta/        # Wallet management
├── ganador/       # Auction completion
├── admin/         # Platform administration
└── api/           # Backend endpoints
```
