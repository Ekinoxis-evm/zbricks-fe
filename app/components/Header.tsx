"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton, WalletButton } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Auctions", href: "/auctions" },
  { label: "Properties", href: "/properties" },
  { label: "My Account", href: "/account" },
  { label: "Admin", href: "/admin" },
];

export default function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  // Get chain info
  const chainName = chainId === 8453 ? "Base" : chainId === 84532 ? "Base Sepolia" : "Unknown";
  const isBaseNetwork = chainId === 8453 || chainId === 84532;

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
                background: isActive(item.href)
                  ? "#67e8f9"
                  : "transparent",
                border: isActive(item.href)
                  ? "none"
                  : "1px solid transparent",
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

        {/* Chain Indicator */}
        {isConnected && isBaseNetwork && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(45,212,212,0.1)",
              border: "1px solid rgba(45,212,212,0.2)",
              fontSize: 11,
              color: "#67e8f9",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
            {chainName}
          </div>
        )}

        {/* Network Warning */}
        {isConnected && !isBaseNetwork && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: 11,
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            Wrong Network
          </div>
        )}

        {/* Auth / User */}
        {isConnected && address ? (
          <ConnectButton.Custom>
            {({ account, openAccountModal }) => (
              <button
                onClick={openAccountModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(103,232,249,0.3)",
                  background: "rgba(103,232,249,0.08)",
                  textDecoration: "none",
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
                {account?.displayName}
              </button>
            )}
          </ConnectButton.Custom>
        ) : (
          <WalletButton.Custom wallet="baseAccount">
            {({ ready, connect }) => (
              <button
                onClick={connect}
                disabled={!ready}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: "#2DD4D4",
                  color: "#0f172a",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "transform 150ms ease, box-shadow 150ms ease",
                  border: "none",
                  cursor: ready ? "pointer" : "not-allowed",
                  opacity: ready ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (ready) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(45,212,212,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Sign In
              </button>
            )}
          </WalletButton.Custom>
        )}
      </div>
    </header>
  );
}
