> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Onchain Data: Quickstart

export const SqlPlaygroundQuickstart = () => {
  return <>
      <p>Use our SQL API to query onchain data in milliseconds. With SQL API, you can:</p>
      <ul>
        <li>Query <strong>transactions, events, blocks, and transfers</strong> across Base with <strong>&lt; 500ms latency</strong></li>
        <li>Join data across tables for complex analytics</li>
        <li>Track token flows, smart contract activity, and wallet behavior</li>
      </ul>
      <p>The fastest way to query onchain data is through the <strong>SQL Playground</strong> in CDP Portal.</p>
      <Steps>
        <Step title="Open SQL Playground">
          Navigate to the <a href="https://portal.cdp.coinbase.com/products/data/playground">SQL Playground</a> in Portal.
        </Step>
        
        <Step title="Try a query">
          Copy this query to see recent USDC transfers on Base:

          <CodeBlock language="sql">
{`SELECT 
  parameters['from'] AS sender,
  parameters['to'] AS to,
  parameters['value'] AS amount,
  address AS token_address
FROM base.events
WHERE 
  event_signature = 'Transfer(address,address,uint256)'
  AND address = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
LIMIT 10;`}
          </CodeBlock>

          See results in milliseconds! ⚡
        
          <Frame>
            <img src="/data/images/sql-playground-quickstart-query.png" alt="SQL Playground query results showing USDC transfers" />
          </Frame>
        </Step>
      </Steps>
    </>;
};

export const NodePlaygroundQuickstart = () => {
  return <>
      <p>CDP Node provides RPC endpoints for Base. With Node, you can:</p>
      <ul>
        <li>Read blockchain state (blocks, transactions, balances, smart contract data)</li>
        <li>Send transactions to the network</li>
        <li>Monitor events and subscribe to logs</li>
        <li>Call smart contracts on Base</li>
      </ul>
      <p>Let's make your first blockchain call using the <strong>Node Playground</strong> in CDP Portal.</p>
      <Steps>
        <Step title="Open Node Playground">
          Navigate to <a href="https://portal.cdp.coinbase.com/products/node">Node</a> in Portal.
        </Step>
        
        <Step title="Run the RPC call">
          The playground has a prefilled <code>eth_blockNumber</code> call. Click <strong>Run</strong> to get the current block number on Base.

          See results in milliseconds! ⚡

          <Frame>
            <img src="/data/images/node-playground-rpc-call.png" alt="Node Playground RPC call results showing current block number" />
          </Frame>
        </Step>
      </Steps>
    </>;
};

## Overview

Experience Coinbase Developer Platform's (CDP) onchain data tools in just a few minutes. No SDK installation, no complex authentication -- just instant access to live blockchain data.

In this guide, you will:

* Query live blockchain data through our SQL Playground
* Make your first RPC call to Base through our Node Playground

## Prerequisites

* A free [CDP account](https://portal.cdp.coinbase.com/)

That's it! No API keys needed!

## 1. Run a SQL query

<SqlPlaygroundQuickstart />

## 2. Make your first RPC call

<NodePlaygroundQuickstart />

## What to read next

<CardGroup cols={2}>
  <Card title="SQL Schema" icon="table" href="/data/sql-api/schema">
    See all available tables and columns
  </Card>

  <Card title="SQL API Reference" icon="book" href="/data/sql-api/rest-apis">
    Use the SQL API programmatically
  </Card>

  <Card title="RPC Methods" icon="plug" href="/data/node/api-reference/core-evm-methods">
    See all available RPC methods
  </Card>

  <Card title="Token Balances API" icon="coins" href="/data/token-balance/welcome">
    Get current ERC-20 and native token balances
  </Card>

  <Card title="Webhooks" icon="bell" href="/data/webhooks/welcome">
    Get real-time notifications for onchain events
  </Card>

  <Card title="Address History API" icon="clock-rotate-left" href="/data/address-history/overview">
    Pre-indexed wallet transactions and balance history
  </Card>
</CardGroup>
