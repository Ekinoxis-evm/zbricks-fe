"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Bid = { id: string; bidder: string; amount: number; ts: number };
type SvgProps = { className?: string };
type TokenBalanceEntry = {
  amount?: string;
  token?: {
    symbol?: string;
    name?: string;
  };
};

const IconShield = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M12 3 5 6v6c0 4.6 3 7.9 7 9 4-1.1 7-4.4 7-9V6l-7-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m9.5 12.2 1.8 1.8 3.4-3.8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 7v5l3 2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTrending = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 16l6-6 4 4 6-7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7h4v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconGavel = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path d="M9.5 6.5 17 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="m12 4 4 4-2 2-4-4 2-2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m6 10 4 4-2 2-4-4 2-2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M4 20h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconWallet = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M4 7h13a3 3 0 0 1 3 3v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M16 12h4v4h-4a2 2 0 0 1 0-4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M4 7V6a2 2 0 0 1 2-2h9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const IconArrowUpRight = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path d="M7 17 17 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M10 7h7v7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconLock = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M7 11V8.5A5 5 0 0 1 12 3.5 5 5 0 0 1 17 8.5V11"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const IconUnlock = ({ className = "" }: SvgProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <path
      d="M9 11V8.8A4.5 4.5 0 0 1 13.5 4.3c1.2 0 2.3.45 3.1 1.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const formatMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

const shortAddr = (s: string) => (s.length <= 12 ? s : `${s.slice(0, 6)}…${s.slice(-4)}`);

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function humanizeMinutes(mins: number) {
  const m = Math.max(0, Math.floor(mins));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh <= 0) return `${mm}m`;
  return `${hh}h ${mm}m`;
}

export default function AuctionPropertyView() {
  const router = useRouter();
  // ----- Look & feel (marketplace-like)
  const ui = useMemo(
    () => ({
      bg: "bg-[#07090A]",
      card: "bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)]",
      cardInner: "bg-black/30 border border-white/[0.08]",
      pill: "bg-[#0B1516] border border-[#2DD4D4]/35 text-[#7DEAEA]",
      pillMuted: "bg-white/[0.03] border border-white/[0.08] text-white/70",
      teal: "#2DD4D4",
    }),
    []
  );

  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<string | null>(null);

  const property = useMemo(
    () => ({
      title: "Miami Modern House",
      location: "Miami, FL · 4BR · 3BA · Pool",
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2400&q=80",
      basePrice: 550000,
      currency: "USD" as const,
    }),
    []
  );

  // Timeline: 3 horas
  const HOUR_MS = 60 * 60 * 1000;
  const TOTAL_HOURS = 3;
  const TOTAL_MS = TOTAL_HOURS * HOUR_MS;

  const [revealStartsAt] = useState(() => Date.now() - 35 * 60 * 1000);
  const [now, setNow] = useState(() => Date.now());

  const [demoMode, setDemoMode] = useState(false);
  const [demoMinutes, setDemoMinutes] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const address = window.localStorage.getItem("w3s_wallet_address") ?? "";
    setWalletAddress(address);
    setWalletBalance(window.localStorage.getItem("w3s_wallet_usdc"));

    const userToken =
      window.sessionStorage.getItem("w3s_user_token") ||
      window.localStorage.getItem("w3s_user_token");
    const walletId = window.localStorage.getItem("w3s_wallet_id");

    if (!userToken || !walletId) {
      setWalletStatus("Conecta tu wallet para pujar.");
      return;
    }

    void (async () => {
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
        if (!response.ok) return;

        const balances = (data.tokenBalances as TokenBalanceEntry[]) || [];
        const usdcEntry =
          balances.find((t) => {
            const symbol = t.token?.symbol || "";
            const name = t.token?.name || "";
            return symbol.toUpperCase().includes("USDC") || name.toUpperCase().includes("USDC");
          }) ?? null;

        const amount = usdcEntry?.amount ?? "0";
        setWalletBalance(amount);
        window.localStorage.setItem("w3s_wallet_usdc", amount);
        setWalletStatus(null);
      } catch {
        setWalletStatus("No se pudo cargar el balance.");
      }
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const elapsedMs = useMemo(() => {
    if (demoMode) return clamp(demoMinutes, 0, TOTAL_HOURS * 60) * 60 * 1000;
    return clamp(now - revealStartsAt, 0, TOTAL_MS);
  }, [demoMode, demoMinutes, now, revealStartsAt, TOTAL_MS]);

  const progress = useMemo(() => elapsedMs / TOTAL_MS, [elapsedMs, TOTAL_MS]);

  const currentHourIndex = useMemo(() => {
    const idx = Math.floor(elapsedMs / HOUR_MS);
    return clamp(idx, 0, TOTAL_HOURS - 1);
  }, [elapsedMs, HOUR_MS]);

  const nextRevealInMs = useMemo(() => {
    const nextHourBoundary = (currentHourIndex + 1) * HOUR_MS;
    return clamp(nextHourBoundary - elapsedMs, 0, HOUR_MS);
  }, [currentHourIndex, elapsedMs, HOUR_MS]);

  const nextRevealLabel = useMemo(() => {
    const mins = Math.ceil(nextRevealInMs / (60 * 1000));
    return humanizeMinutes(mins);
  }, [nextRevealInMs]);

  const revealSteps = useMemo(
    () => [
      {
        hour: 0,
        label: "Planos",
        kicker: "Estructura + distribución",
        items: [
          { id: "p1", title: "Plano · Planta 1", type: "image", url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=70" },
          { id: "p2", title: "Plano · Planta 2", type: "image", url: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=70" },
          { id: "p3", title: "Plano · Tech / MEP", type: "image", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1200&q=70" },
        ],
      },
      {
        hour: 1,
        label: "Zonas comunes",
        kicker: "Amenidades + accesos",
        items: [
          { id: "z1", title: "Piscina / Patio", type: "image", url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70" },
          { id: "z2", title: "Gimnasio / Lounge", type: "image", url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=70" },
          { id: "z3", title: "Parqueadero", type: "image", url: "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1200&q=70" },
        ],
      },
      {
        hour: 2,
        label: "Verificación",
        kicker: "Docs + inspección",
        items: [
          { id: "d1", title: "Inspección (PDF)", type: "doc", url: "#" },
          { id: "d2", title: "Título / Escritura (PDF)", type: "doc", url: "#" },
          { id: "v1", title: "Recorrido (Video)", type: "video", url: "#" },
        ],
      },
    ],
    []
  );

  // Bids
  const [bids, setBids] = useState<Bid[]>(() => [
    { id: "b1", bidder: "0xA1b2…9cD3", amount: 600000, ts: Date.now() - 1000 * 60 * 3 },
    { id: "b2", bidder: "@ethcali", amount: 570000, ts: Date.now() - 1000 * 60 * 12 },
    { id: "b3", bidder: "0xF00d…BEEF", amount: 550000, ts: Date.now() - 1000 * 60 * 25 },
  ]);

  const currentBid = useMemo(
    () => bids.reduce((m, b) => (b.amount > m ? b.amount : m), property.basePrice),
    [bids, property.basePrice]
  );

  const totalPaid = useMemo(() => bids.reduce((acc, b) => acc + b.amount, 0), [bids]);

  const highestBidder = useMemo(() => {
    const top = bids.reduce((best, b) => (b.amount > best.amount ? b : best), bids[0]);
    return top?.bidder ?? "—";
  }, [bids]);

  const minIncrement = useMemo(() => {
    if (currentBid < 50000) return 50;
    if (currentBid < 250000) return 250;
    if (currentBid < 1000000) return 1000;
    return 5000;
  }, [currentBid]);

  const [bidInput, setBidInput] = useState<number>(() => currentBid + minIncrement);
  const [bidError, setBidError] = useState<string | null>(null);

  const placeBid = () => {
    if (!walletAddress) {
      setBidError("Conecta tu wallet para pujar.");
      router.push("/auth");
      return;
    }

    const amount = Math.floor(Number(bidInput) || 0);
    const min = currentBid + minIncrement;
    if (amount < min) {
      setBidInput(min);
      setBidError(`Tu puja mínima es ${formatMoney(min, property.currency)}.`);
      return;
    }
    setBidError(null);
    const bidder = walletAddress;
    setBids((prev) => [
      { id: `b_${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`, bidder, amount, ts: Date.now() },
      ...prev,
    ]);
    setBidInput(amount + minIncrement);
  };

  const diffAbs = currentBid - property.basePrice;

  return (
    <div className={`min-h-screen ${ui.bg} text-white`}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header (marketplace-like) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/75">
              <IconShield className="h-4 w-4 text-[#7DEAEA]" />
              Subasta verificada · Onchain
            </div>
            <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight sm:text-4xl">
              {property.title}
            </h1>
            <p className="mt-1 text-sm text-white/55">{property.location}</p>
          </div>

          {/* 3-hour reveal bar */}
          <div className="flex w-full flex-col gap-4 sm:w-[460px]">
            <div className={`rounded-3xl ${ui.card} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <IconClock className="h-4 w-4 text-[#7DEAEA]" />
                  Revelación en <span className="text-white/85 font-semibold">{TOTAL_HOURS} horas</span>
                </div>

                <label className="flex items-center gap-2 text-xs text-white/60 select-none">
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setDemoMode(v);
                      if (v) setDemoMinutes(Math.floor(elapsedMs / (60 * 1000)));
                    }}
                    className="h-4 w-4 accent-[#2DD4D4]"
                  />
                  Demo
                </label>
              </div>

              <div className="mt-3">
                <div className="relative h-3 overflow-hidden rounded-full border border-white/[0.08] bg-black/35">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#2DD4D4] shadow-[0_0_30px_rgba(45,212,212,0.18)]"
                    style={{ width: `${clamp(progress * 100, 0, 100)}%` }}
                  />
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 border-r border-white/[0.08]" />
                    <div className="flex-1 border-r border-white/[0.08]" />
                    <div className="flex-1" />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
                  <span className={currentHourIndex >= 0 ? "text-[#7DEAEA]" : ""}>Hora 0 · Planos</span>
                  <span className={currentHourIndex >= 1 ? "text-[#7DEAEA]" : ""}>Hora 1 · Zonas</span>
                  <span className={currentHourIndex >= 2 ? "text-[#7DEAEA]" : ""}>Hora 2 · Docs</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-white/60">
                    Próximo reveal: <span className="text-white/80 font-semibold">{nextRevealLabel}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDemoMode(true);
                        setDemoMinutes((m) => clamp(m + 15, 0, TOTAL_HOURS * 60));
                      }}
                      className={`rounded-2xl ${ui.pillMuted} px-3 py-1.5 text-xs hover:bg-white/[0.06]`}
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoMode(true);
                        setDemoMinutes((m) => clamp(m + 60, 0, TOTAL_HOURS * 60));
                      }}
                      className={`rounded-2xl ${ui.pillMuted} px-3 py-1.5 text-xs hover:bg-white/[0.06]`}
                    >
                      +1h
                    </button>
                  </div>
                </div>

                {demoMode && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-white/55">
                      <span>Scrub</span>
                      <span className="font-mono text-white/75">
                        {clamp(demoMinutes, 0, TOTAL_HOURS * 60)} / {TOTAL_HOURS * 60} min
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={TOTAL_HOURS * 60}
                      value={demoMinutes}
                      onChange={(e) => setDemoMinutes(Number(e.target.value))}
                      className="mt-2 w-full accent-[#2DD4D4]"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-3xl ${ui.card} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <IconWallet className="h-4 w-4 text-[#7DEAEA]" />
                  Mi cuenta
                </div>
                <button
                  type="button"
                  onClick={() => router.push(walletAddress ? "/cuenta" : "/auth")}
                  className={`rounded-2xl px-3 py-1.5 text-xs ${ui.pillMuted} hover:bg-white/[0.06]`}
                >
                  {walletAddress ? "Ver wallet" : "Conectar"}
                </button>
              </div>

              {walletAddress ? (
                <div className="mt-3 grid gap-3 text-xs text-white/70">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/35 px-3 py-2">
                    <div className="text-[11px] text-white/55">Wallet</div>
                    <div className="mt-1 text-sm text-white/85">
                      {shortAddr(walletAddress)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/35 px-3 py-2">
                    <div className="text-[11px] text-white/55">Balance USDC</div>
                    <div className="mt-1 text-sm text-white/85">
                      {walletBalance ?? "—"}
                    </div>
                  </div>
                  {walletStatus && <div className="text-[11px] text-red-300">{walletStatus}</div>}
                </div>
              ) : (
                <div className="mt-3 text-xs text-white/55">
                  Conecta tu wallet para pujar con tu cuenta.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="mt-7 grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2">
            <div className={`overflow-hidden rounded-3xl ${ui.card}`}>
              {/* Image hero */}
              <div className="relative">
                <img src={property.image} alt={property.title} className="h-[320px] w-full object-cover sm:h-[420px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

                {/* Marketplace-like price pill */}
                <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${ui.pill}`}>
                    <IconTrending className="h-4 w-4" />
                    {formatMoney(currentBid, property.currency)}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-xs text-white/60">Precio base</div>
                      <div className="mt-1 text-4xl sm:text-5xl font-semibold text-white">
                        {formatMoney(property.basePrice, property.currency)}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1.5 text-xs ${ui.pillMuted}`}>
                          Mejor postor:{" "}
                          <span className="text-white/85 font-semibold">
                            {highestBidder.startsWith("0x") ? shortAddr(highestBidder) : highestBidder}
                          </span>
                        </span>

                        <span className={`rounded-full px-3 py-1.5 text-xs ${ui.pillMuted}`}>
                          Sobre base:{" "}
                          <span className="text-white/85 font-semibold">
                            +{formatMoney(diffAbs, property.currency)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className={`rounded-3xl ${ui.cardInner} p-4`}>
                      <div className="text-xs text-white/60">Revelado actual</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs ${ui.pill}`}>
                          Hora {currentHourIndex}
                        </span>
                        <span className="text-sm font-semibold text-white/85">
                          {revealSteps[currentHourIndex]?.label}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/55">
                        {revealSteps[currentHourIndex]?.kicker}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid + Reveal */}
              <div className="p-5 sm:p-7">
                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-white/85">Pujar</div>
                      <div className="text-xs text-white/55">
                        Incremento mínimo:{" "}
                        <span className="text-white/80">{formatMoney(minIncrement, property.currency)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                          {property.currency}
                        </div>
                        <input
                          type="number"
                          min={currentBid + minIncrement}
                          value={bidInput}
                          onChange={(e) => setBidInput(clamp(Number(e.target.value), 0, 10_000_000_000))}
                          className="w-full rounded-2xl border border-white/[0.08] bg-black/35 px-12 py-3 text-base outline-none focus:border-[#2DD4D4]/60"
                        />
                      </div>

                      <button
                        onClick={placeBid}
                        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2DD4D4] px-5 py-3 font-semibold text-black transition hover:brightness-110"
                      >
                        <IconGavel className="h-5 w-5" />
                        Pujar ahora
                        <IconArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </button>
                    </div>
                    {bidError && (
                      <div className="mt-2 text-xs text-red-300">{bidError}</div>
                    )}

                    {/* Reveal cards */}
                    <div className={`mt-5 rounded-3xl ${ui.cardInner} p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white/85">Contenido por etapas</div>
                        <div className="text-xs text-white/55">3 etapas · 3 horas</div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {revealSteps.map((step, sIdx) => {
                          const unlocked = sIdx <= currentHourIndex;
                          return (
                            <div
                              key={step.hour}
                              className={[
                                "rounded-3xl border p-4",
                                unlocked
                                  ? "border-[#2DD4D4]/25 bg-[#0B1516]"
                                  : "border-white/[0.08] bg-black/35",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-xs text-white/55">Hora {step.hour}</div>
                                  <div className="mt-1 text-sm font-semibold text-white/85">{step.label}</div>
                                  <div className="mt-1 text-[11px] text-white/55">{step.kicker}</div>
                                </div>
                                <div>
                                  {unlocked ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${ui.pill}`}>
                                      <IconUnlock className="h-3.5 w-3.5" />
                                      Activa
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55">
                                      <IconLock className="h-3.5 w-3.5" />
                                      Bloqueada
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-2">
                                {step.items.map((it) => {
                                  const isImg = it.type === "image";
                                  return (
                                    <div
                                      key={it.id}
                                      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/35"
                                      title={it.title}
                                    >
                                      {isImg ? (
                                        <img
                                          src={it.url}
                                          alt={it.title}
                                          className={[
                                            "h-16 w-full object-cover",
                                            unlocked ? "" : "blur-[2px] opacity-60",
                                          ].join(" ")}
                                        />
                                      ) : (
                                        <div className="flex h-16 items-center justify-center text-[11px] text-white/60">
                                          {it.type === "doc" ? "PDF" : "VIDEO"}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                                      <div className="absolute bottom-1 left-2 right-2 truncate text-[10px] text-white/80">
                                        {it.title}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-[11px] text-white/55">
                                  {unlocked ? "Disponible para revisar." : "Se habilita con el tiempo."}
                                </div>
                                <button
                                  type="button"
                                  disabled={!unlocked}
                                  className={[
                                    "rounded-2xl px-3 py-1.5 text-xs transition",
                                    unlocked
                                      ? "border border-white/[0.08] bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
                                      : "border border-white/[0.06] bg-white/[0.02] text-white/35 cursor-not-allowed",
                                  ].join(" ")}
                                >
                                  Ver
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-[11px] text-white/45">
                        Tip: activa <span className="text-white/70 font-semibold">Demo</span> para adelantar el reveal en una presentación.
                      </div>
                    </div>
                  </div>

                  {/* Right small stats */}
                  <div className={`rounded-3xl ${ui.cardInner} p-4`}>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <IconWallet className="h-4 w-4 text-[#7DEAEA]" />
                      Total pagado (histórico)
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {formatMoney(totalPaid, property.currency)}
                    </div>

                    <div className="mt-4 rounded-3xl border border-white/[0.08] bg-black/35 p-3">
                      <div className="text-[11px] text-white/55">Resumen</div>
                      <div className="mt-1 text-sm font-semibold text-white/85">
                        {bids.length} pujas · líder{" "}
                        {highestBidder.startsWith("0x") ? shortAddr(highestBidder) : highestBidder}
                      </div>
                      <div className="mt-1 text-[11px] text-white/55">
                        Estado: <span className="text-[#7DEAEA] font-semibold">Activa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: bidding history */}
          <div className={`h-full overflow-hidden rounded-3xl ${ui.card}`}>
            <div className="border-b border-white/[0.08] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold tracking-wide text-white/85">Historial de pujas</div>
                <div className="text-xs text-white/55">{bids.length} entradas</div>
              </div>
            </div>

            <div className="max-h-[680px] overflow-auto p-3">
              <ul className="space-y-2">
                {bids.map((b, idx) => (
                  <li key={b.id} className="rounded-3xl border border-white/[0.08] bg-black/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white/85">
                          {b.bidder.startsWith("0x") ? shortAddr(b.bidder) : b.bidder}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          {new Date(b.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {idx === 0 ? " · más reciente" : ""}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs ${ui.pill}`}>
                          {formatMoney(b.amount, property.currency)}
                        </span>

                        {b.amount === currentBid && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#2DD4D4]/30 bg-[#0B1516] px-2 py-0.5 text-[11px] text-[#7DEAEA]">
                            <IconTrending className="h-3 w-3" />
                            líder
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-white/[0.08] p-5">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Estado</span>
                <span className="text-[#7DEAEA] font-semibold">Activa</span>
              </div>

              <div className="mt-3 rounded-3xl border border-white/[0.08] bg-black/35 p-3">
                <div className="text-[11px] text-white/55">Revelado</div>
                <div className="mt-1 text-sm font-semibold text-white/85">
                  Hora {currentHourIndex}: {revealSteps[currentHourIndex]?.label}
                </div>
                <div className="mt-1 text-[11px] text-white/55">
                  Próximo:{" "}
                  {currentHourIndex < 2 ? (
                    <span className="text-white/75">{revealSteps[currentHourIndex + 1]?.label}</span>
                  ) : (
                    <span className="text-white/75">Completado</span>
                  )}{" "}
                  · {nextRevealLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-white/35">
          UI consistente = confianza. Y confianza = pujas más grandes. Así de simple.
        </div>
      </div>
    </div>
  );
}
