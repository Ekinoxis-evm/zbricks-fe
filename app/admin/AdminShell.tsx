"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import AdminContext from "./AdminContext";
import { CHAIN_META } from "@/lib/contracts";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/properties", label: "Properties", exact: false },
  { href: "/admin/launch", label: "Launch Auction", exact: false },
  { href: "/admin/auctions", label: "Manage Auctions", exact: false },
  { href: "/admin/settings", label: "Settings", exact: false },
];

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-52 flex-shrink-0">
      <div className="sticky top-8">
        <div className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4 px-3">
          Admin Panel
        </div>
        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#2DD4D4]/10 text-[#2DD4D4] border border-[#2DD4D4]/20"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 pt-5 border-t border-white/[0.06] px-3 space-y-1">
          <div className="text-[10px] text-white/25 uppercase tracking-widest">Network</div>
          <div className="text-xs font-semibold text-[#2DD4D4]">{CHAIN_META.chainName}</div>
        </div>
      </div>
    </aside>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminContext>
      <div className="min-h-screen bg-[#030712] text-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </AdminContext>
  );
}
