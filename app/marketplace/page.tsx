"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Property {
  id: string;
  title: string;
  location: string;
  details: string;
  image: string;
  price: number;
  status: "Activa" | "Finalizada";
}

type TokenBalanceEntry = {
  amount?: string;
  token?: {
    symbol?: string;
    name?: string;
  };
};

type Tab = "subasta" | "cerrada" | "mercado";
type StatusFilter = "Todas" | "Activa" | "Finalizada";

export default function MarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showStreamCard, setShowStreamCard] = useState(false);
  const [liveExploded, setLiveExploded] = useState(false);
  const [walletAddress] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("w3s_wallet_address") ?? "";
  });
  const [walletBalance, setWalletBalance] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("w3s_wallet_usdc");
  });

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>("mercado");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const streamTimer = setTimeout(() => {
      setShowStreamCard(true);
    }, 5000);

    const userToken =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("w3s_user_token") ||
          window.localStorage.getItem("w3s_user_token")
        : null;
    const walletId =
      typeof window !== "undefined" ? window.localStorage.getItem("w3s_wallet_id") : null;

    if (userToken && walletId) {
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
          if (!response.ok) {
            return;
          }
          const balances = (data.tokenBalances as TokenBalanceEntry[]) || [];
          const usdcEntry =
            balances.find((t) => {
              const symbol = t.token?.symbol || "";
              const name = t.token?.name || "";
              return symbol.startsWith("USDC") || name.includes("USDC");
            }) ?? null;
          setWalletBalance(usdcEntry?.amount ?? "0");
          if (typeof window !== "undefined") {
            window.localStorage.setItem("w3s_wallet_usdc", usdcEntry?.amount ?? "0");
          }
        } catch {
          // no-op
        }
      })();
    }

    const timeout = setTimeout(() => {
      const mockData: Property[] = [
        {
          id: "1",
          title: "Modern Family House",
          location: "San Francisco, CA",
          details: "5BR, 3BA",
          image: "/marketplace/ALH_Taller_Edificio_E_Cam_01_2025_06_07.jpg",
          price: 550000,
          status: "Activa",
        },
        {
          id: "2",
          title: "Luxurious Villa",
          location: "Miami, FL",
          details: "6BR, 6BA, Pool",
          image: "/marketplace/ALH_Taller_Edificio_E_Cam_03_2025_06_07.jpg",
          price: 1250000,
          status: "Activa",
        },
        {
          id: "3",
          title: "Country Cottage",
          location: "Denver, CO",
          details: "2BR, 2BA",
          image: "/marketplace/ALH_Taller_Edificio_E_Cam_04_2025_06_07.jpg",
          price: 350000,
          status: "Finalizada",
        },
        {
          id: "4",
          title: "Beachfront Mansion",
          location: "Malibu, CA",
          details: "6BR, 6BA",
          image: "/marketplace/ALH_Taller_Edificio_E_Cam_05_2025_06_07.jpg",
          price: 2300000,
          status: "Activa",
        },
        {
          id: "5",
          title: "Suburban House",
          location: "Seattle, WA",
          details: "3BR, 2BA",
          image: "/marketplace/ALH_Taller_Edificio_E_Cam_06_2025_06_07.jpg",
          price: 450000,
          status: "Activa",
        },
        {
          id: "6",
          title: "Mountain Retreat",
          location: "Aspen, CO",
          details: "4BR, 3BA",
          image: "/marketplace/AIN2402_AO_TTA_YAV_AV_947_ZonasComunes_04.jpg",
          price: 750000,
          status: "Activa",
        },
      ];
      setProperties(mockData);
      setLoading(false);
    }, 800);

    return () => {
      clearTimeout(timeout);
      clearTimeout(streamTimer);
    };
  }, []);

  const handleAccountClick = () => {
    if (walletAddress) {
      router.push("/cuenta");
      return;
    }
    router.push("/auth");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      const matchStatus = statusFilter === "Todas" ? true : p.status === statusFilter;
      const matchQuery =
        q.length === 0
          ? true
          : `${p.title} ${p.location} ${p.details}`.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [properties, statusFilter, search]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "1.25rem", opacity: 0.8 }}>
          Cargando propiedades...
        </span>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "black", color: "white" }}>
      {/* ====== HEADER (sticky) ====== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>
              <span style={{ color: "#67e8f9" }}>Casa</span>{" "}
              <span style={{ color: "white" }}>Marketplace</span>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Mercado directo · subastas · licitaciones
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* LIVE button (animado) */}
          <button
            type="button"
            onClick={() => router.push("/pujas")}
            title="Entrar a Live"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: liveExploded ? "rgba(239, 68, 68, 0.95)" : "rgba(255,255,255,0.04)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
            className={`liveBtn ${liveExploded ? "liveBtnBig" : ""}`}
          >
            <span className="liveDot" aria-hidden="true" />
            <span style={{ letterSpacing: 0.6 }}>
              {liveExploded ? "GRANDE LIVE" : "LIVE"}
            </span>
          </button>

          {/* Volver */}
          <Link
            href="/subastas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(103,232,249,0.45)",
              color: "#67e8f9",
              textDecoration: "none",
              fontWeight: 800,
              background: "rgba(103,232,249,0.06)",
            }}
          >
            Volver a Subastas →
          </Link>

          {/* User / Cuenta */}
          <div className="userMenu" style={{ position: "relative" }}>
            <button
              type="button"
              onClick={handleAccountClick}
              title={walletAddress ? "Mi wallet" : "Iniciar sesión"}
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <UserAvatarIcon />
            </button>

            {walletAddress && (
              <div className="walletPreview">
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  Wallet
                </div>
                <div style={{ fontSize: 12, color: "white", wordBreak: "break-all" }}>
                  {walletAddress}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  Balance USDC
                </div>
                <div style={{ fontSize: 12, color: "white" }}>
                  {walletBalance ?? "—"}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====== CONTENT ====== */}
      <section style={{ padding: "22px 16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Top controls */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ color: "#9ca3af", fontSize: 14 }}>
              📍 Haz clic en una propiedad para ver más detalles
            </div>

            <div style={{ flex: 1 }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                minWidth: 280,
              }}
            >
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Buscar</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ej: Miami, Villa, 4BR..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "white",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Grid layout: Sidebar + Marketplace */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 16,
            }}
            className="marketLayout"
          >
            {/* Sidebar */}
            <aside
              style={{
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                padding: 14,
                height: "fit-content",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Filtros</div>

              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                Estado
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip active={statusFilter === "Todas"} onClick={() => setStatusFilter("Todas")}>
                  Todas
                </Chip>
                <Chip active={statusFilter === "Activa"} onClick={() => setStatusFilter("Activa")}>
                  Activas
                </Chip>
                <Chip
                  active={statusFilter === "Finalizada"}
                  onClick={() => setStatusFilter("Finalizada")}
                >
                  Finalizadas
                </Chip>
              </div>

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
                  Resumen
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <MiniStat label="Total" value={String(properties.length)} />
                  <MiniStat
                    label="Activas"
                    value={String(properties.filter((p) => p.status === "Activa").length)}
                  />
                  <MiniStat
                    label="Finalizadas"
                    value={String(properties.filter((p) => p.status === "Finalizada").length)}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(103,232,249,0.22)",
                  background: "rgba(103,232,249,0.06)",
                  color: "#e5e7eb",
                  fontSize: 13,
                  lineHeight: 1.35,
                }}
              >
                <b style={{ color: "#67e8f9" }}>Tip:</b> pon “LIVE” arriba para que el
                usuario sienta que esto está ocurriendo en tiempo real.
              </div>
            </aside>

            {/* Marketplace grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((property) => (
                <Link
                  key={property.id}
                  href="/pujas"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    className="card"
                    style={{
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.10)",
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.03)",
                      position: "relative",
                      transform: "translateZ(0)",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={property.image}
                        alt={property.title}
                        style={{
                          width: "100%",
                          height: 170,
                          objectFit: "cover",
                          display: "block",
                          filter: "contrast(1.05) saturate(1.05)",
                        }}
                      />

                      {/* Badge estado */}
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "7px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 900,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background:
                            property.status === "Activa"
                              ? "rgba(34,197,94,0.18)"
                              : "rgba(239,68,68,0.18)",
                          color: property.status === "Activa" ? "#86efac" : "#fca5a5",
                        }}
                      >
                        {property.status}
                      </div>

                      {/* overlay suave */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.70), rgba(0,0,0,0.15), rgba(0,0,0,0))",
                        }}
                      />
                    </div>

                    <div style={{ padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, color: "#e5e7eb", lineHeight: 1.2 }}>
                            {property.title}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                            {property.location} · {property.details}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: "8px 10px",
                            borderRadius: 12,
                            border: "1px solid rgba(103,232,249,0.28)",
                            background: "rgba(103,232,249,0.06)",
                            color: "#67e8f9",
                            fontWeight: 900,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          ${property.price.toLocaleString()}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                        <div
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.03)",
                            color: "#e5e7eb",
                            fontWeight: 800,
                            textAlign: "center",
                            fontSize: 13,
                          }}
                        >
                          Ver detalles
                        </div>

                        <div
                          style={{
                            width: 44,
                            height: 40,
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.03)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontWeight: 900,
                          }}
                          title="Guardar"
                        >
                          ☆
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}

              {filtered.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: 18,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#9ca3af",
                  }}
                >
                  No hay resultados con esos filtros / búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showStreamCard && (
        <div className="streamOverlay">
          <div className="streamCard">
            <button
              type="button"
              className="streamClose"
              onClick={() => {
                setShowStreamCard(false);
                setLiveExploded(true);
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="streamVideo">
              <video
                src="/steam/kling_20260208_Image_to_Video_Animate_th_3148_0_2.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="streamBadge">Stream starting soon</div>
              <div className="streamGlow" />
            </div>
            <button
              type="button"
              className="streamCta"
              onClick={() => router.push("/pujas")}
            >
              Streaming →
            </button>
          </div>
        </div>
      )}

      {/* ====== Styles (LIVE anim + responsive) ====== */}
      <style jsx>{`
        .liveBtn {
          position: relative;
          overflow: hidden;
        }
        .liveBtn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(239, 68, 68, 0.18),
            rgba(0, 0, 0, 0)
          );
          opacity: 0;
          transition: opacity 200ms ease;
          pointer-events: none;
        }
        .liveBtn:hover::after {
          opacity: 1;
        }

        .liveDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgb(239, 68, 68);
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          animation: livePulse 1.2s infinite;
        }

        .liveBtnBig {
          border-color: rgba(239, 68, 68, 0.8);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.45);
          animation: liveBigFlash 0.7s infinite;
        }

        @keyframes liveBigFlash {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
            filter: brightness(1);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(239, 68, 68, 0.2);
            filter: brightness(1.15);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
            filter: brightness(1);
          }
        }

        @keyframes livePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.65);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        .card {
          transition: transform 160ms ease, border-color 160ms ease,
            box-shadow 160ms ease;
        }
        .card:hover {
          transform: translateY(-3px);
          border-color: rgba(103, 232, 249, 0.32);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
        }

        .walletPreview {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          min-width: 220px;
          max-width: 320px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
          opacity: 0;
          transform: translateY(-4px);
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .userMenu:hover .walletPreview {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 980px) {
          .marketLayout {
            grid-template-columns: 1fr !important;
          }
        }

        .streamOverlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 80;
          pointer-events: none;
        }

        .streamCard {
          width: 280px;
          height: 280px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(8, 8, 8, 0.9);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          pointer-events: auto;
        }

        .streamClose {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: white;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }

        .streamVideo {
          flex: 1;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: radial-gradient(circle at 20% 20%, rgba(103, 232, 249, 0.2), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(239, 68, 68, 0.25), transparent 50%),
            rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          letter-spacing: 0.3px;
          position: relative;
          overflow: hidden;
        }

        .streamVideo video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          filter: saturate(1.05);
        }

        .streamBadge {
          z-index: 2;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 12px;
        }

        .streamGlow {
          position: absolute;
          inset: 0;
          background: conic-gradient(from 180deg, rgba(103, 232, 249, 0.2), rgba(239, 68, 68, 0.2), rgba(103, 232, 249, 0.2));
          animation: streamPulse 3s linear infinite;
          opacity: 0.5;
        }

        @keyframes streamPulse {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .streamCta {
          border-radius: 12px;
          border: 1px solid rgba(103, 232, 249, 0.4);
          background: rgba(103, 232, 249, 0.15);
          color: #67e8f9;
          font-weight: 800;
          padding: 10px 12px;
          cursor: pointer;
          text-align: center;
        }
      `}</style>
    </main>
  );
}

/* ======= UI helpers ======= */

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        cursor: "pointer",
        padding: "10px 12px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 13,
        color: active ? "black" : "#e5e7eb",
        background: active ? "#67e8f9" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(103,232,249,0.18)" : "rgba(255,255,255,0.03)",
        color: active ? "#67e8f9" : "#e5e7eb",
        padding: "8px 10px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.25)",
        color: "#e5e7eb",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <b style={{ color: "white" }}>{value}</b>
    </div>
  );
}

function UserAvatarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z"
        stroke="rgba(229,231,235,0.95)"
        strokeWidth="1.8"
      />
      <path
        d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8"
        stroke="rgba(229,231,235,0.95)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
