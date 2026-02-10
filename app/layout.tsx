import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "ZBrick - Real Estate Auctions On-Chain",
  description: "Transparent, secure property auctions powered by smart contracts. Bid with USDC, track phases in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#030712]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
