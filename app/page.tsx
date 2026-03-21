"use client";

import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

// Replace with your actual Kick channel slug
const KICK_CHANNEL = "zbricks";

const BENEFITS = [
  {
    icon: "🏘️",
    title: "Llega Antes que el Mercado",
    description:
      "Accede a oportunidades inmobiliarias a precios de subasta — antes de que lleguen a los listados tradicionales o mercados públicos.",
  },
  {
    icon: "🔍",
    title: "Transparencia Total",
    description:
      "Cada oferta es visible para todos los participantes. Sin negociaciones ocultas, sin acuerdos de pasillo. Lo que ves es real.",
  },
  {
    icon: "⚡",
    title: "Pujas en Tiempo Real",
    description:
      "Subastas en vivo con actualizaciones instantáneas. Sabe exactamente dónde estás y reacciona a cada movimiento en el momento.",
  },
  {
    icon: "🏛️",
    title: "Participación Abierta",
    description:
      "Sin intermediarios, sin restricciones. Inversores calificados pujan directamente sobre propiedades verificadas — acceso justo e igualitario.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Inicia Sesión",
    description: "Conéctate con tu correo, cuenta de Google o billetera — sin experiencia previa necesaria.",
  },
  {
    number: "02",
    title: "Completa tu Perfil",
    description: "Verifica tu perfil de inversor en menos de 2 minutos para desbloquear acceso completo a las subastas.",
  },
  {
    number: "03",
    title: "Fondea tu Cuenta",
    description: "Deposita USDC o ECOP en tu billetera. Tu saldo siempre es visible y está totalmente bajo tu control.",
  },
  {
    number: "04",
    title: "Paga tu Entrada",
    description: "Cada subasta requiere una tarifa de participación en USDC. Págala una sola vez para desbloquear tu derecho a pujar.",
  },
  {
    number: "05",
    title: "Puja por Propiedades",
    description: "Explora subastas activas, realiza ofertas en tiempo real y sigue cada movimiento — completamente transparente.",
  },
];

export default function HomePage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  function handleAccess() {
    if (!ready) return;
    if (authenticated) {
      router.push("/auctions");
    } else {
      login();
    }
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
              "radial-gradient(ellipse 90% 55% at 50% -15%, rgba(45,212,212,0.10), transparent), radial-gradient(ellipse 50% 40% at 85% 55%, rgba(14,165,233,0.07), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* ── Hero ─────────────────────────────────────── */}
        <div
          className="hero-grid"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "96px 40px 72px",
            position: "relative",
            display: "grid",
            gridTemplateColumns: "5fr 6fr",
            gap: 72,
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
                padding: "7px 16px",
                borderRadius: 999,
                background: "rgba(45,212,212,0.08)",
                border: "1px solid rgba(45,212,212,0.22)",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 2s infinite",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2DD4D4", letterSpacing: 1.2 }}>
                Subastas en Vivo — Abiertas Ahora
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                marginBottom: 24,
              }}
            >
              Invierte en Bienes Raíces
              <br />
              <span style={{ color: "#67e8f9" }}>Antes que los Demás</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: 18,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                marginBottom: 44,
                maxWidth: 440,
              }}
            >
              Subastas inmobiliarias abiertas, transparentes y en tiempo real. Participa
              directamente — sin agentes, sin acuerdos ocultos, sin esperas.
            </p>

            {/* ACCESS button */}
            <button
              onClick={handleAccess}
              disabled={!ready}
              style={{
                padding: "18px 48px",
                borderRadius: 14,
                background: ready ? "#2DD4D4" : "rgba(45,212,212,0.35)",
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: 2,
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
              borderRadius: 22,
              overflow: "hidden",
              border: "1px solid rgba(45,212,212,0.15)",
              boxShadow: "0 0 100px rgba(45,212,212,0.05), 0 24px 64px rgba(0,0,0,0.5)",
              aspectRatio: "16/9",
              background: "#050a14",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.75)",
                border: "1px solid rgba(255,255,255,0.10)",
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
              style={{ border: "none", display: "block", minHeight: 280 }}
              allowFullScreen
            />
          </div>
        </div>

        {/* ── How it works ────────────────────────────── */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px 96px",
            position: "relative",
          }}
        >
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "#67e8f9", fontWeight: 700, letterSpacing: 2.5, marginBottom: 10, textTransform: "uppercase" }}>
                Cómo Funciona
              </p>
              <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>
                Del registro a tu primera oferta
                <br />
                <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>en minutos</span>
              </h2>
            </div>
            <button
              onClick={handleAccess}
              disabled={!ready}
              style={{
                padding: "13px 32px",
                borderRadius: 12,
                background: ready ? "#2DD4D4" : "rgba(45,212,212,0.35)",
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 1,
                border: "none",
                cursor: ready ? "pointer" : "not-allowed",
                flexShrink: 0,
              }}
            >
              {authenticated ? "Ir a Subastas →" : "Comenzar →"}
            </button>
          </div>

          {/* Steps — horizontal row */}
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                style={{
                  padding: "32px 24px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Connector line (not on last) */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: 44,
                    right: -8,
                    width: 16,
                    height: 1,
                    background: "rgba(45,212,212,0.18)",
                    zIndex: 1,
                  }} />
                )}
                <div style={{ fontSize: 10, fontWeight: 800, color: "#2DD4D4", letterSpacing: 3, marginBottom: 20 }}>
                  {step.number}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Benefits ─────────────────────────────────── */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 40px 96px",
            position: "relative",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr", gap: 64, alignItems: "start" }}>
            {/* Left — sticky label */}
            <div style={{ paddingTop: 8 }}>
              <p style={{ fontSize: 11, color: "#67e8f9", fontWeight: 700, letterSpacing: 2.5, marginBottom: 10, textTransform: "uppercase" }}>
                Por Qué ZBricks
              </p>
              <h2 style={{ fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                Una forma más inteligente de comprar bienes raíces
              </h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginTop: 16 }}>
                Construimos el mercado inmobiliario que los inversores merecen — abierto, justo y sin intermediarios.
              </p>
            </div>

            {/* Right — 2×2 benefit grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  style={{
                    padding: "32px 28px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.022)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 18 }}>{b.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, margin: 0 }}>
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Partners / Powered by ─────────────────────── */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "28px 40px 80px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Impulsado por
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
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
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
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
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 60px 24px 48px !important;
            gap: 40px !important;
          }
          .steps-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
