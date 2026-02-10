> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Welcome to Embedded Wallets

## Overview

With Embedded Wallets, your users can access the full power of blockchains through familiar authentication methods like email and social logins (no seed phrases, browser extensions, or pop-ups required).

Built on Coinbase's trusted infrastructure, they enable users to interact with blockchain applications without the complexity of traditional wallet management.

<Frame>
  <div className="wallet-comparison-wrapper">
    <img src="https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=5cc5fc37abfc5897125a791406d852db" alt="Comparison showing traditional wallets require 6 steps including seed phrase management, while embedded wallets only need 3 simple steps" data-og-width="2600" width="2600" data-og-height="2080" height="2080" data-path="images/wallet-experience-comparison.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=280&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=ca322faba40271b3e1978125543c26e3 280w, https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=560&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=a1a824510d903130cc5b7da4d8267c0e 560w, https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=840&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=3733ef589c0d1de14d7ff7d75c20da51 840w, https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=1100&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=99281ef0053bec257a5cffe521f3b229 1100w, https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=1650&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=1ebf20ca8317db57cec0817a88e1bab9 1650w, https://mintcdn.com/coinbase-prod/p8O1AbYtXGhoELzj/images/wallet-experience-comparison.svg?w=2500&fit=max&auto=format&n=p8O1AbYtXGhoELzj&q=85&s=844efba0cf9f75f818e83f0f9188acc4 2500w" />
  </div>
</Frame>

## Key benefits

* **User-custodied security**: Users maintain complete control of their assets with the ability to export keys anytime, while you focus on building great experiences
* **Easy onboarding**: Familiar login methods (email OTP and social logins) replace complex seed phrases
* **Lightning-fast wallet creation**: New wallets are created in under 500ms, enabling instant user onboarding
* **Complete customization**: Full control over UI/UX to match your brand and user experience
* **Enterprise-grade security**: Advanced cryptographic operations and transaction signing powered by secure infrastructure
* **Everything Wallet**: Access onramp/offramp, balances, transfers, swaps, and staking without additional integrations
* **USDC Rewards**: US-based developers earn 3.35% rewards on balances held across CDP Embedded Wallets (including Smart Accounts) and Server Wallets

## Try the interactive demo

Experience Embedded Wallets firsthand with our interactive demo at [demo.cdp.coinbase.com](https://demo.cdp.coinbase.com). The demo lets you:

* **Explore the user experience**: See how smooth onboarding can be with web2-friendly authentication
* **Test customization options**: Preview how embedded wallets can match your app's look and feel
* **Try core features**: Experience wallet creation, transactions, and key management in action

Perfect for developers who want to understand the product before diving into implementation.

## Video: Watch and learn

Watch our step-by-step guide to building with Embedded Wallets:

<iframe className="w-full aspect-video rounded-xl" src="https://www.youtube.com/embed/9tyzzyLZluM" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />

## How it works

Embedded Wallets are designed to be invisible to end-users while providing full onchain functionality:

1. **User authentication**: Users sign in with familiar methods like email OTP
2. **Invisible wallet creation**: A wallet is instantly created without seed phrases or pop-ups
3. **Seamless transactions**: Users can send, swap, stake, and interact with onchain apps while maintaining full control of their assets
4. **Developer control**: You maintain complete control over the UI/UX while users retain custody

## Use cases

* **Payment applications**: Enable instant peer-to-peer payments and merchant checkouts with built-in fiat on/off ramps
* **Gaming platforms**: Enable in-game purchases and NFT ownership without wallet friction
* **Social applications**: Let users tip, collect, and trade directly within your platform
* **Marketplaces**: Streamline checkout with built-in crypto payments and NFT trading
* **DeFi applications**: Provide access to lending, borrowing, and yield farming with simple UX

## Supported networks

Embedded Wallets support a wide range of blockchain networks:

<CardGroup cols={3}>
  <Card title="EVM Networks" icon="ethereum">
    All EVM-compatible networks including Base, Ethereum, Arbitrum, Polygon, Optimism, and more
  </Card>

  <Card title="Solana" icon={<img src="/icons/solana-blue.svg" alt="Solana" className="w-6 h-6" />}>
    Full support for Solana mainnet and devnet
  </Card>

  <Card title="Testnets" icon="flask">
    Base Sepolia, Ethereum Sepolia, Solana Devnet, and other test networks for development
  </Card>
</CardGroup>

For a complete list of supported networks and features, see our [Supported Networks](/get-started/supported-networks) page.

## Security and compliance

Embedded Wallets leverage CDP's advanced security infrastructure to provide true self-custody with enterprise-grade protection:

* **Advanced security architecture**: All cryptographic operations occur within secure, isolated environments that even Coinbase cannot access
* **Temporary Wallet Secrets**: Device-specific cryptographic keys are generated and stored locally on users' devices, never exposed to Coinbase
* **True self-custody**: Unlike traditional MPC solutions, our approach ensures faster operations while maintaining user control
* **Multi-device support**: Users can securely access their wallet from up to 5 different devices

This architecture combines the convenience of embedded wallets with the security guarantees of self-custodial solutions, ensuring your users maintain full control of their assets. Learn more in [Security & Export](/embedded-wallets/security-export).

## What to read next

* **[Quickstart Guide](/embedded-wallets/quickstart)**: Get started with embedded wallets in under 10 minutes
* **[Demo App Tutorial](/embedded-wallets/demo-app-tutorial)**: Build a complete demo app to learn all features
* **[Authentication Methods](/embedded-wallets/authentication-methods)**: Learn about email OTP, SMS OTP, and social login options
* **[Security Configuration](/embedded-wallets/domains)**: Configure domain allowlisting and security settings
