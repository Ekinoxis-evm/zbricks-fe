# USDC Balance Fetching - Implementation Guide

## Current Status

✅ USDC addresses are now correctly configured:
- **Base Sepolia**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Where USDC Balances Are Currently Fetched

### 1. **Account Page** (`/account`)
   - ✅ `AccountHoldings.tsx` - Fetches total USDC balance across all chains
   - ✅ `TransferUSDC.tsx` - Fetches balance for the current chain before transfers
   - ✅ Auto-refresh every 30 seconds
   - ✅ Manual refresh button added

### 2. **Biddings Page** (`/biddings`)
   - ✅ Fetches USDC balance for bidding participation
   - Checks if user has sufficient balance before submitting bids
   - Fetches USDC allowance for spending approvals

## Configuration

All USDC addresses are centralized in `lib/contracts.ts`:

```typescript
const USDC_ADDRESSES = {
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // Base Mainnet
};

export function getContractsForChain(chainId: SupportedChainId) {
  return {
    ...typedDeployments[chainId].contracts,
    USDC: USDC_ADDRESSES[chainId],
  };
}
```

## Environment Variables

Set these in `.env.local`:
```env
NEXT_PUBLIC_USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_USDC_BASE_MAINNET=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## Features Implemented

### Account Page - Holdings Display
- Total balance across all networks
- Per-chain balance display
- Chain switching with automatic balance refresh
- **Auto-refresh**: 30-second interval
- **Manual refresh**: Button that refetches both chains

### Account Page - Transfer Form
- Real-time balance checking
- "Max" button to send entire balance
- Insufficient balance detection
- Transaction status feedback

### Bidding Page
- Balance check before participation
- Allowance check for spending approvals
- USDC approval workflow

## Refresh Behavior

### Automatic
- Balances refresh every 30 seconds (configurable)
- Happens in background without user action

### Manual
- "Refresh" button in Account page Holdings section
- Immediate refetch of both Sepolia and Mainnet balances
- Loading state shows "Refreshing..." during fetch

## Future Enhancements

Where to add USDC balance display:

1. **Header/Navigation**
   - Add balance widget showing current network balance
   - Quick access to account page
   
2. **Auctions Page**
   - Show total USDC available for bidding
   - Alert if insufficient balance for featured auction
   
3. **Properties Page**
   - Show USDC needed for each property
   - Compare with available balance

4. **Bidding Detail Page**
   - Prominent balance display
   - Real-time minimum bid validation

5. **Dashboard/Home**
   - Portfolio summary with USDC holdings
   - Recent transaction history

## Implementation Pattern

To add USDC balance fetching to any component:

```typescript
import { useReadContract, useAccount, useChainId } from "wagmi";
import { getContractsForChain } from "@/lib/contracts";
import { erc20Abi } from "@/lib/contracts";

export default function MyComponent() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = getContractsForChain(chainId);
  
  const { data: balanceRaw, refetch } = useReadContract({
    address: contracts.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 30000 },
  });
  
  const balance = balanceRaw 
    ? formatUnits(balanceRaw, 6) 
    : "0";
  
  return (
    <div>
      <div>Balance: ${balance}</div>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

## Troubleshooting

**Balances not updating?**
- Check that wallet is connected
- Verify USDC addresses match your network
- Check browser console for RPC errors

**Refresh button not working?**
- Ensure user has sufficient RPC credits
- Check network connectivity
- Verify contract addresses are correct

**Wrong balance shown?**
- Verify you're on the correct network
- Clear browser cache
- Check that address is correct (0x prefix)

## Testing

To test balance fetching:
1. Connect wallet with USDC on Base Sepolia or Mainnet
2. Navigate to My Account
3. See total holdings and per-chain balances
4. Click Refresh to manually refetch
5. Switch networks to see balance updates
6. Wait 30 seconds to see auto-refresh
