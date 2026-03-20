# ZBricks — Website Design Brief

> For use with Google Stitch or any design tool. This document describes the full product, brand, and page layout for the main marketing/landing site.

---

## What is ZBricks?

**ZBricks** is a real estate auction platform built on the **Base blockchain** (Ethereum L2). It lets users participate in on-chain property auctions using **USDC stablecoins** — no volatility, no surprises.

The platform uses **smart contracts** to manage the entire auction lifecycle transparently. Every bid, phase transition, and settlement is recorded on-chain and verifiable by anyone.

---

## Target Audience

- Real estate investors looking for alternative, tokenized assets
- Crypto-native users wanting exposure to real-world assets (RWA)
- Early adopters interested in DeFi + real estate intersection

---

## Brand Identity

| Token | Value |
|-------|-------|
| Primary color | `#2DD4D4` (teal/cyan) |
| Accent light | `#67e8f9` |
| Background | `#030712` (near-black) |
| Surface | `rgba(255,255,255,0.03)` |
| Border | `rgba(255,255,255,0.08)` |
| Font feel | Bold, modern, technical — crypto meets real estate |
| Tone | Exclusive, trustworthy, cutting-edge |

---

## Core Value Propositions

1. **Transparent** — Smart contracts on Base. Every bid visible on-chain.
2. **Stable** — Bids and settlements in USDC. No ETH price risk.
3. **Phase Auctions** — Properties are revealed progressively across 4 phases. More info unlocks as you commit more.
4. **Easy Onboarding** — Sign in with Google, email, or wallet. No seed phrases required.
5. **Exclusive Access** — You must be a registered member to participate. Gatekept by design.

---

## Home Page Layout

### Section 1 — Hero (Full-Screen)

**Left side:**
- Small badge: `● Live on Base Network` (pulsing green dot)
- Big headline: `Real Estate Auctions` / `On-Chain` (teal color on second line)
- Subheading: *"Transparent, secure property auctions powered by smart contracts. Bid with USDC, track phases in real-time, and own verified assets."*
- Single CTA button: **`ACCESS →`** (teal background, dark text)
  - When clicked → opens Privy login modal (email, Google, or wallet)
  - Once authenticated → redirects to `/auctions`
  - If not authenticated, user cannot access the app

**Right side (or center below on mobile):**
- **Kick.com live stream embed** — shows the ZBricks live auction stream
- Embed URL: `https://player.kick.com/zbricks` *(replace `zbricks` with actual channel slug)*
- The stream gives visitors a live preview of active auctions happening right now
- This creates urgency and social proof

**Visual treatment:**
- Dark background with teal radial glow from top-center
- Subtle blue gradient glow on the right
- Stream embed has rounded corners, subtle border, slight shadow

---

### Section 2 — How It Works (3 Steps)

**Step 1 — Connect**
- Sign in with Google, email, or your crypto wallet
- Icon: wallet / passkey

**Step 2 — Discover**
- Browse live property auctions. Each listing reveals more details as bidding progresses through 4 phases.
- Icon: eye / unlock

**Step 3 — Bid & Own**
- Place bids with USDC. Win the auction, receive the tokenized property NFT on Base.
- Icon: trophy / house

---

### Section 3 — Feature Cards (3 columns)

| Card | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | $ circle | USDC Payments | Bid and settle with USDC stablecoin. No volatility, no surprises. |
| 2 | wallet | Base Account | Sign in with your passkey. No seed phrases, no browser extensions. |
| 3 | clock | Phase Auctions | Progressive property reveals across 4 phases. More info unlocks as you bid. |

---

### Section 4 — Live Auction Preview (Optional / Enhanced)

- Show a teaser of 2–3 active auction cards (locked/blurred if not logged in)
- Overlay text: `"Login to see full details and place your bid"`
- CTA: **`ACCESS →`**

---

### Section 5 — Trust & Partners

- "Powered by" row with logos:
  - **Base** (blue square, "B")
  - **USDC** (blue circle, "$")
  - Optional: Privy, wagmi, Solidity

---

### Footer

- Logo + tagline: *"Real Estate On-Chain"*
- Links: Auctions | Properties | My Account | Admin (hidden unless admin)
- Social links (Twitter/X, Discord, Kick)
- Legal: Terms of Service | Privacy Policy
- `© 2025 ZBricks. Built on Base.`

---

## Authentication Flow

```
Landing Page (public, no auth required)
  │
  └─ User clicks [ACCESS]
       │
       └─ Privy modal opens
            ├─ Email
            ├─ Google
            └─ Crypto Wallet
                 │
                 └─ Authenticated → Onboarding check
                      ├─ No profile → /onboarding (collect name, email, phone)
                      └─ Has profile → /auctions (main app)
```

**Key rule**: Everything inside `/auctions`, `/properties`, `/account`, `/biddings` is **gated**. Unauthenticated users always land back at the home page.

---

## Kick Live Stream Embed

The Kick channel is embedded in the hero to show live property auctions to new visitors.

**Embed code:**
```html
<iframe
  src="https://player.kick.com/CHANNEL_SLUG"
  width="100%"
  height="100%"
  allowfullscreen
  frameborder="0"
  scrolling="no"
></iframe>
```

Replace `CHANNEL_SLUG` with the actual Kick channel username (e.g., `zbricks`).

When there's no live stream, consider showing a static thumbnail or the Kick channel page.

---

## Typography Guidelines

| Use | Font | Weight | Size |
|-----|------|--------|------|
| Main headline | System / Inter / Geist | 800 | clamp(2.5rem, 6vw, 4rem) |
| Sub-headline | Same | 400 | 18px |
| Card title | Same | 700 | 16px |
| Body / description | Same | 400 | 14px |
| Badge / label | Same | 600 | 12px |
| CTA button | Same | 700 | 15px |

---

## Key Pages (Post-Login App)

| Route | Description | Protected |
|-------|-------------|-----------|
| `/` | Landing / marketing home | No |
| `/auctions` | Live auction listings | Yes |
| `/properties` | All property listings | Yes |
| `/account` | User profile + holdings | Yes |
| `/biddings` | User's active bids | Yes |
| `/onboarding` | Profile setup (first login) | Yes (auth only) |
| `/admin` | Platform management | Yes (admin wallet only) |

---

## Notes for Designer

- The app is **exclusive by design** — the ACCESS button is intentional friction. Only serious participants register.
- The Kick embed creates **live social proof** — visitors see real auctions happening in real-time before they sign up.
- Mobile: stack hero vertically (text on top, stream below), make ACCESS button full-width.
- Dark mode only — the brand lives in dark.
- Avoid light backgrounds. The teal accent on dark is the signature visual identity.
- The pulsing green "Live" dot in the hero badge is a key UI element — keep it.
