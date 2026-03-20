"use client";

import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";

// Replace with your actual Kick channel slug
const KICK_CHANNEL = "zbricks";

const BENEFITS = [
  {
    icon: "🏘️",
    title: "Get In Before the Market",
    description:
      "Access real estate opportunities at auction prices — before they reach traditional listings or public markets.",
  },
  {
    icon: "🔍",
    title: "Full Transparency",
    description:
      "Every bid is visible to all participants. No hidden negotiations, no backroom deals. What you see is what's real.",
  },
  {
    icon: "⚡",
    title: "Real-Time Bidding",
    description:
      "Live auctions with instant updates. Know exactly where you stand and react to every move as it happens.",
  },
  {
    icon: "🏛️",
    title: "Open Participation",
    description:
      "No brokers, no gatekeepers. Qualified investors bid directly on verified properties — fair and equal access.",
  },
];

export default function HomePage() {
  const { ready, login } = usePrivy();

  function handleAccess() {
    if (!ready) return;
    login();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "white" }}>
      <main style={{ position: "relative", overflow: "hidden" }}>

        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45,212,212,0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(14,165,233,0.08), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* ── Hero ─────────────────────────────────────── */}
        <div
          className="hero-grid"
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "80px 24px 60px",
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          {/* Left — Text */}
          <div>
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
                marginBottom: 28,
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
                Live Auctions — Open Now
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: -1,
                marginBottom: 20,
              }}
            >
              Invest in Real Estate
              <br />
              <span style={{ color: "#67e8f9" }}>Before the Crowd Does</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.6)",
                maxWidth: 480,
                lineHeight: 1.65,
                marginBottom: 40,
              }}
            >
              Open, transparent, and real-time property auctions. Participate
              directly — no agents, no hidden deals, no waiting.
            </p>

            {/* ACCESS button */}
            <button
              onClick={handleAccess}
              disabled={!ready}
              style={{
                padding: "16px 40px",
                borderRadius: 14,
                background: ready ? "#2DD4D4" : "rgba(45,212,212,0.35)",
                color: "#0f172a",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 1.5,
                border: "none",
                cursor: ready ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                transition: "opacity 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => { if (ready) (e.currentTarget.style.opacity = "0.88"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.opacity = "1"); }}
            >
              ACCESS
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Right — Kick stream */}
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(45,212,212,0.18)",
              boxShadow: "0 0 80px rgba(45,212,212,0.06)",
              aspectRatio: "16/9",
              background: "#0a0a0a",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.72)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: 0.5 }}>
                LIVE
              </span>
            </div>
            <iframe
              src={`https://player.kick.com/${KICK_CHANNEL}`}
              width="100%"
              height="100%"
              style={{ border: "none", display: "block", minHeight: 260 }}
              allowFullScreen
              scrolling="no"
            />
          </div>
        </div>

        {/* ── Benefits ─────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 24px 80px",
            position: "relative",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            <p style={{ fontSize: 12, color: "#67e8f9", fontWeight: 600, letterSpacing: 2, marginBottom: 12 }}>
              WHY ZBRICKS
            </p>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: -0.5 }}>
              A smarter way to buy real estate
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                style={{
                  padding: "28px 24px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                  {b.title}
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  {b.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Partners / Powered by ─────────────────────── */}
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "32px 24px 80px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
            Powered by
          </span>

          {/* Base */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src="/chains/base_logo.svg"
              alt="Base"
              width={22}
              height={22}
              style={{ borderRadius: 6 }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
              Base
            </span>
          </div>

          {/* USDC */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src="/tokens/usdc.png"
              alt="USDC"
              width={22}
              height={22}
              style={{ borderRadius: "50%" }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
              USDC
            </span>
          </div>

          {/* ECOP */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image
              src="/tokens/ecop.png"
              alt="ECOP"
              width={22}
              height={22}
              style={{ borderRadius: "50%" }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
              ECOP
            </span>
          </div>
        </div>

      </main>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
