// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { formatUnits } from "@/lib/circle/evm";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type LoginError = {
  code?: number;
  message?: string;
};

type TokenBalanceEntry = {
  amount?: string;
  token?: {
    symbol?: string;
    name?: string;
  };
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

type GatewayBalanceEntry = {
  domain?: number;
  depositor?: string;
  balance?: string;
  source?: { domain?: number; depositor?: string };
  amount?: string;
  value?: string;
};

export default function HomePage() {
  const sdkRef = useRef<W3SSdk | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceIdLoading, setDeviceIdLoading] = useState(false);

  const [deviceToken, setDeviceToken] = useState<string>("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState<string>("");
  const [socialReady, setSocialReady] = useState<boolean>(false);

  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [gatewayBalances, setGatewayBalances] = useState<GatewayBalanceEntry[]>([]);
  const [gatewayTotal, setGatewayTotal] = useState<string | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState("");

  const [status, setStatus] = useState<string>("Ready");
  const [isError, setIsError] = useState<boolean>(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;

  // Initialize SDK on mount
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const onLoginComplete = (
          error?: LoginError | null,
          result?: LoginResult | null,
        ) => {
          if (cancelled) return;

          if (error || !result) {
            const message: string = error?.message || "Authentication failed.";

            setIsError(true);
            setStatus(message);
            setLoginResult(null);
            return;
          }

          // Success: we get userToken + encryptionKey for challenges
          setLoginResult({
            userToken: result.userToken,
            encryptionKey: result.encryptionKey,
          });
          setIsError(false);
          // Keep this neutral so later wallet-status messages aren't confusing
          setStatus("Login verified. Click Initialize user to continue");
        };

        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          onLoginComplete,
        );

        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
          setIsError(false);
          setStatus("SDK initialized. Ready for Google login.");
        }
      } catch (err) {
        console.log("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setIsError(true);
          setStatus("Failed to initialize Web SDK");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get / cache deviceId
  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;

      try {
        const cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem("deviceId")
            : null;

        if (cached) {
          setDeviceId(cached);
          return;
        }

        setDeviceIdLoading(true);
        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
      } catch (error) {
        console.log("Failed to get deviceId:", error);
        setIsError(true);
        setStatus("Failed to get deviceId");
      } finally {
        setDeviceIdLoading(false);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Load USDC balance
  async function loadUsdcBalance(userToken: string, walletId: string) {
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTokenBalance",
          userToken,
          walletId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to load USDC balance:", data);
        setIsError(true);
        setStatus("Failed to load USDC balance");
        return null;
      }

      const balances = (data.tokenBalances as TokenBalanceEntry[]) || [];

      const usdcEntry =
        balances.find((t) => {
          const symbol = t.token?.symbol || "";
          const name = t.token?.name || "";
          return symbol.startsWith("USDC") || name.includes("USDC");
        }) ?? null;

      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      // Note: loadWallets may overwrite this with a more specific status
      setIsError(false);
      setStatus("Wallet details and USDC balance loaded.");
      return amount;
    } catch (err) {
      console.log("Failed to load USDC balance:", err);
      setIsError(true);
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  async function loadGatewayBalances(address: string) {
    setGatewayLoading(true);
    setGatewayError("");
    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gatewayBalances",
          depositor: address,
          token: "USDC",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to load gateway balances");
      }

      const rawBalances =
        (data?.balances as GatewayBalanceEntry[]) ||
        (data?.data?.balances as GatewayBalanceEntry[]) ||
        [];

      const normalized = rawBalances.map((entry) => ({
        domain: entry.domain ?? entry.source?.domain,
        depositor: entry.depositor ?? entry.source?.depositor,
        balance: entry.balance ?? entry.amount ?? entry.value,
      }));

      setGatewayBalances(normalized);

      let total = 0n;
      let hasNumeric = false;
      normalized.forEach((entry) => {
        if (!entry.balance) return;
        try {
          total += BigInt(entry.balance);
          hasNumeric = true;
        } catch {
          // ignore
        }
      });

      setGatewayTotal(hasNumeric ? formatUnits(total, 6) : "0");
    } catch (err: any) {
      setGatewayError(err?.message || "Failed to load gateway balances");
      setGatewayBalances([]);
      setGatewayTotal(null);
    } finally {
      setGatewayLoading(false);
    }
  }

  // Load wallets for current user
  const loadWallets = async (
    userToken: string,
    options?: { source?: "afterCreate" | "alreadyInitialized" },
  ) => {
    try {
      setIsError(false);
      setStatus("Loading wallet details...");
      setUsdcBalance(null);

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "listWallets",
          userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("List wallets failed:", data);
        setIsError(true);
        setStatus("Failed to load wallet details");
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);

      if (wallets.length > 0) {
        const preferred =
          wallets.find(
            (w) =>
              w.blockchain?.toUpperCase().includes("BASE") &&
              w.blockchain?.toUpperCase().includes("SEPOLIA"),
          ) ?? wallets[0];
        await loadUsdcBalance(userToken, preferred.id);
        await loadGatewayBalances(preferred.address);

        if (options?.source === "afterCreate") {
          setIsError(false);
          setStatus(
            "Wallet created successfully! 🎉 Wallet details and USDC balance loaded.",
          );
        } else if (options?.source === "alreadyInitialized") {
          setIsError(false);
          setStatus(
            "User already initialized. Wallet details and USDC balance loaded.",
          );
        }
      } else {
        setIsError(false);
        setStatus("Wallet creation in progress. Click Initialize user again to refresh.");
      }
    } catch (err) {
      console.log("Failed to load wallet details:", err);
      setIsError(true);
      setStatus("Failed to load wallet details");
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      setIsError(true);
      setStatus("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    if (!deviceId) {
      setIsError(true);
      setStatus("Missing deviceId. Try again.");
      return;
    }

    // Reset auth + wallet state
    setLoginResult(null);
    setChallengeId(null);
    setWallets([]);
    setUsdcBalance(null);

    try {
      setIsError(false);
      setStatus("Requesting social login token...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requestSocialToken",
          deviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to request social token:", data);
        setIsError(true);
        setStatus(data.error || data.message || "Failed to request social token");
        return;
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);

      const sdk = sdkRef.current;
      if (!sdk) {
        setIsError(true);
        setStatus("SDK not ready");
        return;
      }

      sdk.updateConfigs({
        appSettings: { appId },
        loginConfigs: {
          deviceToken: data.deviceToken,
          deviceEncryptionKey: data.deviceEncryptionKey,
          google: {
            clientId: googleClientId,
            redirectUri: window.location.origin,
            selectAccountPrompt: true,
          },
        },
      });

      setIsError(false);
      setStatus("Opening Google login...");
      setSocialReady(true);
      sdk.performLogin("google");
    } catch (err) {
      console.log("Error requesting social token:", err);
      setIsError(true);
      setStatus("Failed to request social token");
    }
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setIsError(true);
      setStatus("Missing userToken. Please login first.");
      return;
    }

    try {
      setIsError(false);
      setStatus("Initializing user...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: loginResult.userToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 155106) {
          await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          setChallengeId(null);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        setIsError(true);
        setStatus("Failed to initialize user: " + errorMsg);
        return;
      }

      setChallengeId(data.challengeId);
      setIsError(false);
      setStatus(`User initialized. Click Create wallet to continue.`);
    } catch (err: unknown) {
      const error = err as LoginError | undefined;
      if (error?.code === 155106 && loginResult?.userToken) {
        await loadWallets(loginResult.userToken, {
          source: "alreadyInitialized",
        });
        setChallengeId(null);
        return;
      }

      const errorMsg = error?.code
        ? `[${error.code}] ${error.message}`
        : error?.message || "Unknown error";
      setIsError(true);
      setStatus("Failed to initialize user: " + errorMsg);
    }
  };

  const handleExecuteChallenge = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!challengeId) {
      setIsError(true);
      setStatus("Missing challengeId. Initialize user first.");
      return;
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setIsError(true);
      setStatus("Missing login credentials. Please login again.");
      return;
    }

    sdk.setAuthentication({
      userToken: loginResult.userToken,
      encryptionKey: loginResult.encryptionKey,
    });

    setIsError(false);
    setStatus("Executing challenge...");

    sdk.execute(challengeId, (error) => {
      if (error) {
        const message =
          typeof error === "object" && error && "message" in error
            ? String((error as LoginError).message)
            : "Unknown error";
        setIsError(true);
        setStatus("Failed to execute challenge: " + message);
        return;
      }

      setIsError(false);
      setStatus("Challenge executed. Loading wallet details...");

      void (async () => {
        // small delay to give Circle time to index the wallet
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setChallengeId(null);
        await loadWallets(loginResult.userToken, { source: "afterCreate" });
      })().catch((e) => {
        console.log("Post-execute loadWallets failed:", e);
        setIsError(true);
        setStatus("Wallet created, but failed to load wallet details.");
      });
    });
  };

  const primaryWallet =
    wallets.find(
      (w) =>
        w.blockchain?.toUpperCase().includes("BASE") &&
        w.blockchain?.toUpperCase().includes("SEPOLIA"),
    ) ?? wallets[0];

  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Create a user wallet with Google authentication</h1>
        <p>Login via Google to obtain a Circle user token, then initialize and create the wallet.</p>

        <div>
          <button
            onClick={handleGoogleLogin}
            style={{ margin: "6px" }}
            disabled={!sdkReady || !deviceId || deviceIdLoading || !googleClientId}
          >
            1. Login with Google
          </button>
          <div style={{ marginLeft: "6px", fontSize: "12px", color: "#555" }}>
            Note: Google login requires an HTTPS redirect domain.
          </div>
          <br />
          <button
            onClick={handleInitializeUser}
            style={{ margin: "6px" }}
            disabled={!loginResult || !!challengeId || wallets.length > 0}
          >
            2. Initialize user (get challenge)
          </button>
          <br />
          <button
            onClick={handleExecuteChallenge}
            style={{ margin: "6px" }}
            disabled={!challengeId || wallets.length > 0}
          >
            3. Create wallet (execute challenge)
          </button>
        </div>

        <p>
          <strong>Status:</strong>{" "}
          <span style={{ color: isError ? "red" : "black" }}>{status}</span>
        </p>

        {primaryWallet && (
          <div style={{ marginTop: "12px" }}>
            <h2>Wallet details</h2>
            <p>
              <strong>Address:</strong> {primaryWallet.address}
            </p>
            <p>
              <strong>Blockchain:</strong> {primaryWallet.blockchain}
            </p>
            {usdcBalance !== null && (
              <p>
                <strong>USDC balance:</strong> {usdcBalance}
              </p>
            )}
            <div style={{ marginTop: "8px" }}>
              <strong>Gateway unified balance (USDC):</strong>{" "}
              {gatewayLoading ? "Loading..." : gatewayTotal ?? "—"}
              {gatewayError && (
                <span style={{ marginLeft: "8px", color: "red" }}>{gatewayError}</span>
              )}
            </div>
            {gatewayBalances.length > 0 && (
              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                {gatewayBalances.map((b, idx) => (
                  <div key={`${b.domain ?? "unknown"}-${idx}`}>
                    Domain {b.domain ?? "?"}:{" "}
                    {b.balance ? formatUnits(BigInt(b.balance), 6) : "—"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: "1.8",
            marginTop: "16px",
          }}
        >
          {JSON.stringify(
            {
              deviceId,
              deviceToken,
              deviceEncryptionKey,
              socialReady,
              userToken: loginResult?.userToken,
              encryptionKey: loginResult?.encryptionKey,
              challengeId,
              wallets,
              usdcBalance,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}
