"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || "")
  .split(",")
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header() {
  const pathname = usePathname();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [isScrolled, setIsScrolled] = useState(false);

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
    { label: "Auctions", href: "/auctions" },
    { label: "Properties", href: "/properties" },
    { label: "My Account", href: "/account" },
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
              Real Estate Auctions
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
          <div style={{ width: 100, height: 36 }} />
        ) : authenticated && user?.wallet ? (
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(103,232,249,0.3)",
              background: "rgba(103,232,249,0.08)",
              color: "#67e8f9",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            {truncateAddress(user.wallet.address)}
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
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
