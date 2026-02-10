> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Welcome to Server Wallet v2

## Overview

The v2 Server Wallet enables developers to programmatically create, manage, and use crypto accounts while
CDP secures the private keys and handles complex infrastructure management. Developers can access the v2 Server Wallet through either the
[CDP SDK](https://github.com/coinbase/cdp-sdk) or [CDP's REST endpoints](/api-reference/v2/introduction).

With the v2 Server Wallet, you can execute token swaps directly from your CDP accounts, combining the power of our Trade APIs with secure transaction signing. This allows you to discover the best prices, create swap quotes, and execute trades in a single call.

The following table summarizes the key differences between v1 and v2 Server Wallet:

| Feature              | v1 Server Wallet 🔴    | v2 Server Wallet 🟢                                                          |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Security management  | Complex                | Easy                                                                         |
| Private key security | Developer-managed      | Secured in [AWS Nitro Enclave TEE](/server-wallets/v2/introduction/security) |
| Authentication       | One secret per account | Single secret for all accounts                                               |
| Network support      | EVM only               | EVM and Solana                                                               |
| EVM account scope    | Single EVM network     | Multiple EVM networks                                                        |
| Transaction batching | -                      | ✅                                                                            |
| Gas sponsorship      | -                      | ✅                                                                            |
| Spend permissions    | -                      | ✅                                                                            |
| Viem compatibility   | -                      | ✅                                                                            |

## Secure key management

Instead of securing your own private keys or needing to set up [Server-Signer infrastructure](/server-wallets/v1/concepts/server-signer),
the v2 Server Wallet greatly simplifies crypto key management by signing all of your transactions within a [Trusted Execution Environment (TEE)](/server-wallets/v2/introduction/security).

The TEE ensures that sensitive cryptographic material is never exposed to the outside world - not even to Coinbase!

<Info>
  The Trusted Execution Environment (TEE) provides a secure environment for signing your transactions,
  and ensures that your private keys are never exposed to Coinbase, AWS, or the outside world. Read more in our [Security documentation](/server-wallets/v2/introduction/security).
</Info>

### Single secret authentication

In the v2 Server Wallet, a single [Wallet Secret](/server-wallets/v2/introduction/security#wallet-secrets) grants access to all of your accounts
across both the EVM and Solana ecosystems. This single secret is used for sensitive wallet operations,
such as account creation and transaction signing.

### Rotatable Wallet Secret

In case your Wallet Secret is lost or compromised, you can [rotate your secret](/server-wallets/v2/using-the-wallet-api/wallet-secret-rotation) at any time.

## Multi-network support

Rather than limiting usage to a single EVM network, EVM accounts created using the v2 Server Wallet are compatible across all EVM chains.

The v2 Server Wallet also supports Solana accounts, allowing you to create and manage Solana accounts in addition to EVM accounts.

## Smart accounts

The v2 Server Wallet supports EIP-4337 [smart accounts](/server-wallets/v2/evm-features/smart-accounts), which provide the following advanced
features via smart contract calls:

* [Transaction batching](/server-wallets/v2/evm-features/smart-accounts#3-batch-calls-within-a-single-user-operation)
* [Gas sponsorship](/server-wallets/v2/evm-features/gas-sponsorship)
* Spend permissions (guide coming soon)

<Accordion title="More on smart accounts">
  Also known as a smart contract account, a **smart account** is an account powered by a smart contract instead of an externally owned account (EOA).

  With a CDP smart account, you can:

  * Sponsor gas fees so users don't need ETH to interact onchain
  * Batch multiple requests in a single user operation
  * Enforce custom access policies, such as spend limits or time-based rules

  Implemented using the [EIP-4337 standard](https://eips.ethereum.org/EIPS/eip-4337), a smart account can function
  like a "normal" account, enhancing usability, security, and flexibility for developers and end-users.
</Accordion>

## viem compatibility

EVM Accounts in the v2 Server Wallet can be used directly with [viem](https://viem.sh/) as [custom accounts](https://viem.sh/docs/accounts/local/toAccount#toaccount).
This allows you to leverage viem's widely-used abstractions seamlessly with the [CDP SDK](https://github.com/coinbase/cdp-sdk).
Refer to the [viem compatibility guide](/server-wallets/v2/evm-features/viem-compatibility) for more details.

## Swaps

The v2 Server Wallet enables seamless token swaps and programmatic trading directly from your CDP accounts, empowering developers to build **automated trading bots**, integrate DeFi swaps into **web3 applications**, and execute sophisticated **trading strategies** using Coinbase infrastructure.

This powerful integration combines real-time price discovery, competitive quote creation, and secure transaction execution into a single API call, while maintaining the flexibility to use your own wallet and node infrastructure if preferred.

Learn more in the comprehensive [Trade API guide](/trade-api/welcome).

## Support and feedback

Join **#wallet-api** in the [CDP Discord](https://discord.com/invite/cdp) to access FAQs, schedule project discussions, and connect with other developers. We welcome your feedback and suggestions for improvement.

## Video: Watch and learn

Explore comprehensive video resources to learn about CDP Server Wallet v2 features and see real-world implementations:

* **[Instamint Demo](/get-started/demo-apps/app-examples/instamint)**: AI-powered NFT creation application with video walkthrough
* **[Wallet Command Center Demo](/get-started/demo-apps/app-examples/wallet-command-center)**: Comprehensive wallet management application with demo video

## What to read next

* [Quickstart](/server-wallets/v2/introduction/quickstart): Create onchain accounts and send funds within minutes using the v2 Server Wallet.
* [Security](/server-wallets/v2/introduction/security): Learn about new security features and how the v2 Server Wallet protects your private keys.
* [Accounts](/server-wallets/v2/introduction/accounts): Descriptions of v2-supported account types and how to use them.
* [API Reference](/api-reference/v2/introduction): Full API reference for the v2 Server Wallet.

