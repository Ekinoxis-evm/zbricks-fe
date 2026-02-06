"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

type SvgProps = { className?: string };

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type LoginError = {
  code?: number;
  message?: string;
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

const IconMail = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <path
      d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m4 8 8 6 8-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PrivyWordmark = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden="true">
    <text x="0" y="17" fill="currentColor" fontSize="16" fontFamily="ui-sans-serif, system-ui">
      privy
    </text>
  </svg>
);

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function AuthEntryPage() {
  const sdkRef = useRef<W3SSdk | null>(null);
  const router = useRouter();

  const ui = useMemo(
    () => ({
      bg: "bg-[#07090A]",
      card: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_70px_rgba(0,0,0,0.65)]",
      input: "bg-[#0B0F14] border border-white/[0.10] focus:border-[#2DD4D4]/55",
      teal: "text-[#2DD4D4]",
      muted: "text-white/55",
    }),
    []
  );

  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceIdLoading, setDeviceIdLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [recentEmail, setRecentEmail] = useState("your@email.com"); // mock
  const [mode, setMode] = useState<"entry" | "email" | "passkey">("entry");
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isError, setIsError] = useState(false);
  const [flowBusy, setFlowBusy] = useState(false);

  const [deviceToken, setDeviceToken] = useState("");
  const [deviceEncryptionKey, setDeviceEncryptionKey] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const flowRef = useRef(0);
  const redirectOnceRef = useRef(false);

  const persistSession = useCallback((token: string, encryptionKey: string) => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("w3s_user_token", token);
    window.sessionStorage.setItem("w3s_encryption_key", encryptionKey);
  }, []);

  const persistWallet = (wallet: Wallet) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("w3s_wallet_id", wallet.id);
    window.localStorage.setItem("w3s_wallet_address", wallet.address);
    window.localStorage.setItem("w3s_wallet_blockchain", wallet.blockchain);
  };

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1200);
  }, []);

  const pickRecent = () => {
    setEmail(recentEmail);
    showToast("Email reciente seleccionado ✅");
  };

  const continueWithEmail = async () => {
    if (!isEmail(email)) {
      showToast("Pon un email válido 👀");
      return;
    }

    const ok = await handleRequestOtp();
    if (ok) {
      setMode("email");
    }
  };

  const handleLoginComplete = useCallback(
    (error?: LoginError | null, result?: LoginResult | null) => {
      if (error || !result) {
        const message: string = error?.message || "Email authentication failed.";
        setIsError(true);
        setStatus(message);
        setLoginResult(null);
        showToast(message);
        return;
      }

      setLoginResult(result);
      persistSession(result.userToken, result.encryptionKey);
      setIsError(false);
      setStatus("Email verified. Initializing user...");
      showToast("Email verificado ✅");
    },
    [persistSession, showToast],
  );

  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const sdk = new W3SSdk(
          {
            appSettings: { appId },
          },
          (error, result) => {
            if (cancelled) return;
            handleLoginComplete(error, result);
          },
        );

        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
          setIsError(false);
          setStatus("SDK initialized. Ready to request OTP.");
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
  }, [handleLoginComplete]);

  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;

      try {
        const cached =
          typeof window !== "undefined" ? window.localStorage.getItem("deviceId") : null;

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

  const handleRequestOtp = async () => {
    if (!isEmail(email)) {
      showToast("Pon un email válido 👀");
      return false;
    }

    if (!deviceId) {
      showToast("Falta deviceId. Espera un momento.");
      return false;
    }

    setLoginResult(null);
    setWallets([]);

    try {
      setIsError(false);
      setStatus("Requesting OTP...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "requestEmailOtp",
          deviceId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || data.message || "Failed to request OTP";
        setIsError(true);
        setStatus(msg);
        showToast(msg);
        return false;
      }

      setDeviceToken(data.deviceToken);
      setDeviceEncryptionKey(data.deviceEncryptionKey);
      setOtpToken(data.otpToken);
      setRecentEmail(email);

      const sdk = sdkRef.current;
      if (sdk) {
        sdk.updateConfigs(
          {
            appSettings: { appId },
            loginConfigs: {
              deviceToken: data.deviceToken,
              deviceEncryptionKey: data.deviceEncryptionKey,
              otpToken: data.otpToken,
            },
          },
          handleLoginComplete,
        );
      }

      setIsError(false);
      setStatus("OTP sent. Open the verification panel to continue.");
      showToast("OTP enviado ✉️");
      return true;
    } catch {
      setIsError(true);
      setStatus("Failed to request OTP");
      showToast("Error al enviar OTP");
      return false;
    }
  };

  const handleVerifyOtp = () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      showToast("SDK not ready");
      return;
    }

    if (!deviceToken || !deviceEncryptionKey || !otpToken) {
      showToast("Falta la sesión OTP. Reenvía el código.");
      return;
    }

    sdk.updateConfigs(
      {
        appSettings: { appId },
        loginConfigs: {
          deviceToken,
          deviceEncryptionKey,
          otpToken,
        },
      },
      handleLoginComplete,
    );

    setIsError(false);
    setStatus("Opening OTP verification panel...");
    sdk.verifyOtp();
  };

  const loadWallets = useCallback(
    async (userToken: string, options?: { source?: "afterCreate" | "alreadyInitialized" }) => {
    try {
      setIsError(false);
      setStatus("Loading wallet details...");

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
        setIsError(true);
        setStatus("Failed to load wallet details");
        return [];
      }

      const nextWallets = (data.wallets as Wallet[]) || [];
      setWallets(nextWallets);

      if (nextWallets.length > 0) {
        persistWallet(nextWallets[0]);
        if (!redirectOnceRef.current) {
          redirectOnceRef.current = true;
          router.push("/marketplace");
        }
        if (options?.source === "afterCreate") {
          setStatus("Wallet created successfully. Ready to use.");
        } else if (options?.source === "alreadyInitialized") {
          setStatus("Wallet found. Ready to use.");
        } else {
          setStatus("Wallet loaded.");
        }
      } else {
        setStatus("No wallet found yet.");
      }

      return nextWallets;
    } catch {
      setIsError(true);
      setStatus("Failed to load wallet details");
      return [];
    }
    },
    [router],
  );

  const initializeUser = async (userToken: string) => {
    const response = await fetch("/api/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "initializeUser",
        userToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data?.code === 155106) {
        return { alreadyInitialized: true };
      }

      const errorMsg = data?.code
        ? `[${data.code}] ${data.error || data.message}`
        : data?.error || data?.message || "Failed to initialize user";
      throw new Error(errorMsg);
    }

    return { challengeId: data.challengeId as string };
  };

  const executeChallenge = async (challengeId: string, creds: LoginResult) => {
    const sdk = sdkRef.current;
    if (!sdk) {
      throw new Error("SDK not ready");
    }

    sdk.setAuthentication({
      userToken: creds.userToken,
      encryptionKey: creds.encryptionKey,
    });

    setStatus("Creating wallet...");

    await new Promise<void>((resolve, reject) => {
      sdk.execute(challengeId, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  };

  useEffect(() => {
    if (!loginResult) return;

    const currentFlow = ++flowRef.current;
    let cancelled = false;

    const runFlow = async () => {
      setFlowBusy(true);
      setIsError(false);
      setStatus("Initializing user...");

      try {
        const init = await initializeUser(loginResult.userToken);
        if (cancelled || currentFlow !== flowRef.current) return;

        if (init.alreadyInitialized) {
          const found = await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          if (found.length > 0) {
            showToast("Wallet lista ✅");
          }
          return;
        }

        if (init.challengeId) {
          await executeChallenge(init.challengeId, loginResult);
          if (cancelled || currentFlow !== flowRef.current) return;

          await new Promise((resolve) => setTimeout(resolve, 2000));
          await loadWallets(loginResult.userToken, { source: "afterCreate" });
          showToast("Wallet creada ✅");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to initialize wallet flow";
        setIsError(true);
        setStatus(msg);
        showToast(msg);
      } finally {
        if (!cancelled && currentFlow === flowRef.current) {
          setFlowBusy(false);
        }
      }
    };

    void runFlow();

    return () => {
      cancelled = true;
    };
  }, [loadWallets, loginResult, showToast]);

  const canRequestOtp =
    sdkReady && !!deviceId && !deviceIdLoading && isEmail(email) && !flowBusy;
  const canVerifyOtp =
    sdkReady &&
    !!deviceToken &&
    !!deviceEncryptionKey &&
    !!otpToken &&
    !loginResult &&
    !flowBusy;

  const primaryWallet = wallets[0];

  return (
    <div className={cn("min-h-screen text-white", ui.bg)}>
      {/* fondo suave */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(45,212,212,0.10),transparent_45%),radial-gradient(circle_at_80%_40%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(circle_at_20%_70%,rgba(45,212,212,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        {/* container */}
        <div className="w-full max-w-[520px]">
          {/* logo arriba (placeholder) */}
          <div className="mb-6 flex items-center justify-center">
            <div className="h-10 w-10 rounded-2xl border border-white/[0.10] bg-white/[0.03]" />
          </div>

          {/* Card principal */}
          <div className={cn("rounded-[28px] px-6 py-8 sm:px-8", ui.card)}>
            {mode === "entry" && (
              <>
                <h1 className="text-center text-3xl font-semibold tracking-tight">
                  Log in or sign up
                </h1>

                {/* input grande */}
                <div className="mt-7">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-[22px] px-4 py-4",
                      ui.input
                    )}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-white/65">
                      <IconMail className="h-6 w-6" />
                    </div>

                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-12 flex-1 bg-transparent text-lg text-white/85 outline-none placeholder:text-white/35"
                      inputMode="email"
                      autoComplete="email"
                    />

                    <button
                      type="button"
                      onClick={pickRecent}
                      className="rounded-full bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
                      title="Usar email reciente"
                    >
                      Recent
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={continueWithEmail}
                    disabled={!canRequestOtp}
                    className={cn(
                      "mt-4 w-full rounded-[18px] px-5 py-4 font-semibold text-black transition",
                      canRequestOtp
                        ? "bg-[#2DD4D4] hover:brightness-110"
                        : "bg-white/20 text-white/50 cursor-not-allowed"
                    )}
                  >
                    Continue
                  </button>
                </div>

                {/* link passkey */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("passkey")}
                    className={cn("text-base font-medium hover:opacity-90 transition", ui.teal)}
                  >
                    I have a passkey
                  </button>
                </div>

                {/* footer privy */}
                <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/45">
                  <span>Protected by</span>
                  <span className="inline-flex items-center gap-2 text-white/55">
                    <span className="h-4 w-4 rounded-full bg-white/20" />
                    <PrivyWordmark className="h-5 w-12" />
                  </span>
                </div>
              </>
            )}

            {mode === "email" && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setMode("entry")}
                    className="rounded-full bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
                  >
                    ← Back
                  </button>
                  <span className="text-xs text-white/50">Email login</span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold">Check your email</h2>
                <p className="mt-2 text-sm text-white/55">
                  Enviaremos un código a <span className="text-white/80 font-semibold">{email}</span>.
                </p>

                <div className="mt-6 rounded-[22px] border border-white/[0.10] bg-black/30 p-4">
                  <div className="text-xs text-white/55">
                    Verificación con el mismo panel del paso 2 en /wallets
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!canVerifyOtp}
                    className={cn(
                      "mt-3 w-full rounded-[18px] px-5 py-4 font-semibold transition",
                      canVerifyOtp
                        ? "bg-[#2DD4D4] text-black hover:brightness-110"
                        : "bg-white/20 text-white/50 cursor-not-allowed"
                    )}
                  >
                    Open verification panel
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={!canRequestOtp}
                    className={cn(
                      "mt-3 w-full rounded-[18px] border border-white/[0.10] px-5 py-3 text-sm font-semibold transition",
                      canRequestOtp
                        ? "bg-white/[0.04] text-white/80 hover:bg-white/[0.06]"
                        : "bg-white/[0.02] text-white/40 cursor-not-allowed"
                    )}
                  >
                    Resend code
                  </button>
                </div>

                {loginResult && (
                  <div className="mt-4 rounded-[18px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                    Email verificado. Sesión lista.
                  </div>
                )}

                {flowBusy && (
                  <div className="mt-4 rounded-[18px] border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-xs text-white/70">
                    Inicializando usuario y wallet...
                  </div>
                )}

                {!flowBusy && loginResult && !primaryWallet && (
                  <div className="mt-4 rounded-[18px] border border-white/[0.12] bg-white/[0.02] px-4 py-3 text-xs text-white/60">
                    Aún no vemos una wallet. Si eres nuevo, la estamos creando.
                  </div>
                )}

                {primaryWallet && (
                  <div className="mt-4 rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-xs text-emerald-100">
                    <div className="text-sm font-semibold text-emerald-50">Wallet lista</div>
                    <div className="mt-2">
                      <span className="text-emerald-200/80">Address:</span>{" "}
                      <span className="break-all">{primaryWallet.address}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-emerald-200/80">Blockchain:</span>{" "}
                      {primaryWallet.blockchain}
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === "passkey" && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setMode("entry")}
                    className="rounded-full bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06] transition"
                  >
                    ← Back
                  </button>
                  <span className="text-xs text-white/50">Passkey</span>
                </div>

                <h2 className="mt-5 text-2xl font-semibold">Use your passkey</h2>
                <p className="mt-2 text-sm text-white/55">
                  Face ID / Touch ID / Windows Hello. Sin contraseña.
                </p>

                <button
                  type="button"
                  onClick={() => showToast("Aquí llamas WebAuthn / Privy Passkey")}
                  className="mt-6 w-full rounded-[18px] border border-white/[0.10] bg-white/[0.04] px-5 py-4 font-semibold text-white/80 hover:bg-white/[0.06] transition"
                >
                  Continue with passkey
                </button>

                <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/45">
                  <span>Protected by</span>
                  <span className="inline-flex items-center gap-2 text-white/55">
                    <span className="h-4 w-4 rounded-full bg-white/20" />
                    <PrivyWordmark className="h-5 w-12" />
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-6 right-6 hidden max-w-xs rounded-2xl border border-white/[0.10] bg-black/60 px-4 py-3 text-xs text-white/80 backdrop-blur sm:block">
        <div className={cn("font-medium", isError ? "text-rose-300" : "text-white/80")}>
          Status
        </div>
        <div className={cn("mt-1", isError ? "text-rose-200" : "text-white/60")}>
          {status}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <div className="rounded-full border border-white/[0.10] bg-black/70 px-4 py-2 text-xs text-white/80 backdrop-blur">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
