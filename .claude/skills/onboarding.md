# ZBricks Onboarding & Auth Flow — Skill Reference

---

## Auth Flow (End-to-End)

```
User visits any URL
  │
  ├─ OnboardingGate resolves auth state
  │   └─ While resolving → <LoadingScreen /> (never null/blank)
  │
  ├─ Unauthenticated + protected route (/account, /biddings, /admin)
  │   └─ Redirect to "/" (home — not /auctions)
  │
  ├─ Authenticated + no profile
  │   └─ Redirect to "/onboarding"
  │
  ├─ Authenticated + profile complete
  │   └─ Render page normally
  │
  └─ On "/onboarding" + already has profile
      └─ Redirect to "/auctions"
```

Protected routes: `["/account", "/biddings", "/admin"]`

---

## Privy Configuration (`app/providers.tsx`)

```ts
loginMethods: ["email", "google", "wallet"]   // Apple intentionally excluded
appearance: {
  theme: "dark",
  accentColor: "#2DD4D4",
  landingHeader: "Accede a ZBricks",
  logo: "https://zbricks.app/zbricks.png",    // update to prod URL on deploy
}
embeddedWallets: {
  ethereum: { createOnLogin: "users-without-wallets" }
}
defaultChain: activeChain
supportedChains: [activeChain]
```

---

## OnboardingGate (`app/components/OnboardingGate.tsx`)

**Never returns `null`** — always renders `<LoadingScreen />` during indeterminate states to prevent blank flashes.

`<LoadingScreen />` — centered on `#030712`:
- ZBricks "Z" logo (48px, teal gradient, `borderRadius: 14`)
- Three animated dots (`dotPulse` keyframe, staggered 0/0.2s/0.4s delay)

---

## Onboarding Wizard (`app/onboarding/page.tsx`)

3-step card, max-width **520px**, centered on `#030712`.

### Steps

| # | Label | Fields | Validation |
|---|-------|--------|------------|
| 0 | Personal | Nombre, Apellido | Both ≥ 2 chars |
| 1 | Contacto | Email, Teléfono | Email contains `@`, phone ≥ 5 chars |
| 2 | Inversión | Investment range (radio buttons) | One must be selected |

### Step Indicator (card header)

Numbered circles (1, 2, 3) with connecting lines:
- **Completed** step: filled `#2DD4D4` background, dark text, checkmark icon
- **Active** step: `rgba(45,212,212,0.15)` bg, `#2DD4D4` border, `#2DD4D4` number
- **Upcoming** step: dim background, `rgba(255,255,255,0.12)` border

```ts
// Circle style pattern
background: i < step ? "#2DD4D4" : i === step ? "rgba(45,212,212,0.15)" : "rgba(255,255,255,0.05)"
border: i === step ? "1.5px solid rgba(45,212,212,0.6)" : i < step ? "1.5px solid #2DD4D4" : "1.5px solid rgba(255,255,255,0.12)"
```

Connector line between circles:
```ts
background: i < step ? "rgba(45,212,212,0.35)" : "rgba(255,255,255,0.08)"
```

### Card Structure

```
┌─────────────────────────────────────────┐
│  [Step indicator header — 24px 32px pad]│
├─────────────────────────────────────────┤
│  [Content — 32px pad]                   │
│    h2 title (22px, weight 700)          │
│    subtitle (14px, muted)               │
│    [Fields for this step]               │
│    [Navigation buttons]                 │
├─────────────────────────────────────────┤
│  [Footer — step X of Y + dot pills]     │
└─────────────────────────────────────────┘
```

Footer dot pills: active dot is wider (20px vs 6px), completed dots are `#2DD4D4` at 0.5 opacity.

### Navigation

- **Continuar** button: filled `#2DD4D4`, color `#0f172a`, shows arrow icon →
- **Atrás** button: transparent with border, only visible on step > 0
- **Comenzar a Explorar →** on final step (submit)
- Loading state: spinner inside button + "Guardando..."
- Disabled state: `rgba(255,255,255,0.07)` background, `rgba(255,255,255,0.25)` text

### Country Code Default

```ts
const [phoneCountryCode, setPhoneCountryCode] = useState("+57");  // Colombia
```

### Sub-components

**`<Field label="...">` ** — uppercase label (11px, weight 700, `rgba(255,255,255,0.4)`, letterSpacing 0.08em)

**`<Input />`** — styled input with teal focus border (`rgba(45,212,212,0.45)`) via `onFocus`/`onBlur`

### Investment Range Buttons

Styled as selectable radio rows:
```ts
// Selected
border: "1.5px solid rgba(45,212,212,0.5)"
background: "rgba(45,212,212,0.08)"
color: "#67e8f9", fontWeight: 600
// Shows checkmark SVG on right

// Unselected
border: "1px solid rgba(255,255,255,0.08)"
background: "rgba(255,255,255,0.025)"
color: "rgba(255,255,255,0.65)"
```

---

## User Profile

Stored in localStorage. Key: `zbricks_profile`. Shape from `types/user.ts`:

```ts
type UserProfile = {
  walletAddress: string;
  privyUserId: string;
  name: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  expectedInvestment: string;  // from INVESTMENT_RANGES[]
  onboardingCompleted: boolean;
  createdAt: string;           // ISO timestamp
};
```

Hook: `useUserProfile(walletAddress?)` from `@/lib/hooks/useUserProfile`
- `isOnboarded` — boolean
- `isLoading` — boolean (async check)
- `saveProfile(data)` — async, sets `onboardingCompleted: true`
- `clearProfile()` — removes from localStorage

**Future**: swap localStorage for Supabase calls — hook API stays identical.

---

## Things to Never Do

- Never redirect unauthenticated users to `/auctions` — always to `/` (home)
- Never return `null` from OnboardingGate — use `<LoadingScreen />`
- Never skip the onboarding step for authenticated users without a profile
- Never use `+1` as default country code — default is `+57` (Colombia)
- Never add Apple to Privy `loginMethods` — intentionally excluded
