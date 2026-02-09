"use client";

type PhaseProgressBarProps = {
  phase: number; // 0-3
  total?: number; // default 4
  variant?: "compact" | "expanded";
};

const PHASE_LABELS = ["Momento 0", "Momento 1", "Momento 2", "Momento 3"];

export default function PhaseProgressBar({
  phase,
  total = 4,
  variant = "expanded",
}: PhaseProgressBarProps) {
  const clampedPhase = Math.max(0, Math.min(phase, total - 1));
  const isCompact = variant === "compact";

  return (
    <div className={isCompact ? "w-full" : "w-full py-1"}>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i <= clampedPhase;
          return (
            <div key={i} className="flex-1 flex flex-col">
              <div
                className={`h-2 rounded-full transition-colors ${
                  filled
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                    : "bg-white/10"
                }`}
              />
              {!isCompact && (
                <span
                  className={`mt-1.5 text-[10px] text-center leading-none ${
                    filled ? "text-cyan-300 font-semibold" : "text-white/30"
                  }`}
                >
                  {PHASE_LABELS[i] ?? `Phase ${i}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {isCompact && (
        <div className="mt-1 text-[10px] text-cyan-300 font-medium">
          {PHASE_LABELS[clampedPhase] ?? `Phase ${clampedPhase}`}
        </div>
      )}
    </div>
  );
}
