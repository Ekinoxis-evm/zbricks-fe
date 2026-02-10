> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

export const TypeScriptConfigRequirement = () => {
  return <>
      <Note>
        <strong>TypeScript users:</strong> Set <code>moduleResolution: "node16"</code> or <code>"nodenext"</code> in your <code>tsconfig.json</code> (not the legacy <code>"node"</code>) to avoid compilation errors with the CDP SDK.
      </Note>
    </>;
};

export const Tags = ({tags, className}) => {
  if (!tags || !Array.isArray(tags)) {
    return null;
  }
  return <div className={`mt-5 mb-5 flex flex-row flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => <span key={index} className="text-sm text-[#733E00] dark:text-yellow-500 bg-[#FFFCF1] dark:bg-yellow-500/10 font-semibold px-2 py-1 rounded-lg">{tag}</span>)}
    </div>;
};

<Tags tags={["EVM", "Solana"]} />

## Overview

This guide demonstrates how to add embedded wallets to your existing React app with just a few lines of code.

<Tip>
  Check out the [CDP Web SDK reference](/sdks/cdp-sdks-v2/frontend) for comprehensive method signatures, types, and examples.
</Tip>

<Note>
  **Already have user authentication?** If you're using Auth0, Firebase, AWS Cognito, or another identity provider, check out [Custom Authentication](/embedded-wallets/custom-authentication) to integrate with your existing auth system.
</Note>

<Accordion title="What is an embedded wallet?">
  An **embedded wallet** is a self-custodial crypto wallet built directly into your app. Unlike traditional wallets (like MetaMask) that require browser extensions and seed phrases, embedded wallets let users sign in with familiar auth methods such as email, mobile SMS, and OAuth while maintaining full control of their assets.

  Key benefits:

  * **No downloads**: Works instantly in any browser
  * **Email sign-in**: No seed phrases to manage, but users retain full control
  * **You control the UX**: Seamlessly integrated into your app
</Accordion>

**Choose your path:**

<CardGroup cols={2}>
  <Card title="Integrate into your app" icon="code" href="#1-install-packages">
    Continue reading to add embedded wallets to your current React app with a few lines of code.
  </Card>

  <Card title="Check out our template app" icon="graduation-cap" href="/embedded-wallets/demo-app-tutorial">
    Build a complete demo app from scratch to learn all the features.
  </Card>
</CardGroup>

## Prerequisites

* A free [CDP Portal](https://portal.cdp.coinbase.com) account and project
* [Node.js 22+](https://nodejs.org/en/download)
* A node package manager installed (i.e., `npm`, `pnpm`, or `yarn`)
* Basic familiarity with React and TypeScript
* Configured your domain in CDP Portal (see below)

<Accordion title="How to configure your domain in CDP Portal">
  **Step 1: Access CDP Portal**

  Navigate to the [Domains Configuration](https://portal.cdp.coinbase.com/products/embedded-wallets/domains) in CDP Portal, and click **Add domain** to include your local app.

  <Frame>
    <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=d1ecf6491c979bf69553edeb1beca61a" alt="Add domain dialog in CDP Portal" data-og-width="1660" width="1660" data-og-height="1120" height="1120" data-path="images/cors-config-add-domain.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=01f89c16b13ca66fc3c24191fa7ab7c4 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=63c0b276c3ad4c5b3a37fd5e8f3a07b8 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c3437a803a7dbcdb7eb22bfe913eb433 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=7a88a9292888b1be9510a7f6687e1c3c 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c4c98bc08aa2b5983e936ec3dae7f757 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=cf169bd996652b42bc278609240c46ac 2500w" />
  </Frame>

  **Step 2: Add your domain**

  * For local development: Use `http://localhost:3000` (or your preferred port)
  * For production: Use your actual domain (e.g., `https://yourapp.com`)

  <Frame>
    <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=ea25f70a9b4fbf5e2e4668c61377c796" alt="Domain configuration with localhost" data-og-width="1208" width="1208" data-og-height="538" height="538" data-path="images/cors-config-with-localhost.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=8f3391c327928e2d61e1d03764d19e6f 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=836f9c9ae8eb54b41096e97a99c9114f 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=e571488132b261b5f0430c8437c029bb 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c8e52b451c48a4fb3f7d2989ba74f6da 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=51b910dd59784947a7ecf060853fcf8a 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=a2c1885fc15fe4c75034805a26e2645b 2500w" />
  </Frame>

  <Warning>
    For production apps, only add your actual production domain. Do not add `localhost` to production CDP projects as malicious apps running locally could impersonate your frontend and abuse your project credentials.
  </Warning>

  **Step 3: Save your changes**

  Click **Add domain** again to save your changes.

  <Frame>
    <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=a68e0385f89e0c8cef10a43139924215" alt="Domain configuration saved in CDP Portal" data-og-width="1674" width="1674" data-og-height="744" height="744" data-path="images/cors-config-with-domain.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=dd3ad1b541aa91ec1e57d24ec3670152 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=8b01359394a6187ecc7359d98a08d6b9 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=0082df68a31bb7f322450031bc31dc87 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=1de79708a0de0648206db8fe9f0d9437 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=85d18a75d410d7068bf39097a60981e6 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-domain.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=989408a4e083704cf6fc01759a172801 2500w" />
  </Frame>

  You should see your domain listed in the CDP Portal dashboard. The allowlist will take effect immediately upon saving.
</Accordion>

<TypeScriptConfigRequirement />

## 1. Install packages

Once you've completed the prerequisites above, install the required packages:

<CodeGroup>
  ```bash npm theme={null}
  npm install @coinbase/cdp-react @coinbase/cdp-core @coinbase/cdp-hooks
  ```

  ```bash pnpm theme={null}
  pnpm add @coinbase/cdp-react @coinbase/cdp-core @coinbase/cdp-hooks
  ```

  ```bash yarn theme={null}
  yarn add @coinbase/cdp-react @coinbase/cdp-core @coinbase/cdp-hooks
  ```
</CodeGroup>

## 2. Wrap your app with the provider

Add the CDP provider to your root component (typically `App.tsx` or `main.tsx`). Replace `"your-project-id"` with your actual project ID from [CDP Portal](https://portal.cdp.coinbase.com).

```tsx  theme={null}
import { CDPReactProvider } from "@coinbase/cdp-react";

function App() {
  return (
    <CDPReactProvider
      config={{
        projectId: "your-project-id",
        ethereum: { // if you want to create an EVM account on login
          createOnLogin: "eoa" // or "smart" for smart accounts
        },
        solana: { // if you want to create a Solana account on login
          createOnLogin: true
        },
        appName: "Your App Name"
      }}
    >
      <YourExistingApp />
    </CDPReactProvider>
  );
}
```

## 3. Add authentication

### Option A: Use the AuthButton (recommended)

The simplest approach is to use the `AuthButton` component which handles the entire authentication flow:

```tsx  theme={null}
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { useIsSignedIn } from "@coinbase/cdp-hooks";

function AuthComponent() {
  const { isSignedIn } = useIsSignedIn();

  return (
    <div>
      {isSignedIn ? (
        <div>Welcome! You're signed in.</div>
      ) : (
        <div>
          <h2>Please sign in</h2>
          <AuthButton />
        </div>
      )}
    </div>
  );
}
```

### Option B: Build custom auth UI

For custom UIs, use the authentication hooks directly:

```tsx  theme={null}
function CustomAuthComponent() {
    const { signInWithEmail } = useSignInWithEmail();
    const { verifyEmailOTP } = useVerifyEmailOTP();
    const { isSignedIn } = useIsSignedIn();
    const [flowId, setFlowId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    const handleEmailSubmit = async () => {
        if (!email) return;
        try {
            const result = await signInWithEmail({ email });
            setFlowId(result.flowId);
        } catch (error) {
            console.error("Sign in failed:", error);
        }
    };

    const handleOtpSubmit = async () => {
        if (!flowId || !otp) return;
        try {
            const { user } = await verifyEmailOTP({ flowId, otp });
            console.log("Signed in!", user.evmAccounts?.[0]);
        } catch (error) {
            console.error("OTP verification failed:", error);
        }
    };

    if (isSignedIn) {
        return <div>Welcome! You're signed in.</div>;
    }

    return (
        <div>
            {flowId ? (
                <div>
                    <h2>Enter OTP</h2>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP code" />
                    <button onClick={handleOtpSubmit}>Verify OTP</button>
                </div>
            ) : (
              <div>
                <h2>Sign in with Email</h2>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                <button onClick={handleEmailSubmit}>Send OTP</button>
              </div>
            )}
        </div>
    );
}
```

## 4. Send transactions

### EVM transactions

Once authenticated, users automatically get a wallet address. Here's how to send EVM transactions:

```tsx  theme={null}
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { SendEvmTransactionButton } from "@coinbase/cdp-react";

function SendTransaction(){
    const { evmAddress } = useEvmAddress();
    return (
        <div>
            <div>
                <h2>Send Transaction</h2>
                {evmAddress ? (
                  <SendEvmTransactionButton
                    account={evmAddress}
                    network="base-sepolia"
                    transaction={{
                        to: evmAddress,
                        value: 1000000000000n,
                        chainId: 84532,
                        type: "eip1559",
                    }}
                    onSuccess={(hash) => {
                        console.log('Transaction successful:', hash);
                        alert(`Transaction sent! Hash: ${hash}`);
                    }}
                    onError={(error) => {
                        console.error('Transaction failed:', error);
                        alert(`Transaction failed: ${error.message}`);
                    }}
                    pendingLabel="Sending transaction..."
                  />
                ) : (
                    <p>Wallet not ready yet...</p>
                )}
            </div>
        </div>
    );
}
```

That's it! Your users now have embedded wallets and can send transactions.

### Solana transactions

Here's how to send Solana transactions:

```tsx  theme={null}
import { useSolanaAddress } from "@coinbase/cdp-hooks";
import { SendSolanaTransactionButton } from "@coinbase/cdp-react";

function SendTransaction(){
    const { solanaAddress } = useSolanaAddress();
    return (
        <div>
            <div>
                <h2>Send Transaction</h2>
                {solanaAddress ? (
                  <SendSolanaTransactionButton
                    account={solanaAddress}
                    network="solana-devnet"
                    transaction="base64-solana-transaction"
                    pendingLabel="Sending transaction..."
                  />
                ) : (
                    <p>Wallet not ready yet...</p>
                )}
            </div>
        </div>
    );
}
```

<Tip>
  For more details on building Solana transactions, error handling, and advanced examples, see [Solana Sending Transactions](/embedded-wallets/solana-features/sending-transactions).
</Tip>

## What to read next

<CardGroup cols={2}>
  <Card title="Demo app tutorial" icon="graduation-cap" href="/embedded-wallets/demo-app-tutorial">
    Build a complete demo app to learn all features in depth
  </Card>

  <Card title="React Hooks" icon="code" href="/embedded-wallets/react-hooks">
    Explore all available hooks for advanced functionality
  </Card>

  <Card title="React Components" icon="puzzle-piece" href="/embedded-wallets/react-components">
    Use pre-built components for faster development
  </Card>

  <Card title="Next.js Integration" icon="arrow-right" href="/embedded-wallets/nextjs">
    Learn about "use client" requirements and setup
  </Card>
</CardGroup>

<Tip>
  **Need testnet funds?** Get free Base Sepolia ETH from the [Base Faucet](https://portal.cdp.coinbase.com/products/faucet) to test transactions.
</Tip>
