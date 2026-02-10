# Chain Management Strategy

## Overview
This document explains how chain switching is managed in the ZBricks application with contracts deployed on both Base Mainnet and Base Sepolia.

## Single Source of Truth: `addresses.json`

The `addresses.json` file is the **single source of truth** for all supported chains. This file contains:
- Chain IDs
- Chain names
- Block explorers
- Contract addresses for each network

```json
{
  "8453": {
    "chainId": 8453,
    "chainName": "Base Mainnet",
    "contracts": { ... }
  },
  "84532": {
    "chainId": 84532,
    "chainName": "Base Sepolia",
    "contracts": { ... }
  }
}
```

## Current Implementation

### 1. **Centralized Contract Configuration** (`lib/contracts.ts`)
- Reads from `addresses.json`
- Provides type-safe helpers: `getContractsForChain()` and `getChainMeta()`
- Exports `SUPPORTED_CHAINS` constant: `[84532, 8453]`
- Includes USDC addresses for each chain

### 2. **Wallet Configuration** (`lib/wagmi-config.ts`)
- Uses RainbowKit with Wagmi
- Configured for both Base chains: `[baseSepolia, base]`
- Users can switch between networks directly from their wallet
- RPC endpoints configured via environment variables

### 3. **Page-Level Chain Switching**
Both `/auctions` and `/properties` pages:
- Have their own chain switcher dropdowns
- Only show chains from `addresses.json`
- Fetch data from the selected chain independently
- Allow viewing auctions/properties across different networks

## Best Practices

### ✅ DO:
1. **Keep `addresses.json` updated** - Add new chains here first
2. **Use the helpers** - Always use `getContractsForChain()` to get contract addresses
3. **Test on both chains** - Before mainnet deployment, test on Base Sepolia
4. **Use environment variables** for RPC URLs:
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`
   - `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`

### ❌ DON'T:
1. **Hardcode chain IDs** - Always reference from `SUPPORTED_CHAINS`
2. **Add unsupported chains** to page-level configs
3. **Duplicate deployment data** - Always read from `addresses.json`
4. **Forget to update both chains** when deploying new contract versions

## User Experience Considerations

### Wallet vs Page Chain Selection
Users might experience confusion between:
- **Wallet chain** (what their wallet is connected to)
- **Page chain** (what data they're viewing)

**Current approach**: Pages have independent chain selectors, allowing users to browse data from any supported chain regardless of their wallet connection. This is useful for:
- Comparing auctions across networks
- Viewing historical data
- Read-only browsing without connecting wallet

**When transactions are needed**: The app prompts users to switch their wallet to the correct chain.

### Alternative Approach (Not Implemented)
You could sync the page chain with the wallet chain using the `useChainSync` hook. This would:
- ✅ Reduce confusion
- ✅ Ensure wallet is always on the correct network
- ❌ Prevent cross-chain browsing
- ❌ Require wallet connection for viewing

## Adding a New Chain

If you deploy to a new Base network (e.g., Base Goerli in the future):

1. **Deploy contracts** to the new chain
2. **Update `addresses.json`**:
   ```json
   {
     "84532": { ... },
     "8453": { ... },
     "NEW_CHAIN_ID": {
       "chainId": NEW_CHAIN_ID,
       "chainName": "Base NewNetwork",
       "explorer": "https://...",
       "contracts": {
         "HouseNFT": "0x...",
         "AuctionFactory": "0x...",
         "AuctionManager": "0x..."
       }
     }
   }
   ```
3. **Update `lib/contracts.ts`**:
   - Add to `SUPPORTED_CHAINS`
   - Add RPC URL to `RPC_URLS`
   - Add USDC address to `USDC_ADDRESSES`
4. **Update `lib/wagmi-config.ts`**:
   - Import the new chain from `wagmi/chains`
   - Add to `chains` array
   - Add transport configuration
5. **Update environment variables**:
   - Add `NEXT_PUBLIC_[NETWORK]_RPC_URL`
6. **Update page chain maps** if needed (should work automatically)

## Environment Variables

Required variables in `.env.local`:

```bash
# RPC URLs
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org

# USDC Addresses (optional, have defaults)
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# RainbowKit
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id

# Network Selection (optional, defaults to Base Sepolia)
NEXT_PUBLIC_NETWORK=84532  # or 8453 for mainnet
```

## Testing Strategy

1. **Local Development**: Use Base Sepolia (84532)
2. **Staging**: Test on both chains
3. **Production**: 
   - Deploy to mainnet only when confident
   - Keep testnet data for reference/testing

## Current Status (Feb 2026)

✅ Arc Testnet removed from all chain configurations  
✅ Only Base Mainnet (8453) and Base Sepolia (84532) are supported  
✅ Single source of truth: `addresses.json`  
✅ Type-safe chain handling  
✅ Independent page-level chain selection  
