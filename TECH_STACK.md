# Technology Stack

## Overview
ZBrick Auctions is a Web3-powered real estate auction platform built on the Base blockchain. The application provides transparent, secure property auctions powered by smart contracts with bid management via USDC.

---

## Core Technologies

### Framework & Runtime
- **Next.js** (v16.1.6) - React metaframework for production-grade web applications with server-side rendering, API routes, and optimized performance
- **React** (v19.2.3) - UI library for building interactive components
- **TypeScript** (v5) - Typed superset of JavaScript for enhanced code quality and developer experience

### Styling & Design
- **Tailwind CSS** (v4) - Utility-first CSS framework for rapid UI development
- **Tailwind PostCSS Plugin** (@tailwindcss/postcss) - PostCSS plugin for Tailwind CSS processing

### Blockchain & Web3

#### Wallet Connection & Management
- **Wagmi** (v2.19.5) - React hooks library for Ethereum interactions and wallet management
- **Viem** (v2.45.2) - Low-level TypeScript library for Ethereum operations (used by Wagmi)
- **RainbowKit** (v2.2.10) - UI component library for wallet connection with customizable theming
  - Supports multiple connectors: Injected wallets, Coinbase Wallet, WalletConnect

#### Blockchain Networks
- **Base** (mainnet) - Primary blockchain network
- **Base Sepolia** (testnet) - Testing and staging environment
- **RPC Endpoints**: Mainnet (https://mainnet.base.org), Sepolia (https://sepolia.base.org)

#### Wallet Connectors
- **Injected Provider** - Browser-based wallet integration
- **Coinbase Wallet** - Coinbase's wallet solution
- **WalletConnect** - Protocol for connecting to mobile wallets (v2 via Reown)

### Data Management & State

#### Client-Side Data Fetching & Caching
- **TanStack React Query** (v5.90.20) - Server state management, data fetching, and synchronization
  - Provides automatic caching, background refetching, and server state synchronization

### Development & Build Tools

#### Linting & Code Quality
- **ESLint** (v9) - JavaScript linter for code quality
- **ESLint Config for Next.js** - Next.js-specific ESLint configurations

#### Type Definitions
- **@types/react** (v19) - TypeScript definitions for React
- **@types/react-dom** (v19) - TypeScript definitions for React DOM
- **@types/node** (v20) - TypeScript definitions for Node.js

---

## Configuration

### TypeScript Configuration (`tsconfig.json`)
- **Target**: ES2020
- **Module Resolution**: Bundler
- **JSX**: React 17+ syntax (`react-jsx`)
- **Path Alias**: `@/*` maps to root directory for clean imports

### Next.js Configuration (`next.config.ts`)
- TypeScript build error handling enabled for compatibility
- Output file tracing configured for optimized deployments

### Wagmi Configuration (`lib/wagmi-config.ts`)
- Multi-chain support (Base, Base Sepolia)
- SSR-enabled configuration
- Multicall optimization for batch RPC calls
- Project ID from environment variable `NEXT_PUBLIC_REOWN_PROJECT_ID`

---

## Environment Variables

### Required
- **`NEXT_PUBLIC_REOWN_PROJECT_ID`** - WalletConnect v2 project ID for wallet connectivity

---

## Project Structure

```
app/
├── api/                          # API routes
│   ├── endpoints/                # Custom endpoints
│   └── pinata/                   # Pinata IPFS integration
├── components/                   # Reusable React components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   ├── WalletStatus.tsx
│   ├── PropertyCard.tsx
│   └── ...
├── properties/                   # Property listings page
├── property-detail/              # Individual property details
├── auctions/                     # Auctions management
├── biddings/                     # Bidding interface
├── account/                      # User account page
├── admin/                        # Admin dashboard
│   └── contracts/               # Contract management
├── layout.tsx                    # Root layout with metadata
├── providers.tsx                 # Context providers (Wagmi, RainbowKit, React Query)
└── globals.css                   # Global styles

lib/
├── contracts.ts                  # Smart contract interactions
├── contracts-exports.ts          # Contract ABIs and exports
├── evm.ts                        # EVM utilities
├── metadata.ts                   # Metadata handling
├── wagmi-config.ts              # Wagmi configuration
└── hooks/
    ├── useChainSync.tsx         # Chain synchronization hook
    └── useWalletConnection.tsx  # Wallet connection hook

deployments/
├── abi/                          # Smart contract ABIs
│   ├── AuctionFactory.json
│   ├── AuctionManager.json
│   └── HouseNFT.json
├── addresses.json               # Deployed contract addresses
└── docs/                         # Deployment documentation
```

---

## Key Features

### Web3 Integration
- Multi-wallet support via RainbowKit
- Real-time chain synchronization
- Smart contract interaction via Wagmi/Viem

### Real-Time Data
- React Query for efficient server state management
- Multicall optimization for reduced RPC calls

### UI/UX
- Dark theme with accent colors (cyan: #2DD4D4)
- Responsive design with Tailwind CSS
- Custom components for property cards, notifications, and auction phases

### Smart Contracts
- Auction Factory - Manages auction creation
- Auction Manager - Handles auction lifecycle
- House NFT - ERC721 token for property representation

---

## Scripts

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Notes

- Type checking is strict with isolated modules enabled
- Build errors in TypeScript are ignored for Next.js compatibility
- SSR is enabled for optimal performance and SEO
- Batch RPC calls via multicall for efficiency
