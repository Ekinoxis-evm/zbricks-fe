# ZBricks Frontend — Claude Code Reference

Real estate auction dApp on Base Chain. Built with Next.js 16 App Router, Privy auth, and wagmi for smart contract interactions. **All user-facing text is in Spanish** — no i18n library, strings are inline.

---

## Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 16.1.6 (App Router) |
| React | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (app pages) + inline styles (home page) |
| Auth | `@privy-io/react-auth` + `@privy-io/wagmi` |
| Blockchain | `wagmi` (via Privy bridge), `viem` |
| Chain | Base Mainnet (8453) or Base Sepolia (84532) — single chain only |

---

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=          # Required — get from dashboard.privy.io
PRIVY_APP_SECRET=                  # Server-side Privy secret
NEXT_PUBLIC_NETWORK=testnet        # "mainnet" | "testnet" — controls active chain
NEXT_PUBLIC_ADMIN_ADDRESSES=       # Comma-separated wallet addresses for admin access
NEXT_PUBLIC_RPC_BASE_MAINNET=      # Optional custom RPC (defaults to mainnet.base.org)
NEXT_PUBLIC_RPC_BASE_SEPOLIA=      # Optional custom RPC (defaults to sepolia.base.org)
NEXT_PUBLIC_USDC_BASE_MAINNET=     # Optional USDC override (default: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
NEXT_PUBLIC_USDC_BASE_SEPOLIA=     # Optional USDC override (default: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
```

---

## Provider Order (Critical)

The provider wrapping order in `app/providers.tsx` **must not change**:

```
PrivyProvider
  └── QueryClientProvider
        └── WagmiProvider  ← must come from @privy-io/wagmi, NOT wagmi
              └── OnboardingGate
                    └── {children}
```

- `createConfig` and `WagmiProvider` come from `@privy-io/wagmi`, not `wagmi` directly
- `PrivyProvider` must wrap `WagmiProvider` — Privy's wagmi bridge calls `useWallets()` internally

### Privy config (in `app/providers.tsx`)

```ts
loginMethods: ["email", "google", "wallet"]   // Apple removed intentionally
appearance: {
  theme: "dark",
  accentColor: "#2DD4D4",
  landingHeader: "Accede a ZBricks",
  logo: "https://zbricks.app/zbricks.png",    // update to prod URL when deploying
}
embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } }
```

---

## Single-Chain Architecture

The app always works on ONE chain at a time, controlled by `NEXT_PUBLIC_NETWORK`.

**Never** add chain selectors, multi-chain dropdowns, or per-chain UI for users.

Single source of truth — always import from these, never hardcode chain IDs:

```ts
// lib/contracts.ts
import { CONTRACTS, CHAIN_META, ACTIVE_NETWORK } from "@/lib/contracts";
// CONTRACTS.USDC, CONTRACTS.HouseNFT, CONTRACTS.AuctionFactory, CONTRACTS.AuctionManager
// CHAIN_META.chainName, CHAIN_META.explorer
// ACTIVE_NETWORK — the active chain ID number (8453 or 84532)

// lib/wagmi-config.ts
import { activeChain, config } from "@/lib/wagmi-config";
// activeChain — viem Chain object (base | baseSepolia)
```

---

## Authentication Patterns

Always use `usePrivy()` — never use wagmi's `useDisconnect` or try to manage sessions directly.

```ts
import { usePrivy } from "@privy-io/react-auth";
const { ready, authenticated, user, login, logout } = usePrivy();

// Wallet address
const address = user?.wallet?.address;

// Sign in / out
<button onClick={login}>Iniciar Sesión</button>
<button onClick={() => logout()}>Cerrar Sesión</button>   // logout is async
```

For wagmi hooks (reading contracts, writing transactions), use them normally — they work through Privy's bridge:

```ts
import { useAccount, useReadContract, useWriteContract } from "wagmi";
```

---

## Route Structure

```
app/
├── page.tsx               ← Home — NO Header, no navbar. Public landing page.
├── auctions/page.tsx      ← Main app entry — shows Header
├── properties/page.tsx    ← Shows Header
├── account/page.tsx       ← Protected (auth + onboarding required)
├── biddings/page.tsx      ← Protected (auth + onboarding required)
├── onboarding/page.tsx    ← Only shown to authenticated users without profile
├── admin/
│   ├── layout.tsx         ← Wraps all /admin/* with AdminGuard
│   └── page.tsx           ← Admin dashboard
└── components/
    ├── Header.tsx          ← Nav: Subastas, Propiedades, Mi Cuenta (+ Admin if admin wallet)
    ├── OnboardingGate.tsx  ← Redirect logic for auth/onboarding
    └── AdminGuard.tsx      ← Blocks /admin/* unless wallet is in ADMIN_ADDRESSES
```

**Navigation rule**: Header is rendered by each page that needs it (auctions, properties, account, biddings). The home page (`app/page.tsx`) does NOT render Header.

---

## OnboardingGate — Auth Flow

`app/components/OnboardingGate.tsx` wraps all pages via `providers.tsx`.

**Redirect logic:**
- `authenticated + no profile` → `/onboarding`
- `unauthenticated + protected route` → `/` (home — NOT `/auctions`)
- `onboarding page + already onboarded` → `/auctions`
- Protected routes: `/account`, `/biddings`, `/admin`

**Loading state**: While Privy resolves or profile loads, renders a branded `<LoadingScreen />` (ZBricks "Z" logo + three animated dots on `#030712` background). Never returns `null` — avoids blank-screen flashes.

---

## Admin Access

Admin is controlled purely by wallet address — no separate login:

```ts
import { isAdminWallet } from "@/lib/admin";
// Returns true if address is in NEXT_PUBLIC_ADMIN_ADDRESSES (comma-separated env var)
```

- `app/admin/layout.tsx` wraps all admin pages with `<AdminGuard>`
- `AdminGuard` uses `usePrivy()` + `isAdminWallet()` — no DB required
- Header shows admin nav link only when `isAdminWallet(user?.wallet?.address)` is true

See `.claude/skills/admin.md` for full admin panel reference.

---

## Onboarding & User Profile

Stored in localStorage (Supabase-ready stub). Key: `zbricks_profile`.

```ts
import { useUserProfile } from "@/lib/hooks/useUserProfile";
const { isOnboarded, getProfile, saveProfile, clearProfile } = useUserProfile();
```

Profile shape (`types/user.ts`):
- `name`, `lastName`, `email`, `phoneCountryCode`, `phoneNumber`
- `expectedInvestment` (range string from `INVESTMENT_RANGES`)
- `walletAddress`, `privyUserId`, `onboardingCompleted`, `createdAt`

The onboarding wizard (`app/onboarding/page.tsx`) is a 3-step card:
1. **Personal** — nombre + apellido
2. **Contacto** — email + teléfono (country code picker, default `+57`)
3. **Inversión** — investment range selector (radio-style buttons)

See `.claude/skills/onboarding.md` for full design reference.

---

## Home Page (`app/page.tsx`)

Public landing page — no Header, no auth required. Uses **inline styles only** (not Tailwind), max-width 1280px.

**Sections (top → bottom):**
1. **Hero** — 5:6 grid (text left, Kick.com stream right). Single ACCESS button triggers `login()` or pushes to `/auctions`.
2. **Cómo Funciona** — 5-column horizontal step cards (steps 01–05). CTA button in section header.
3. **Por Qué ZBricks** — Left label column + right 2×2 benefit card grid.
4. **Partners bar** — Base, USDC, ECOP logos from `/public/`.

**Kick channel**: `const KICK_CHANNEL = "zbricks"` — update slug when live channel is ready.

**Logo assets** (always use these, never hardcode):
- `/public/chains/base_logo.svg` — Base chain
- `/public/tokens/usdc.png` — USDC
- `/public/tokens/ecop.png` — ECOP
- `/public/zbricks.png` — ZBricks logo

See `.claude/skills/home.md` for full layout reference.

---

## Spanish Language Convention

All user-facing text is in Spanish. No i18n library — strings are inline. When adding new UI:
- Labels, buttons, headings → Spanish
- Error messages → Spanish
- Dates → `toLocaleDateString("es-CO", ...)`
- Code, variable names, comments → English

---

## Contract Interactions

ABIs are imported from `deploymnets/abi/` (note: folder is `deploymnets` not `deployments`).

```ts
import { auctionAbi, houseNftAbi, factoryAbi, erc20Abi } from "@/lib/contracts";
```

Always pass `chainId: ACTIVE_NETWORK` to `useReadContract` / `useWriteContract` when reading contracts.

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Top nav — Privy login/logout, wallet display, admin link |
| `AccountHoldings.tsx` | Shows USDC balance on active chain with USDC logo |
| `OnboardingGate.tsx` | Auth/onboarding redirect logic (wraps all pages via providers) |
| `AdminGuard.tsx` | Blocks admin pages for non-admin wallets |
| `PropertyCard.tsx` | Auction/property listing card |
| `PhaseProgressBar.tsx` | Visual auction phase indicator |
| `WalletInfo.tsx` | Wallet address display + copy |

---

## Things to Never Do

- Never import `createConfig` or `WagmiProvider` from `wagmi` — always from `@privy-io/wagmi`
- Never use `useDisconnect` from wagmi — use `logout()` from `usePrivy()`
- Never add chain selectors or multi-chain UI for end users
- Never hardcode chain IDs — use `ACTIVE_NETWORK`, `activeChain`, `CONTRACTS`
- Never render the Header on the home page (`app/page.tsx`)
- Never call `getContractsForChain()` for multi-chain balance fetching — single chain only
- Never return `null` from `OnboardingGate` — use `<LoadingScreen />` to avoid blank flashes
- Never add Apple as a Privy login method — intentionally removed
- Never write user-facing text in English — the app is Spanish-only

---

## Future: Supabase Migration

When Supabase budget is available, swap `lib/hooks/useUserProfile.ts`:
- Replace `localStorage.getItem/setItem` with Supabase calls
- The hook API (`getProfile`, `saveProfile`, `isOnboarded`) stays the same
- No other files need to change
