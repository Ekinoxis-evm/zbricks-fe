> ## Documentation Index
> Fetch the complete documentation index at: https://docs.cdp.coinbase.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication Methods

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

Embedded Wallets provide secure, user-friendly authentication methods that eliminate the complexity of traditional crypto wallets. Users can access their wallets through familiar authentication patterns like email one-time passwords (OTP), SMS, and social logins, without ever dealing with seed phrases or browser extensions.

<Tip>
  Ready to implement authentication? Check out the [Implementation Guide](/embedded-wallets/implementation-guide) for step-by-step integration instructions.
</Tip>

## Email OTP

Email OTP is the primary authentication method for Embedded Wallets, providing a secure and familiar experience for users.

<AccordionGroup>
  <Accordion title="How email OTP works">
    1. **User enters email**: The user provides their email address in your application
    2. **OTP sent**: A 6-digit one-time password is sent to their email
    3. **User verifies**: The user enters the OTP in your application
    4. **Wallet access**: Upon successful verification, the wallet is created or accessed
  </Accordion>

  <Accordion title="Security features">
    * **Time-limited codes**: OTPs expire after 10 minutes for security
    * **Rate limiting**: Protection against brute force attempts
    * **Secure delivery**: Emails sent through Coinbase's trusted infrastructure
    * **Device binding**: Wallets are cryptographically bound to the user's device
  </Accordion>

  <Accordion title="User experience benefits">
    * **No passwords to remember**: Users don't need to create or manage passwords
    * **Instant onboarding**: New users can create a wallet in seconds
    * **Familiar process**: Similar to authentication flows users already know
    * **Cross-device support**: Users can access their wallet from up to 5 devices
  </Accordion>
</AccordionGroup>

### Email Customization

By default, all emails are sent without customization. If you'd like to use a custom email template featuring
your app's name and logo, submit [this form](https://docs.google.com/forms/d/e/1FAIpQLSf6Ou2eRa37uE_skNkk8YFodzkSnomEbZzVgDiGkr26t_kGSg/viewform?usp=header), and we'll get you set up within one business day.

Emails are sent from "no-reply \<[no-reply@info.coinbase.com](mailto:no-reply@info.coinbase.com)>"; this field is not currently customizable.

## SMS OTP

SMS-based one-time passwords are available as an additional authentication method, providing users with more flexibility in how they access their wallets.

<AccordionGroup>
  <Accordion title="How SMS OTP works">
    1. **User enters phone number**: The user provides their phone number in your application
    2. **OTP sent**: A 6-digit one-time password is sent to their phone number
    3. **User verifies**: The user enters the OTP in your application
    4. **Wallet access**: Upon successful verification, the wallet is created or accessed
  </Accordion>

  <Accordion title="Security features">
    * **Time-limited codes**: OTPs expire after 5 minutes for security
    * **Rate limiting**: Protection against brute force attempts
    * **Secure delivery**: Text messages sent through Coinbase's trusted infrastructure
    * **Device binding**: Wallets are cryptographically bound to the user's device
  </Accordion>

  <Accordion title="User experience benefits">
    * **No passwords to remember**: Users don't need to create or manage passwords
    * **Instant onboarding**: New users can create a wallet in seconds
    * **Familiar process**: Similar to authentication flows users already know
    * **Cross-device support**: Users can access their wallet from up to 5 devices
  </Accordion>
</AccordionGroup>

This feature is currently supported for phone numbers from the following countries - Antigua and Barbuda, Australia, Austria, Bahamas, Belgium, Brazil, Bulgaria, Canada, Colombia, Croatia, Cyprus, Czech Republic, Denmark, Dominican Republic, Estonia, Finland, France, Germany, Greece, Grenada, Guyana, Hungary, India, Indonesia, Ireland, Italy, Japan, Kenya, Latvia, Lithuania, Luxembourg, Malta, Mexico, Netherlands, Philippines, Poland, Portugal, Romania, Saint Vincent and the Grenadines, Singapore, Slovakia, Slovenia, South Korea, Spain, Suriname, Sweden, Switzerland, Turkey, United Arab Emirates, United Kingdom, United States.

If you'd like to enable the feature in additional regions, reach out to us on [Discord](https://discord.com/invite/cdp).

<Warning>
  **SMS security considerations:**

  * SMS authentication is inherently vulnerable to SIM swapping attacks, where attackers can take over a user's phone number.
  * You should weigh the convenience of logging in with SMS with the potential for a user's wallet to be taken control of.
</Warning>

## Social login providers

Social login through Google, Apple, and X are supported via our SDK using OAuth 2.0.
We offer Coinbase-owned OAuth login, allowing users to recognize and trust Coinbase's brand during the login process.

<AccordionGroup>
  <Accordion title="How Social login works">
    1. **User initiates social login**: The user clicks on a familiar button like "Sign in with Google" or "Sign in with X"
    2. **User logs in**: The user is redirected to the login flow from the OAuth provider
    3. **User verifies**: The user completes login
    4. **Wallet access**: Upon successful verification, the wallet is created or accessed
  </Accordion>

  <Accordion title="Security features">
    * **Time-limited codes**: Social login sessions are managed using a refresh and access token model with configurable expiration
    * **Rate limiting**: Protection against brute force attempts
    * **Secure delivery**: Login is facilitated by Coinbase's trusted brand.
  </Accordion>

  <Accordion title="User experience benefits">
    * **No passwords to remember**: Users don't need to create or manage passwords
    * **Instant onboarding**: New users can create a wallet in seconds
    * **Familiar process**: Similar to authentication flows users already know
    * **Cross-device support**: Users can access their wallet from up to 5 devices
  </Accordion>
</AccordionGroup>

<Warning>
  **React Native OAuth setup:**
  OAuth authentication is fully supported in React Native, but requires deep link configuration to handle authentication callbacks. See our complete [React Native Social Login Configuration guide](/embedded-wallets/implementation-guide#react-native-social-login-configuration) for step-by-step instructions.
  **Note:** Email and SMS authentication work out-of-the-box in React Native with no additional configuration needed.
</Warning>

### Examples

Sign in with social providers using the OAuth flow. Note that the page from which the `signInWithOAuth` call occurs will be redirected back to after the user authenticates with their provider. The user will be automatically logged-in when `@coinbase/cdp-core` re-initializes.

<CodeGroup>
  ```typescript Google OAuth theme={null}
  import { initialize, signInWithOAuth } from '@coinbase/cdp-core';

  // Initialize the CDP SDK
  await initialize({
    projectId: 'your-project-id'
  });

  // Initiate Google OAuth sign-in
  // User will be redirected to Google to complete their login
  // After login, they will be redirected back to your app, and the login
  // process will be completed automatically by the SDK
  try {
    void signInWithOAuth("google");
  } catch (error) {
    console.error("Failed to sign in with Google:", error);
  }
  ```

  ```typescript Apple OAuth theme={null}
  import { initialize, signInWithOAuth } from '@coinbase/cdp-core';

  // Initialize the CDP SDK
  await initialize({
    projectId: 'your-project-id'
  });

  // Initiate Apple OAuth sign-in
  // User will be redirected to Apple to complete their login
  // After login, they will be redirected back to your app, and the login
  // process will be completed automatically by the SDK
  try {
    void signInWithOAuth("apple");
  } catch (error) {
    console.error("Failed to sign in with Apple:", error);
  }
  ```

  ```typescript X OAuth theme={null}
  import { initialize, signInWithOAuth } from '@coinbase/cdp-core';

  // Initialize the CDP SDK
  await initialize({
    projectId: 'your-project-id'
  });

  // Initiate X OAuth sign-in
  // User will be redirected to X to complete their login
  // After login, they will be redirected back to your app, and the login
  // process will be completed automatically by the SDK
  try {
    void signInWithOAuth("x");
  } catch (error) {
    console.error("Failed to sign in with X:", error);
  }
  ```
</CodeGroup>

## Auth method linking

Once a user is authenticated, you can enable them to link additional authentication methods to their account. This allows users to sign in using multiple methods (email, SMS, OAuth providers) while maintaining access to the same embedded wallet.

<AccordionGroup>
  <Accordion title="Why link authentication methods?">
    * **Meet 2FA requirements**: Coinbase Onramp requires both email and phone verification for seamless integration
    * **Improve account security**: Add additional authentication factors as users accumulate more funds
    * **Enhance account recovery**: Multiple methods provide backup options if one method becomes unavailable
    * **Flexible access**: Users can sign in with any linked method and access the same wallet
  </Accordion>

  <Accordion title="How it works">
    1. **User must be authenticated**: The user signs in using any supported method
    2. **Initiate linking**: User requests to link an additional authentication method
    3. **Verify the method**: Complete verification (OTP or OAuth flow)
    4. **Linked**: The new method is now associated with the same user account and wallet
  </Accordion>
</AccordionGroup>

For detailed implementation examples and code snippets, see the [Auth Method Linking guide](/embedded-wallets/auth-method-linking).

## Custom authentication

Custom authentication enables applications with existing authentication systems to integrate Embedded Wallets seamlessly. Instead of using CDP's built-in authentication (email OTP, SMS, OAuth), you can use JWTs from your own identity provider.

<AccordionGroup>
  <Accordion title="How custom authentication works">
    1. **Pre-configuration**: Configure your JWKS endpoint and optionally specify which JWT claim to use for user identification in CDP Portal
    2. **User logs in**: User authenticates with your existing auth system
    3. **JWT generation**: Your identity provider generates a JWT for the user
    4. **CDP validation**: CDP retrieves your JWKS, validates the JWT and required claims
    5. **Wallet access**: CDP uses the configured user identifier claim (default: `sub`, or custom like `email`, `user_id`) to get or create an embedded wallet
  </Accordion>

  <Accordion title="Use cases">
    * **Existing user base**: You already have users authenticated via Auth0, Firebase, Cognito, or custom solution
    * **Single sign-on (SSO)**: Users sign in once across your entire platform
    * **Enterprise requirements**: Need to integrate with corporate identity systems
    * **Regulatory compliance**: Must use specific authentication providers
  </Accordion>
</AccordionGroup>

### Requirements

Your identity provider must:

* Support JWKS (JSON Web Key Sets) with RS256 or ES256 signing
* Provide required JWT claims: `iss`, `exp`, `iat`, and a user identifier claim (default: `sub`, or a custom claim you configure)

### Getting started

See the complete [Custom Authentication guide](/embedded-wallets/custom-authentication) for setup instructions and code examples.

## Multi-Factor Authentication (MFA)

Add an extra layer of security to your embedded wallets with Time-based One-Time Password (TOTP) multi-factor authentication. Users can enroll using popular authenticator apps like Google Authenticator, Authy, or 1Password.

<AccordionGroup>
  <Accordion title="Key features">
    * **Industry-standard TOTP**: Compatible with all major authenticator apps
    * **Optional enrollment**: Let users choose when to enable MFA
    * **Flexible verification**: Require MFA for specific operations or all sensitive actions
    * **Easy integration**: Simple SDK methods for enrollment and verification
  </Accordion>

  <Accordion title="When to use MFA">
    * **High-value operations**: Require MFA for large transactions or withdrawals
    * **Account security changes**: Mandate MFA when changing authentication settings
    * **Compliance requirements**: Meet regulatory requirements for additional authentication
    * **User preference**: Allow security-conscious users to opt-in to enhanced protection
  </Accordion>
</AccordionGroup>

### Getting started with MFA

See the complete [Multi-Factor Authentication guide](/embedded-wallets/multi-factor-authentication) for implementation details and code examples.

## What to read next

* **[Implementation Guide](/embedded-wallets/implementation-guide)**: Step-by-step guide to implementing these authentication methods
* **[Auth Method Linking](/embedded-wallets/auth-method-linking)**: Link multiple authentication methods to a single wallet
* **[Session Management](/embedded-wallets/session-management)**: Understand session lifecycle and token management
* **[Best Practices](/embedded-wallets/best-practices)**: Security recommendations and production readiness
* **[Server-side validation](/embedded-wallets/implementation-guide#server-side-validation)**: Validate user sessions on your backend
