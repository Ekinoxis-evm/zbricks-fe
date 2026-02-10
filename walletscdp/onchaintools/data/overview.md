> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Welcome to Onchain Data

## Overview

Coinbase Developer Platform's (CDP) Onchain Data provides enterprise-grade tools to read, query, and monitor blockchain data. Get millisecond-latency access to live onchain data without managing complex infrastructure.

<Card title="Try it now: Quickstart" icon="rocket" href="/data/get-started/quickstart">
  Experience CDP's data tools in just a few minutes—no SDK installation required
</Card>

## Key features

* **Ultra-low latency:** Sub-500ms response times with data \<250ms from chain tip
* **Enterprise-grade reliability:** Production-ready infrastructure built on Coinbase's institutional-grade systems
* **Real-time updates:** Instant notifications via webhooks with guaranteed delivery and retry logic
* **Zero infrastructure:** No nodes to run, no databases to maintain, no DevOps overhead
* **Rich data coverage:** Token balances, wallet history, and more
* **Easy integration:** Simple REST APIs and comprehensive SDKs in TypeScript, Python, Go, and Rust

## Use cases

CDP Onchain Data powers real-time applications across DeFi, NFTs, gaming, and more:

* **DeFi dashboards** - Track token prices, liquidity pools, and trading volumes in real-time
* **NFT marketplaces** - Index collections, monitor transfers, and display ownership history
* **Wallet analytics** - Analyze transaction patterns and token holdings
* **Real-time alerts** - Get notified instantly when onchain events occur
* **Trading bots** - React to market changes with sub-second data freshness

## Demo applications

See CDP Data in action with working examples:

<CardGroup cols={2}>
  <Card title="Wallet History Dashboard" icon="wallet" href="/get-started/demo-apps/app-examples/wallet-history">
    Track wallet transactions and balances over time
  </Card>

  <Card title="Transaction History Downloader" icon="download" href="/get-started/demo-apps/app-examples/transaction-history-downloader">
    Download and export wallet transaction history
  </Card>
</CardGroup>

## Available services

<CardGroup cols={2}>
  <Card title="SQL API" icon="database" href="/data/sql-api/welcome">
    Query blockchain data with SQL. \< 500ms latency, \< 250ms from chain tip.
  </Card>

  <Card title="Node" icon="plug" href="/data/node/overview">
    RPC endpoints for Base with standard Ethereum methods.
  </Card>

  <Card title="Webhooks" icon="bell" href="/data/webhooks/welcome">
    Real-time notifications for onchain events with guaranteed delivery.
  </Card>

  <Card title="Token Balances API" icon="coins" href="/data/token-balance/welcome">
    Get current ERC-20 and native token balances for any address.
  </Card>

  <Card title="Address History API" icon="clock-rotate-left" href="/data/wallet-history/overview">
    Pre-indexed wallet transactions and historical balance tracking.
  </Card>
</CardGroup>
