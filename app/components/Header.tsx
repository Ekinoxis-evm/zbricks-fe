"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "")
  .split(",")
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const walletAddress = user?.wallet?.address?.toLowerCase();
  const isAdmin = walletAddress ? ADMIN_ADDRESSES.includes(walletAddress) : false;

  const navItems = [
    { label: "Subastas", href: "/auctions" },
    { label: "Propiedades", href: "/properties" },
    { label: "Mi Cuenta", href: "/account" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: isScrolled ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        transition: "background 200ms ease",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #2DD4D4 0%, #0ea5e9 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 16,
              color: "black",
            }}
          >
            Z
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "white", fontSize: 16, letterSpacing: -0.3 }}>
              <span style={{ color: "#67e8f9" }}>ZBrick</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: -2 }}>
              Subastas Inmobiliarias
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: 24,
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                color: isActive(item.href) ? "#0f172a" : "rgba(255,255,255,0.75)",
                background: isActive(item.href) ? "#67e8f9" : "transparent",
                border: isActive(item.href) ? "none" : "1px solid transparent",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                }
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Auth Button */}
        {!ready ? (
          <div style={{ width: 80, height: 36 }} />
        ) : authenticated ? (
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.65)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            }}
          >
            Cerrar Sesión
          </button>
        ) : (
          <button
            onClick={login}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "#2DD4D4",
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(45,212,212,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}
