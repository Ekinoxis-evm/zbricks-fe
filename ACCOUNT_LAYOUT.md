# Account Page - Visual Layout

## Desktop View
```
┌─────────────────────────────────────────┐
│  My Account                  [Disconnect]
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Total USDC Holdings                    │
│  $1,250.50                              │
│  Across 2 chains                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Switch Network                         │
│  ┌──────────────────┬──────────────────┐│
│  │ Base Sepolia     │ Base Mainnet     ││
│  │ $500.00 USDC     │ $750.50 USDC     ││
│  │ ✓ Selected       │                  ││
│  └──────────────────┴──────────────────┘│
└─────────────────────────────────────────┘

┌────────────────────────┬────────────────────────┐
│      [Receive]         │       [Send]           │
└────────────────────────┴────────────────────────┘

(Optional) Send Form - appears when "Send" is clicked:
┌─────────────────────────────────────────┐
│  Send USDC                            ✕ │
│                                         │
│  Available Balance: $500.00             │
│  Recipient Address: [input field]       │
│  Amount (USDC): [input field]     [Max] │
│                                         │
│  [Send USDC Button]                     │
│  [Close Button]                         │
└─────────────────────────────────────────┘
```

## Receive Modal (appears when "Receive" is clicked)
```
╔═════════════════════════════════════════╗
║  Receive USDC                         ✕ ║
║                                         ║
║              ┌──────────────┐           ║
║              │              │           ║
║              │    QR Code   │           ║
║              │              │           ║
║              └──────────────┘           ║
║                                         ║
║  Your Address                           ║
║  0x1234...5678 [Copy] [Share]           ║
║                                         ║
║          [Copy Address] [Share]         ║
║              [Close]                    ║
╚═════════════════════════════════════════╝
```

## Mobile View (Single Column)
```
┌──────────────────────┐
│My Account [Disconnect]
└──────────────────────┘

┌──────────────────────┐
│Total Holdings: $1,250│
└──────────────────────┘

┌──────────────────────┐
│Switch Network:       │
│┌────────────────────┐│
││ Base Sepolia       ││
││ $500.00 USDC       ││
││ ✓                  ││
│└────────────────────┘│
│┌────────────────────┐│
││ Base Mainnet       ││
││ $750.50 USDC       ││
│└────────────────────┘│
└──────────────────────┘

┌──────────────────────┐
│    [Receive]         │
└──────────────────────┘

┌──────────────────────┐
│      [Send]          │
└──────────────────────┘
```

## Component Hierarchy
```
AccountPage
├─ Header (existing)
├─ Gradient Background
├─ Main Content
│  ├─ Header Section (Title + Disconnect)
│  ├─ AccountHoldings
│  │  ├─ Total Holdings Card
│  │  └─ Chain Selector (2 buttons)
│  ├─ Action Buttons
│  │  ├─ Receive Button
│  │  └─ Send Button
│  ├─ TransferUSDC (conditional)
│  │  └─ Shows when Send is clicked
│  └─ ReceiveModal (portal)
│     └─ Shows when Receive is clicked
└─ Footer spacing
```

## Interactions
1. **View Holdings**: Page loads with total USDC and chain selector
2. **Switch Chain**: Click chain button → Network switches → Balances update
3. **Receive**: Click "Receive" → Modal opens with address & QR
4. **Send**: Click "Send" → Form appears → Enter details → Click "Send USDC"
