> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Node Quickstart

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

Get started with CDP Node in minutes. This guide shows you how to get your RPC endpoint and make your first blockchain request—both in the browser playground and programmatically in your code.

## Prerequisites

* A free [CDP account](https://portal.cdp.coinbase.com/)

That's it! No complex setup, no infrastructure to manage.

## 1. Try it in the playground

<NodePlaygroundQuickstart />

## 2. Get your RPC endpoint

To use Node in your application, you need an **RPC endpoint URL**. This is the web address where you send blockchain requests—think of it like an API endpoint, but specifically for blockchain operations.

<Steps>
  <Step title="Navigate to Node">
    Go to the [Node page](https://portal.cdp.coinbase.com/products/node) in CDP Portal.
  </Step>

  <Step title="Select your network">
    Choose your target network from the dropdown:

    * **Base Mainnet** - For production applications
    * **Base Sepolia** - For development and testing

    <Frame>
      <img src="https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=4479b65d62737f753f50b99b60fff66e" alt="Network selection dropdown in Node configuration" data-og-width="839" width="839" data-og-height="219" height="219" data-path="data/images/node-select-network.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=280&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=7d37cad0a7ee52ee2935e3d8e8542d5b 280w, https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=560&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=a2919b64c201b3344a91c76433ee62d5 560w, https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=840&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=46f036a11071aa67e21dbe6bff85dac7 840w, https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=1100&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=b4a88a098983c8f7116f2eafd79b365a 1100w, https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=1650&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=f47f6b55788ced6cb59f6107bded5535 1650w, https://mintcdn.com/coinbase-prod/h4Nc9NYI7BpHH7WQ/data/images/node-select-network.png?w=2500&fit=max&auto=format&n=h4Nc9NYI7BpHH7WQ&q=85&s=4171c011500cd1d77c3da30c5037e666 2500w" />
    </Frame>
  </Step>

  <Step title="Copy your endpoint URL">
    Copy the displayed RPC endpoint URL. It will look like:

    ```
    https://api.developer.coinbase.com/rpc/v1/base/YOUR_CLIENT_API_KEY
    ```

    The Client API key is automatically included in the URL for authentication.
  </Step>
</Steps>

<Info>
  **About Client API Keys**

  Your RPC endpoint URL includes a Client API key, which is designed for client-side use and is safe to include in frontend code. For more details, see [CDP API Keys](/get-started/authentication/cdp-api-keys#client-api-keys).
</Info>

## 3. Make your first request

Now let's make your first blockchain request programmatically. We'll query the current block number on Base.

<Tabs>
  <Tab title="cURL">
    ```bash  theme={null}
    curl https://api.developer.coinbase.com/rpc/v1/base/YOUR_CLIENT_API_KEY \
      -H "Content-Type: application/json" \
      -d '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_blockNumber"
      }'
    ```

    Response:

    ```json  theme={null}
    {
      "jsonrpc": "2.0",
      "id": 1,
      "result": "0x12a4b2c"
    }
    ```
  </Tab>

  <Tab title="JavaScript (fetch)">
    ```javascript  theme={null}
    const rpcUrl = "https://api.developer.coinbase.com/rpc/v1/base/YOUR_CLIENT_API_KEY";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_blockNumber",
      }),
    });

    const data = await response.json();
    console.log("Current block:", parseInt(data.result, 16));
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={null}
    import requests
    import json

    rpc_url = "https://api.developer.coinbase.com/rpc/v1/base/YOUR_CLIENT_API_KEY"

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_blockNumber"
    }

    response = requests.post(rpc_url, json=payload)
    result = response.json()

    # Convert hex to decimal
    block_number = int(result["result"], 16)
    print(f"Current block: {block_number}")
    ```
  </Tab>

  <Tab title="Node.js">
    ```javascript  theme={null}
    const https = require("https");

    const rpcUrl = "https://api.developer.coinbase.com/rpc/v1/base/YOUR_CLIENT_API_KEY";

    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(rpcUrl, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const result = JSON.parse(data);
        console.log("Current block:", parseInt(result.result, 16));
      });
    });

    req.write(payload);
    req.end();
    ```
  </Tab>
</Tabs>

<Tip>
  **Using Ethereum libraries?** Node works with any Ethereum-compatible library like ethers.js, viem, web3.js, or web3.py. Just use your RPC endpoint URL as the provider.
</Tip>

## What to read next

* **[Core EVM Methods](/api-reference/json-rpc-api/core)**: Explore all available JSON-RPC methods
* **[Paymaster Methods](/api-reference/json-rpc-api/paymaster)**: Learn how to sponsor gas fees for your users
* **[Wallet History Methods](/api-reference/json-rpc-api/wallet-history)**: Query historical wallet data
* **[Rate Limits](/data/node/overview#rate-limits)**: Understand your usage limits and request increases
* **[CDP Discord](https://discord.com/channels/1220414409550336183/1222183017284501535)**: Join #node for support and to request rate limit increases
