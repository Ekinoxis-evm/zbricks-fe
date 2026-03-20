# ZBricks Admin Panel — Skill Reference

## Architecture Overview

The admin panel lives under `app/admin/` and follows a shared-context pattern:

```
app/admin/
├── layout.tsx          — AdminGuard → AdminShell
├── AdminShell.tsx      — Header + Sidebar + AdminContext provider
├── AdminContext.tsx    — Shared state: publicClient, runTx, toasts, global data
├── adminUtils.ts       — Pure helpers: shorten, formatUsdc, daysToSeconds, explorerAddress
├── page.tsx            — Overview dashboard (stats, contracts, quick links)
├── properties/
│   └── page.tsx        — NFT management (mint, set URIs, advance phase, transfer admin)
├── launch/
│   └── page.tsx        — 4-step wizard to deploy AuctionManager via factory
└── auctions/
    └── page.tsx        — Select auction, read state, phase controls, emergency actions
```

### AdminContext (shared state)

All admin sub-pages use `useAdmin()` from `AdminContext`. Never re-declare public clients or wallets in sub-pages.

```ts
const {
  publicClient,     // viem PublicClient for the active chain
  walletAddress,    // from usePrivy()
  runTx,            // wrapper for writeContractAsync with toasts and loading overlay
  pushToast,        // manual toast trigger
  nftAdmin,         // HouseNFT.admin()
  nftNextTokenId,   // HouseNFT.nextTokenId() — tokens minted = nextTokenId - 1
  factoryOwner,     // AuctionFactory.owner()
  auctionsList,     // AuctionFactory.getAuctions()
  isNftAdmin,       // walletAddress === nftAdmin
  isFactoryOwner,   // walletAddress === factoryOwner
  refreshGlobal,    // re-fetches all of the above
  lastRefreshed,
} = useAdmin();
```

### runTx pattern

```ts
const hash = await runTx("Human-readable label", {
  address: CONTRACTS.HouseNFT,
  abi: houseNftAbi,
  functionName: "mintTo",
  args: [CONTRACTS.AuctionFactory],
});
if (hash) refreshGlobal();
```

`runTx` handles: wallet check, loading overlay, success/error toasts. Returns `hash | null`.

---

## Contract Reference

### HouseNFT (`CONTRACTS.HouseNFT`, `houseNftAbi`)

| Function | Signature | Who Can Call |
|----------|-----------|--------------|
| `mintTo` | `(recipient: address) → tokenId` | admin |
| `setPhaseURIs` | `(tokenId, uris: string[4])` | admin |
| `updatePhaseURI` | `(tokenId, phase: uint8, uri: string)` | admin |
| `advancePhase` | `(tokenId, newPhase: uint8)` | admin or controller |
| `setController` | `(tokenId, controller: address)` | admin |
| `transferAdmin` | `(newAdmin: address)` | admin only — irreversible |
| `setFactory` | `(factory: address)` | admin |
| `ownerOf` | `(tokenId) → address` | view |
| `tokenPhase` | `(tokenId) → uint8` | view |
| `getPhaseURI` | `(tokenId, phase) → string` | view |
| `nextTokenId` | `() → uint256` | view — tokens minted = nextTokenId - 1 |
| `trustedFactory` | `() → address` | view |

Phase indices: 0=Announcement, 1=Bidding, 2=Reveal, 3=Settlement

### AuctionFactory (`CONTRACTS.AuctionFactory`, `factoryAbi`)

| Function | Signature | Notes |
|----------|-----------|-------|
| `createAuction` | `(admin, tokenId, phaseDurations[4], floorPrice, minBidIncrementPercent, enforceMinIncrement, participationFee, treasury)` | All amounts in USDC micros (6 decimals). Durations in seconds. |
| `getAuctions` | `() → address[]` | Returns all deployed AuctionManager addresses |
| `owner` | `() → address` | Factory owner |

**Critical**: `createAuction` does NOT take `nftContract` or `paymentToken` — those are immutable on the factory constructor. Passing them causes a revert.

### AuctionManager (`auctionAbi`)

Deployed per auction via factory. Address from `getAuctions()` — never hardcoded.

| Function | Signature | Notes |
|----------|-----------|-------|
| `getAuctionState` | `() → (phase, leader, highBid, finalized, biddingOpen)` | Single call for overview |
| `advancePhase` | `()` | owner only |
| `finalizeAuction` | `()` | owner only, phase must be ≥ 3 |
| `withdrawProceeds` | `()` | owner only, must be finalized |
| `pause` / `unpause` | `()` | owner only |
| `emergencyWithdrawFunds` | `()` | owner only |
| `emergencyWithdrawNFT` | `()` | owner only |
| `tokenId` | `() → uint256` | Which NFT this auction is for |
| `currentPhase` | `() → uint8` | 0–3 |
| `currentLeader` | `() → address` | Current highest bidder |
| `currentHighBid` | `() → uint256` | In USDC micros |
| `finalized` | `() → bool` | |
| `floorPrice` | `() → uint256` | In USDC micros |
| `getBidderCount` | `() → uint256` | |
| `totalParticipationFees` | `() → uint256` | In USDC micros |
| `treasury` | `() → address` | Proceeds destination |
| `paused` | `() → bool` | |

---

## Launch Wizard Flow

The `/admin/launch` wizard has 4 steps:

**Step 1 — Verify Token**
- Input token ID
- Check `ownerOf(tokenId)` → must be `CONTRACTS.AuctionFactory`
- If not owned by factory: direct user to Properties → Mint to Factory

**Step 2 — Configure Auction**
- Phase durations (in days, converted to seconds via `daysToSeconds`)
- Floor price (in USDC whole units, converted via `parseUnits(val, 6)`)
- Participation fee (same)
- Min bid increment % (passed as integer, e.g. 5 for 5%)
- Enforce min increment (boolean)

**Step 3 — Addresses**
- Auction admin address
- Treasury address

**Step 4 — Review & Launch**
- Shows summary table of all params
- Calls `factory.createAuction(admin, tokenId, durations[4], floorPrice, minIncrement, enforceIncrement, fee, treasury)`

---

## Common Patterns

### Reading multiple auction fields efficiently

```ts
const results = await publicClient.multicall({
  contracts: [
    { address: auctionAddr, abi: auctionAbi, functionName: "tokenId" },
    { address: auctionAddr, abi: auctionAbi, functionName: "currentPhase" },
    { address: auctionAddr, abi: auctionAbi, functionName: "finalized" },
  ],
});
const [tokenId, phase, finalized] = results.map((r) => r.result);
```

### Amount conversions

```ts
import { parseUnits, formatUnits } from "viem";
// USDC → micros (for contract calls)
const micros = parseUnits("50000", 6);  // 50,000 USDC
// micros → display
const display = `${formatUnits(micros, 6)} USDC`;
// Days → seconds (for phase durations)
import { daysToSeconds } from "../adminUtils";
const seconds = daysToSeconds("14");  // 14 days in seconds as bigint
```

### Verifying factory ownership before launch

```ts
const owner = await publicClient.readContract({
  address: CONTRACTS.HouseNFT,
  abi: houseNftAbi,
  functionName: "ownerOf",
  args: [BigInt(tokenId)],
});
const ownedByFactory = (owner as string).toLowerCase() === CONTRACTS.AuctionFactory.toLowerCase();
```

---

## Design Conventions

All admin pages use the same dark theme:
- Background: `bg-[#030712]`
- Cards: `rounded-xl border border-white/[0.08] bg-white/[0.02] p-5`
- Input: `rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#2DD4D4]/40 focus:outline-none`
- Primary button (teal): `bg-[#2DD4D4]/10 border border-[#2DD4D4]/20 text-[#2DD4D4] hover:bg-[#2DD4D4]/20`
- Purple button: `bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa]`
- Danger button: `bg-red-500/10 border border-red-500/20 text-red-400`
- Section label: `text-xs font-semibold text-white/40 uppercase tracking-widest`

---

## Navigation

Sidebar is defined in `AdminShell.tsx` → `NAV` array. To add a new admin section:
1. Add `{ href: "/admin/newpage", label: "Label", exact: false }` to `NAV`
2. Create `app/admin/newpage/page.tsx`
3. No layout changes needed — `AdminShell` wraps all children automatically

---

## Things to Never Do in Admin Pages

- Never use `useWriteContract` directly — use `runTx` from `useAdmin()`
- Never create a new `publicClient` — use the one from `useAdmin()`
- Never hardcode auction addresses — always come from `factory.getAuctions()`
- Never pass `nftContract` or `paymentToken` to `createAuction` — they are immutable factory state
- Never skip `refreshGlobal()` after state-changing txs — it keeps the context in sync
- Never use `parseUnits(val, 18)` for USDC — it uses 6 decimals
