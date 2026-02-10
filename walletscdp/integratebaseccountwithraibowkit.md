> ## Documentation Index
> Fetch the complete documentation index at: https://docs.base.org/llms.txt
> Use this file to discover all available pages before exploring further.

# RainbowKit

> Integrate Base Account with RainbowKit

export const GithubRepoCard = ({title, githubUrl}) => {
  return <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="mb-4 flex items-center rounded-lg bg-zinc-900 p-4 text-white transition-all hover:bg-zinc-800">
      <div className="flex w-full items-center gap-3">
        <svg height="24" width="24" className="flex-shrink-0 dark:fill-white" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>

        <div className="flex min-w-0 flex-grow flex-col">
          <span className="truncate text-base font-medium">{title}</span>
          <span className="truncate text-xs text-zinc-400">{githubUrl}</span>
        </div>

        <svg className="h-5 w-5 flex-shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>;
};

## Overview

[RainbowKit](https://www.rainbowkit.com/) is a React library that makes it easy to add wallet sign-in to your onchain application. It's designed to work out-of-the-box and includes native support for Base Account.

By integrating RainbowKit with Base Account, you can provide your users with a seamless onboarding experience while maintaining access to the full Base Account feature set.

### What you'll achieve

By the end of this guide, you will:

* Set up RainbowKit with Base Account support
* Learn how to use both `ConnectButton` and `WalletButton` components
* Configure your app to prioritize Base Account as the primary wallet option
* Obtain and configure a Reown project ID (required for RainbowKit projects)

You can jump ahead and use the Base Account RainbowKit Template to get started:

<GithubRepoCard title="Base Account RainbowKit Template" githubUrl="https://github.com/base/demos/tree/master/base-account/base-account-rainbow-template" />

## Installation

After [creating a new Next.js project](https://nextjs.org/docs/app/getting-started/installation), install the required dependencies:

<CodeGroup>
  ```bash npm theme={null}
  npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
  ```

  ```bash pnpm theme={null}
  pnpm add @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
  ```

  ```bash yarn theme={null}
  yarn add @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
  ```

  ```bash bun theme={null}
  bun add @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
  ```
</CodeGroup>

<Tip>
  **Access the latest version of the Base Account SDK (Recommended)**

  It is {<u>HIGHLY RECOMMENDED</u>} to access the latest version of the Base Account SDK in order to get the latest features and bug fixes.

  To do this, you can use the following command to override it:

  <CodeGroup>
    ```bash npm theme={null}
    npm pkg set overrides.@base-org/account="latest"
    # OR manually add to package.json:
    # "overrides": { "@base-org/account": "latest" }
    ```

    ```bash pnpm theme={null}
    # pnpm requires manual addition to package.json:
    # "pnpm": { "overrides": { "@base-org/account": "latest" } }
    ```

    ```bash yarn theme={null}
    # yarn uses resolutions - add manually to package.json:
    # "resolutions": { "@base-org/account": "latest" }
    ```

    ```bash bun theme={null}
    # bun supports overrides - add manually to package.json:
    # "overrides": { "@base-org/account": "latest" }
    ```
  </CodeGroup>

  Or you can use a specific version by adding the version to the overrides:

  <CodeGroup>
    ```bash npm theme={null}
    npm pkg set overrides.@base-org/account="2.2.0"
    # OR manually add to package.json:
    # "overrides": { "@base-org/account": "2.2.0" }
    ```

    ```bash pnpm theme={null}
    # pnpm requires manual addition to package.json:
    # "pnpm": { "overrides": { "@base-org/account": "2.2.0" } }
    ```

    ```bash yarn theme={null}
    # yarn uses resolutions - add manually to package.json:
    # "resolutions": { "@base-org/account": "2.2.0" }
    ```

    ```bash bun theme={null}
    # bun supports overrides - add manually to package.json:
    # "overrides": { "@base-org/account": "2.2.0" }
    ```
  </CodeGroup>

  Make sure to delete your `node_modules` and `package-lock.json` and run a new install to ensure the overrides are applied.
</Tip>

## Get Your Reown Project ID

Before you can use RainbowKit with Base Account, you need to obtain a project ID from Reown Cloud.

1. Visit [Reown Cloud Dashboard](https://dashboard.reown.com/)
2. Sign up for a free account or log in if you already have one
3. Create a new project and copy the project ID.

## Configuration

### 1. Configure Wagmi with RainbowKit

Create a `wagmi.ts` file in your `src` directory to configure your blockchain connections and wallet options:

```tsx src/wagmi.ts theme={null}
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  base,
  mainnet
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'My Base Account App',
  projectId: 'YOUR_PROJECT_ID', // Replace with your Reown project ID
  chains: [
    mainnet,
    base
  ],
  ssr: true, // Enable server-side rendering support
});
```

<Warning>
  **Replace YOUR\_PROJECT\_ID**

  Make sure to replace `'YOUR_PROJECT_ID'` with the actual project ID you obtained from [Reown Cloud](https://dashboard.reown.com/).

  For production applications, use environment variables:

  ```typescript  theme={null}
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  ```

  And add to your `.env.local`:

  ```bash  theme={null}
  NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
  ```
</Warning>

### 2. Set up RainbowKit Provider

Wrap your application with the necessary providers in your `_app.tsx`:

```tsx src/pages/_app.tsx theme={null}
import '../styles/global.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

import { config } from '../wagmi';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
```

## Usage

RainbowKit provides two main components for wallet connections: `ConnectButton` and `WalletButton`. Both components support Base Account out of the box.

### Option 1: Using ConnectButton

The `ConnectButton` is RainbowKit's all-in-one wallet connection component. It displays the wallet connection modal with all available wallets, including Base Account.

```tsx src/pages/index.tsx theme={null}
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 12,
      }}
    >
      <ConnectButton />
    </div>
  );
};

export default Home;
```

When implemented, this is what it will look like:

<div style={{ display: 'flex', justifyContent: 'center'}}>
  <img src="https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=07b89a7424774fc94bba3b2d019cb10b" alt="RainbowKit Wallet Window" style={{ width: '600px', height: 'auto' }} data-og-width="1470" width="1470" data-og-height="1030" height="1030" data-path="images/base-account/RainbowKitWalletWindow.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=280&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=c28a02977bfea8df71da4542afdea086 280w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=560&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=6485a29546c743d4d3912b0db2fb33fe 560w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=840&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=611340870aed3618f83f7df138df6fc2 840w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=1100&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=c7c98992959ccddea21a7ef4bcfa84ec 1100w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=1650&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=81be894af80f61c1c36be000f61029df 1650w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/RainbowKitWalletWindow.png?w=2500&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=e5b2e76b57529d7e1976bb81bf740dc6 2500w" />
</div>

### Option 2: Using WalletButton for Base Account

The `WalletButton` component provides a direct connection to a specific wallet. This is ideal when you want to highlight Base Account as the primary wallet option.

```tsx src/pages/index.tsx theme={null}
import { WalletButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 12,
      }}
    >
      <WalletButton wallet="baseAccount" />
    </div>
  );
};

export default Home;
```

When implemented, this is what it will look like:

<div style={{ display: 'flex', justifyContent: 'center'}}>
  <img src="https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=44ecd890413d632aadcb537bea7480ff" alt="Base Account Button" style={{ width: '200px', height: 'auto' }} data-og-width="354" width="354" data-og-height="118" height="118" data-path="images/base-account/BaseAccountButton.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=280&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=1aed3a53b7a72ef0e4ff65d25198f5fb 280w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=560&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=6a8acac6a88e1fd870aa82d445b2dd71 560w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=840&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=001911df924af3bac78a5a43caf5e1dd 840w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=1100&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=c6807f3296c03c3844fd2e5e9568749e 1100w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=1650&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=a27cc2527dcdabfc6cbf83493fddc3b5 1650w, https://mintcdn.com/base-a060aa97/E62KENNpLCgmVkCe/images/base-account/BaseAccountButton.png?w=2500&fit=max&auto=format&n=E62KENNpLCgmVkCe&q=85&s=8f529189527f8017a76937a744779728 2500w" />
</div>

## Advanced Configuration

### Prioritize Base Account in Wallet List

To make Base Account appear first in the wallet connection modal, you can customize the wallet order:

```tsx src/wagmi.ts theme={null}
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'My Base Account App',
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  chains: [base, mainnet, sepolia],
  ssr: true,
  // Wallet configuration
  wallets: [
    {
      groupName: 'Recommended',
      wallets: ['baseAccount'], // Base Account appears first
    },
  ],
});
```

### Customize RainbowKit Theme

RainbowKit supports extensive theming options:

```tsx src/pages/_app.tsx theme={null}
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0052FF', // Base blue
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Access Wallet Connection State

Use wagmi hooks to access wallet connection state throughout your app:

```tsx  theme={null}
import { useAccount, useDisconnect, useEnsName } from 'wagmi';

function Profile() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  if (!isConnected) return <div>Not connected</div>;

  return (
    <div>
      <p>Connected to {ensName ?? address}</p>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
```

### Switch Networks Programmatically

Allow users to switch between different chains:

```tsx  theme={null}
import { useSwitchChain } from 'wagmi';
import { base, mainnet } from 'wagmi/chains';

function NetworkSwitcher() {
  const { switchChain } = useSwitchChain();

  return (
    <div>
      <button onClick={() => switchChain({ chainId: base.id })}>
        Switch to Base
      </button>
      <button onClick={() => switchChain({ chainId: mainnet.id })}>
        Switch to Mainnet
      </button>
    </div>
  );
}
```

## Best Practices

<Card title="Use Environment Variables" icon="shield-check">
  Store sensitive configuration like your Reown project ID in environment variables, not in your code:

  ```bash .env.local theme={null}
  NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
  ```
</Card>

<Card title="Enable SSR Support" icon="server">
  Always set `ssr: true` in your wagmi config for Next.js applications to avoid hydration issues:

  ```typescript  theme={null}
  export const config = getDefaultConfig({
    // ...
    ssr: true,
  });
  ```
</Card>

<Card title="Prioritize Base Chain" icon="link">
  Put Base as the first chain in your configuration to make it the default:

  ```typescript  theme={null}
  chains: [base, mainnet, ...otherChains]
  ```
</Card>

<Card title="Keep Dependencies Updated" icon="arrow-up">
  Regularly update RainbowKit, wagmi, and viem to get the latest Base Account features and security patches:

  ```bash  theme={null}
  npm update @rainbow-me/rainbowkit wagmi viem
  ```
</Card>

## Next Steps

Now that you have RainbowKit configured with Base Account, you can:

<CardGroup cols={2}>
  <Card title="Explore Base Account Features" icon="code" href="https://docs.base.org/base-account">
    Learn more about Base Account and its features
  </Card>

  <Card title="Explore RainbowKit Docs" icon="code" href="https://www.rainbowkit.com/docs/introduction">
    Learn more about RainbowKit and its features
  </Card>

  <Card title="Explore Wagmi Docs" icon="hook" href="https://wagmi.sh/react/hooks">
    Learn more about wagmi and its features
  </Card>

  <Card title="Join the Base Community" icon="code" href="https://discord.com/invite/buildonbase">
    Join the Base community and get help from other developers
  </Card>
</CardGroup>
