> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Embedded Wallet Security

## Overview

The Coinbase Developer Platform (CDP) [Portal](https://portal.cdp.coinbase.com) requires you configure which domains are authorized to access CDP APIs. These domains are configured using Cross-Origin Resource Sharing (CORS), ensuring your users are protected while maintaining a seamless experience.

<Accordion title="More on CORS">
  CORS (Cross-Origin Resource Sharing) is a browser security mechanism that controls access between different web origins. An origin is defined by the combination of protocol (http/https), domain, and port.

  By default, browsers enforce the **same-origin policy**, blocking requests between different origins for security. CORS provides a way to safely relax this restriction:

  * **Without CORS**: Your website at `https://myapp.com` cannot access APIs at `https://api.cdp.coinbase.com`
  * **With CORS**: The API server explicitly allows specific origins, enabling secure cross-origin communication

  Learn more about CORS fundamentals in the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
</Accordion>

By properly configuring your embedded wallet domains, you create a secure boundary that ensures only authorized applications can access our APIs, preventing malicious websites from exploiting your wallet integration, and protecting your users from cross-site scripting attacks.

## Example

Let's walk through a practical example:

1. A dapp at `https://app.developer.com` wants to send a POST request to `https://api.cdp.coinbase.com/embedded-wallet-api/projects/{projectId}` (e.g., to create a wallet).
2. When Coinbase Developer Platform (CDP) receives the request, it will look up the list of allowed domains for the given project ID.
3. CDP queries its database and sees that the developer has configured `https://app.developer.com` as an allowed domain for the project.
4. CDP responds to the API with the following header set, allowing the response to return successfully:

```
Access-Control-Allow-Origin: https://app.developer.com
```

## How to configure domains

<Steps titleSize="p">
  <Step title="Access CDP Portal">
    Navigate to the [Domains Configuration](https://portal.cdp.coinbase.com/products/embedded-wallets/domains) in CDP Portal:

    <Frame>
      <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=d1ecf6491c979bf69553edeb1beca61a" alt="Domains configuration page in CDP Portal" data-og-width="1660" width="1660" data-og-height="1120" height="1120" data-path="images/cors-config-add-domain.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=01f89c16b13ca66fc3c24191fa7ab7c4 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=63c0b276c3ad4c5b3a37fd5e8f3a07b8 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c3437a803a7dbcdb7eb22bfe913eb433 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=7a88a9292888b1be9510a7f6687e1c3c 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c4c98bc08aa2b5983e936ec3dae7f757 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-add-domain.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=cf169bd996652b42bc278609240c46ac 2500w" />
    </Frame>
  </Step>

  <Step title="Add your domain">
    Click **Add domain** and enter your allowed domain and/or port (e.g., `https://yourdapp.com` in production or `http://localhost:3000` for local development):

    <Frame>
      <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=ea25f70a9b4fbf5e2e4668c61377c796" alt="Add domain dialog in CDP Portal" data-og-width="1208" width="1208" data-og-height="538" height="538" data-path="images/cors-config-with-localhost.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=8f3391c327928e2d61e1d03764d19e6f 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=836f9c9ae8eb54b41096e97a99c9114f 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=e571488132b261b5f0430c8437c029bb 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=c8e52b451c48a4fb3f7d2989ba74f6da 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=51b910dd59784947a7ecf060853fcf8a 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-with-localhost.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=a2c1885fc15fe4c75034805a26e2645b 2500w" />
    </Frame>

    <Warning>
      Do not use `localhost` for production use. Malicious apps running locally could impersonate your frontend and abuse your project credentials.
    </Warning>

    <Accordion title="Domain format requirements">
      * Domains must be of the form `<scheme>://<host>:<port>` or browser extension URLs
        * `<scheme>` must be either `http` or `https`
        * `<host>` must be a valid hostname
        * `:<port>` is optional for ports 80 (http) and 443 (https), but required for all other ports (e.g., `http://localhost:3000`)
      * Browser extension URLs are also supported:
        * `chrome-extension://<extension-id>` for Chrome extensions
        * `moz-extension://<extension-id>` for Firefox extensions
        * `safari-web-extension://<extension-id>` for Safari extensions
        * When using browser extension schemes, no port or path is allowed - only the unique extension ID following the scheme
      * **Mobile app Deep Link URLs** are supported and required for React Native OAuth/social login flows:
        * Format: `<scheme>://<path>`
        * `<scheme>` must match the scheme defined in your React Native app configuration (e.g., `app.json` or `app.config.js`)
        * `<path>` can be any path you choose (e.g., `my-app://callback`, `mycompany://oauth`, `myapp://auth/redirect`)
      * Maximum of 50 domains allowed per project
    </Accordion>
  </Step>

  <Step title="Save your changes">
    Click **Add domain** to save. Your allowed domains will appear in the dashboard, and changes will take effect immediately:

    <Frame>
      <img src="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=8a46677938fb9a774bf6d24911817711" alt="Allowed domains list" data-og-width="1476" width="1476" data-og-height="796" height="796" data-path="images/cors-config-allowed-domains.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=280&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=89511604a4ae82d8b0b990879578378c 280w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=560&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=fb37e29c6cce45ee4e852cc0b52e1df5 560w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=840&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=14f92f9e740c2f400fb674872cf3dd96 840w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=1100&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=75ca2668e135aa8b4d4d534fb3ccf3c6 1100w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=1650&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=d244b22a769082f1d0b8f28aa82fc613 1650w, https://mintcdn.com/coinbase-prod/54QcwrnR3tmkrVsF/images/cors-config-allowed-domains.png?w=2500&fit=max&auto=format&n=54QcwrnR3tmkrVsF&q=85&s=d95c5207305ba8abe9651c9d3420b0b1 2500w" />
    </Frame>

    <Tip>
      Add all domains where your app will run: development, staging, and production.
    </Tip>
  </Step>
</Steps>

## What to read next

* **[Quickstart Guide](/embedded-wallets/quickstart)**: Build your first embedded wallet app in under 10 minutes
* **[React Hooks Reference](/embedded-wallets/react-hooks)**: Learn about available hooks like `useSignInWithEmail`, `useEvmAddress`, `useSendSolanaTransaction`, and more
* **[React Components Guide](/embedded-wallets/react-components)**: Explore pre-built components for authentication, wallet management, and transactions
