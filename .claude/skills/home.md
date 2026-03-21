# ZBricks Home Page — Skill Reference

File: `app/page.tsx`

---

## Layout Overview

Public landing page — no Header, no auth required. Uses **inline styles only** (not Tailwind classes). Background `#030712`.

Max-width: **1280px** with **40px side padding** on all sections.

```
page.tsx
├── Background gradient (absolute, pointer-events: none)
├── Hero              — 5:6 grid (text | Kick stream)
├── Cómo Funciona     — 5-column step cards
├── Por Qué ZBricks   — 1:3 grid (label | 2×2 benefit cards)
└── Partners bar      — flex row with logos
```

---

## Data Constants

### STEPS (5 steps)

```ts
const STEPS = [
  { number: "01", title: "Inicia Sesión",       description: "..." },
  { number: "02", title: "Completa tu Perfil",  description: "..." },
  { number: "03", title: "Fondea tu Cuenta",    description: "..." },
  { number: "04", title: "Paga tu Entrada",     description: "..." },  // participation fee
  { number: "05", title: "Puja por Propiedades",description: "..." },
];
```

### BENEFITS (4 cards, 2×2 grid)

```ts
const BENEFITS = [
  { icon: "🏘️", title: "Llega Antes que el Mercado", description: "..." },
  { icon: "🔍", title: "Transparencia Total",          description: "..." },
  { icon: "⚡",  title: "Pujas en Tiempo Real",        description: "..." },
  { icon: "🏛️", title: "Participación Abierta",       description: "..." },
];
```

---

## Section Specs

### Hero

```
gridTemplateColumns: "5fr 6fr"   gap: 72px
padding: "96px 40px 72px"
```

**Left column — text:**
- Badge: green dot pulse + "Subastas en Vivo — Abiertas Ahora" in `#2DD4D4`
- `<h1>`: `clamp(2.4rem, 4.5vw, 4rem)`, weight 800, letter-spacing -1.5
- Accent: `<span style={{ color: "#67e8f9" }}>Antes que los Demás</span>`
- Subheadline: 18px, `rgba(255,255,255,0.55)`
- ACCESS button: `padding: "18px 48px"`, `bg: #2DD4D4`, color `#0f172a`, weight 800, letterSpacing 2

**Right column — Kick stream:**
```ts
const KICK_CHANNEL = "zbricks"; // update when live channel slug is known
// iframe src: `https://player.kick.com/${KICK_CHANNEL}`
```
- Container: `borderRadius: 22`, `border: "1px solid rgba(45,212,212,0.15)"`, `aspectRatio: "16/9"`
- LIVE badge: absolute top-left, red dot, "LIVE" in white

**handleAccess:**
```ts
function handleAccess() {
  if (!ready) return;
  if (authenticated) router.push("/auctions");
  else login();  // opens Privy modal
}
```

---

### Cómo Funciona (How it Works)

```
padding: "0 40px 96px"
```

Section header: **left-aligned** with CTA button **right-aligned** (justify-between flex row).

Steps grid:
```
gridTemplateColumns: "repeat(5, 1fr)"   gap: 16px
```

Step card:
- `padding: "32px 24px"`, `borderRadius: 20`
- Number: 10px, weight 800, `#2DD4D4`, letterSpacing 3
- Connector line between cards (absolute positioned, right: -8, `rgba(45,212,212,0.18)`)
- Last card has no connector

---

### Por Qué ZBricks (Benefits)

```
padding: "0 40px 96px"
gridTemplateColumns: "1fr 3fr"   gap: 64px   alignItems: "start"
```

Left column — label:
- Overline: `#67e8f9`, 11px, uppercase, letterSpacing 2.5
- `<h2>`: `clamp(1.7rem, 2.5vw, 2.4rem)`, weight 800
- Supporting text: 14px, `rgba(255,255,255,0.4)`

Right column — 2×2 benefit grid:
```
gridTemplateColumns: "1fr 1fr"   gap: 16px
```
Benefit card: `padding: "32px 28px"`, `borderRadius: 20`, `rgba(255,255,255,0.022)` background

---

### Partners Bar

```
padding: "28px 40px 80px"
borderTop: "1px solid rgba(255,255,255,0.06)"
```

Logo assets (always use these paths):
```
/public/chains/base_logo.svg   → Base (borderRadius: 6)
/public/tokens/usdc.png        → USDC (borderRadius: "50%")
/public/tokens/ecop.png        → ECOP (borderRadius: "50%")
```
Each: `width={22} height={22}`, label `fontSize: 13`, color `rgba(255,255,255,0.5)`

---

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary teal | `#2DD4D4` | Buttons, accents, numbers |
| Teal dim | `rgba(45,212,212,0.08–0.15)` | Card backgrounds |
| Cyan accent | `#67e8f9` | Headline accent span |
| Background | `#030712` | Page background |
| Text muted | `rgba(255,255,255,0.45–0.55)` | Subtitles, descriptions |
| Border | `rgba(255,255,255,0.07)` | Card borders |

---

## Responsive Breakpoints

```css
/* Defined in <style jsx> at bottom of file */
@media (max-width: 900px) {
  .hero-grid { grid-template-columns: 1fr; padding: 60px 24px 48px; gap: 40px; }
  .steps-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .steps-grid { grid-template-columns: 1fr; }
}
```

The benefits section collapses naturally via `auto-fit` since it's a regular CSS grid. The `1fr 3fr` left/right split does NOT have a mobile override yet — add one if needed.

---

## Things to Never Do on This Page

- Never render `<Header />` — home page has no nav
- Never use Tailwind classes — all styles are inline
- Never change max-width below 1280px (was 1100, bumped intentionally)
- Never add multiple CTA buttons in the hero — single ACCESS button only
- Never link to `/auctions` directly in hero — always go through `handleAccess()` so unauthenticated users hit the Privy login flow
