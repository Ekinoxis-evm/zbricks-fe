import React from "react";

interface InfoPillProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  variant?: "default" | "highlight" | "muted";
}

export default function InfoPill({ icon, label, value, variant = "default" }: InfoPillProps) {
  const variantStyles = {
    default: "bg-white/[0.03] border-white/[0.08] text-white/70",
    highlight: "bg-[#0B1516] border-[#2DD4D4]/35 text-[#7DEAEA]",
    muted: "bg-white/[0.03] border-white/[0.08] text-white/70",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${variantStyles[variant]}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/50 uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
