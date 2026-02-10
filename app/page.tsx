"use client";

import Link from "next/link";
import Header from "./components/Header";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "white" }}>
      <Header />

      {/* Hero Section */}
      <main style={{ position: "relative", overflow: "hidden" }}>
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45,212,212,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(14,165,233,0.1), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "80px 24px 100px",
            position: "relative",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(45,212,212,0.1)",
              border: "1px solid rgba(45,212,212,0.2)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 12, color: "#67e8f9", fontWeight: 600 }}>
              Live on Base Network
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              marginBottom: 20,
            }}
          >
            Real Estate Auctions
            <br />
            <span style={{ color: "#67e8f9" }}>On-Chain</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.65)",
              maxWidth: 540,
              lineHeight: 1.6,
              marginBottom: 40,
            }}
          >
            Transparent, secure property auctions powered by smart contracts.
            Bid with USDC, track phases in real-time, and own verified assets.
          </p>

          {/* CTA */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/auctions"
              style={{
                padding: "14px 28px",
                borderRadius: 14,
                background: "#2DD4D4",
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/auctions"
              style={{
                padding: "14px 28px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View Auctions
            </Link>
          </div>

          {/* Features */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginTop: 80,
            }}
          >
            <FeatureCard
              icon={<USDCIcon />}
              title="USDC Payments"
              description="Bid and settle with USDC stablecoin. No volatility, no surprises."
            />
            <FeatureCard
              icon={<WalletIcon />}
              title="Base Account"
              description="Sign in with your passkey. No seed phrases, no extensions."
            />
            <FeatureCard
              icon={<PhaseIcon />}
              title="Phase Auctions"
              description="Progressive property reveals across 4 phases. More info unlocks as you bid."
            />
          </div>

          {/* Trust badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 60,
              paddingTop: 40,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Powered by
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: "#0052FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "white",
                }}
              >
                B
              </div>
              Base
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#2775CA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "white",
                }}
              >
                $
              </div>
              USDC
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(45,212,212,0.1)",
          border: "1px solid rgba(45,212,212,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: "#67e8f9",
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

function USDCIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 6v2m0 8v2m-3-9a3 3 0 0 1 3-3h1.5a2.5 2.5 0 0 1 0 5H10a2.5 2.5 0 0 0 0 5h2.5a3 3 0 0 0 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="6"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 10h18M16 15h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
