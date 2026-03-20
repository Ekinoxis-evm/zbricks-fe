"use client";

import React, { useState } from "react";
import PhaseProgressBar from "./PhaseProgressBar";
import { cn } from "./utils";
import {
  ipfsToHttp,
  isSectionRevealed,
  getTraitsForSection,
  getMediaForSection,
  getDocumentsForSection,
  formatMediaLabel,
  isVideoKey,
  SECTION_KEYS,
  SECTION_CONFIG,
} from "@/lib/metadata";
import type { AuctionMeta, Trait, SectionKey } from "@/lib/metadata";

// ============ PROPS ============

type PropertyCardProps = {
  variant: "compact" | "detail" | "token";
  metadata: AuctionMeta | null;
  currentPhase: number;
  tokenId?: number | bigint;
  auctionAddress?: string;
  auctionData?: {
    floorPrice?: bigint;
    currentHighBid?: bigint;
    currentLeader?: string;
    bidderCount?: number;
    timeRemaining?: bigint;
    finalized?: boolean;
    paused?: boolean;
  };
  tokenData?: {
    owner?: string;
    tokenURI?: string;
    phaseURIs?: string[];
  };
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  fallbackImage?: string;
  showDetailButton?: boolean;
  detailButtonText?: string;
};

// ============ HELPERS ============

const FALLBACK_IMG = "/auctions/ALH_Taller_Edificio_E_Cam_01_2025_06_07.jpg";

const shortAddr = (addr: string) =>
  addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "-";

const formatUsdc = (amount: bigint) =>
  Number(BigInt(amount) / 1000000n).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatTime = (seconds: bigint) => {
  const s = Number(seconds);
  if (s <= 0) return "Ended";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Section icon map
const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  location: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  interior: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 21V9l9-7 9 7v12H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  amenities: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2v4m6.36-1.64-2.83 2.83M22 12h-4M18.36 18.36l-2.83-2.83M12 22v-4M5.64 18.36l2.83-2.83M2 12h4M5.64 5.64l2.83 2.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  legal: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

// ============ SUB-COMPONENTS ============

function IpfsImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = errored ? (fallback || FALLBACK_IMG) : (ipfsToHttp(src) || fallback || FALLBACK_IMG);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockedOverlay({ revealPhase, children }: { revealPhase: number; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="blur-md select-none pointer-events-none opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
        <LockIcon className="h-8 w-8 text-white/50 mb-2" />
        <span className="text-sm text-white/60 font-medium">Revealed in Phase {revealPhase}</span>
      </div>
    </div>
  );
}

function SkeletonTraitGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
          <div className="h-2 w-12 rounded bg-white/10 mb-2" />
          <div className="h-3 w-16 rounded bg-white/[0.08]" />
        </div>
      ))}
    </div>
  );
}

function SkeletonMediaGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-white/[0.04] border border-white/[0.06]" />
      ))}
    </div>
  );
}

function TraitGrid({ traits, compact }: { traits: Trait[]; compact?: boolean }) {
  if (traits.length === 0) return null;

  const displayTraits = traits.filter(
    (t) => t.value !== "" && t.value !== 0 && t.trait_type !== "Reveal Phase"
  );
  if (displayTraits.length === 0) return null;

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3")}>
      {displayTraits.map((trait) => (
        <div
          key={trait.trait_type}
          className="rounded-lg bg-black/30 border border-white/[0.08] p-3"
        >
          <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">
            {trait.trait_type}
          </div>
          <div className="text-sm text-white font-medium truncate">
            {String(trait.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaGallery({ media }: { media: Record<string, string> }) {
  const entries = Object.entries(media).filter(([, v]) => !!v);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {entries.map(([key, uri]) => (
        <div key={key} className="relative group">
          <div className="aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-black/30">
            <IpfsImage
              src={uri}
              alt={formatMediaLabel(key)}
              className="w-full h-full object-cover"
            />
            {isVideoKey(key) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/60 p-2">
                  <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 text-[10px] text-white/40 truncate text-center">
            {formatMediaLabel(key)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentList({ documents }: { documents: Record<string, string> }) {
  const entries = Object.entries(documents).filter(([, v]) => !!v);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      {entries.map(([key, uri]) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-lg bg-black/30 border border-white/[0.08] px-3 py-2"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-400 shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="text-sm text-white/80 flex-1 truncate">
            {formatMediaLabel(key)}
          </span>
          <a
            href={ipfsToHttp(uri)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:underline shrink-0"
          >
            View
          </a>
        </div>
      ))}
    </div>
  );
}

function RevealSection({
  section,
  currentPhase,
  children,
}: {
  section: SectionKey;
  currentPhase: number;
  children: React.ReactNode;
}) {
  const cfg = SECTION_CONFIG[section];
  const revealed = isSectionRevealed(section, currentPhase);

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
        <span className={revealed ? "text-cyan-400" : "text-white/30"}>{SECTION_ICONS[section]}</span>
        {cfg.title}
        {!revealed && <LockIcon className="h-3.5 w-3.5 text-white/30" />}
        {revealed && <span className="text-[10px] text-emerald-400/80 bg-emerald-400/10 rounded-full px-2 py-0.5">Revealed</span>}
      </h3>
      {revealed ? (
        children
      ) : (
        <LockedOverlay revealPhase={cfg.revealPhase}>
          <SkeletonTraitGrid />
          <SkeletonMediaGrid />
        </LockedOverlay>
      )}
    </div>
  );
}

/** Compact phase indicator for cards - shows 4 dots for sections */
function PhaseRevealIndicator({ currentPhase }: { currentPhase: number }) {
  return (
    <div className="flex gap-1.5 items-center">
      {SECTION_KEYS.map((section) => {
        const revealed = isSectionRevealed(section, currentPhase);
        const cfg = SECTION_CONFIG[section];
        return (
          <div
            key={section}
            title={`${cfg.title}: ${revealed ? "Revealed" : `Locked (Phase ${cfg.revealPhase})`}`}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border",
              revealed
                ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                : "bg-white/[0.03] border-white/[0.06] text-white/25",
            )}
          >
            {revealed ? (
              <svg viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5"><path d="M6.5 12.5l-4-4 1.4-1.4L6.5 9.7l5.6-5.6L13.5 5.5z"/></svg>
            ) : (
              <LockIcon className="h-2.5 w-2.5" />
            )}
            <span className="hidden sm:inline">{cfg.title.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============ COMPACT VARIANT ============

function CompactCard({
  metadata,
  currentPhase,
  auctionData,
  tokenId,
  fallbackImage,
  className,
}: PropertyCardProps) {
  const isActive = auctionData ? !auctionData.finalized && !auctionData.paused : true;
  const phaseLabels = ["Phase 0", "Phase 1", "Phase 2", "Final"];
  const phaseLabel = phaseLabels[Math.min(currentPhase, 3)];

  const heroImage = metadata?.image || fallbackImage || FALLBACK_IMG;
  const title = metadata?.name || `Property #${tokenId != null ? Number(tokenId) : "?"}`;

  // Extract location from traits
  const cityTrait = metadata?.attributes?.find((t) => t.trait_type === "City");
  const neighborhoodTrait = metadata?.attributes?.find((t) => t.trait_type === "Neighborhood");
  const countryTrait = metadata?.attributes?.find((t) => t.trait_type === "Country");
  const locationParts = [neighborhoodTrait?.value, cityTrait?.value, countryTrait?.value]
    .filter((v) => v && String(v) !== "");
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : "";

  // Quick trait summary for revealed info
  const bedrooms = metadata?.attributes?.find((t) => t.trait_type === "Bedrooms");
  const bathrooms = metadata?.attributes?.find((t) => t.trait_type === "Bathrooms");
  const poolType = metadata?.attributes?.find((t) => t.trait_type === "Pool Type");
  const levels = metadata?.attributes?.find((t) => t.trait_type === "Levels");
  const lotSize = metadata?.attributes?.find((t) => t.trait_type === "Lot Size");
  const traitPills: string[] = [];
  if (bedrooms && bedrooms.value && Number(bedrooms.value) > 0) traitPills.push(`${bedrooms.value} Bed`);
  if (bathrooms && bathrooms.value && Number(bathrooms.value) > 0) traitPills.push(`${bathrooms.value} Bath`);
  if (levels && levels.value && Number(levels.value) > 0) traitPills.push(`${levels.value} Levels`);
  if (poolType && poolType.value && String(poolType.value) !== "") traitPills.push("Pool");
  if (lotSize && lotSize.value && String(lotSize.value) !== "") traitPills.push(String(lotSize.value));

  return (
    <article className={cn(
      "card rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] relative transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
      className,
    )}>
      {/* Hero image */}
      <div className="relative">
        <IpfsImage
          src={heroImage}
          alt={title}
          className="w-full h-[170px] object-cover block"
          fallback={fallbackImage || FALLBACK_IMG}
        />
        <div
          className={cn(
            "absolute top-3 left-3 px-2.5 py-1.5 rounded-full text-xs font-black border",
            isActive
              ? "bg-green-500/20 border-green-500/30 text-green-300"
              : "bg-red-500/20 border-red-500/30 text-red-300",
          )}
        >
          {isActive ? "Active" : "Ended"}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full text-xs font-bold border border-white/20 bg-black/50 text-white/80">
          {phaseLabel}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        {isActive && auctionData?.timeRemaining != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-xs text-white/80">
            <span className="text-cyan-400">&#9201;</span>
            {formatTime(auctionData.timeRemaining)}
          </div>
        )}
      </div>

      <div className="p-3.5">
        {/* Title + Price */}
        <div className="flex items-start gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-200 leading-tight truncate">{title}</div>
            {locationText ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400 truncate">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-cyan-400 shrink-0">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="2" />
                </svg>
                {locationText}
              </div>
            ) : (
              <div className="mt-1.5 text-xs text-gray-400 truncate">
                {auctionData ? shortAddr(String(auctionData.currentLeader || "")) : ""}
              </div>
            )}
          </div>
          {auctionData && (
            <div className="px-2.5 py-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] text-cyan-400 font-black text-xs whitespace-nowrap">
              ${formatUsdc(
                (auctionData.currentHighBid ?? 0n) > 0n
                  ? auctionData.currentHighBid!
                  : auctionData.floorPrice ?? 0n
              )}
            </div>
          )}
        </div>

        {/* Trait pills */}
        {traitPills.length > 0 && (
          <div className="mt-2.5 flex gap-1.5 flex-wrap">
            {traitPills.map((pill) => (
              <span key={pill} className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-medium">
                {pill}
              </span>
            ))}
          </div>
        )}

        {/* Phase section reveal indicators */}
        <div className="mt-2.5">
          <PhaseRevealIndicator currentPhase={currentPhase} />
        </div>

        {/* Bidder info */}
        {auctionData && (
          <div className="mt-3 flex gap-2 text-xs text-gray-400">
            <div className="flex-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-black/25 text-center">
              <span className="text-white/70">{auctionData.bidderCount ?? 0}</span> bidders
            </div>
            <div className="flex-1 px-2 py-1.5 rounded-lg border border-white/[0.08] bg-black/25 text-center truncate">
              Leader: <span className="text-cyan-400">{shortAddr(auctionData.currentLeader || "")}</span>
            </div>
          </div>
        )}

        {/* Phase progress */}
        <div className="mt-3">
          <PhaseProgressBar phase={currentPhase} variant="compact" />
        </div>

        {/* CTA */}
        <div className="mt-3 flex gap-2.5">
          <div className="flex-1 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-gray-200 font-bold text-center text-sm hover:bg-white/[0.06] transition-colors">
            {isActive ? "Place Bid" : "View Details"}
          </div>
        </div>
      </div>
    </article>
  );
}

// ============ DETAIL VARIANT ============

function DetailCard({
  metadata,
  currentPhase,
  tokenId,
  fallbackImage,
  className,
  isLoading,
}: PropertyCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-3xl bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-6 animate-pulse", className)}>
        <div className="h-48 rounded-xl bg-white/[0.04] mb-4" />
        <div className="h-5 w-48 rounded bg-white/[0.06] mb-2" />
        <div className="h-3 w-64 rounded bg-white/[0.04]" />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className={cn("rounded-3xl bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-6", className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white/20 mb-3">
            <path d="M3 21V9l9-7 9 7v12H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <div className="text-white/40 text-sm">Property metadata not available</div>
          <div className="text-white/25 text-xs mt-1">Metadata will appear when the NFT tokenURI is set</div>
        </div>
      </div>
    );
  }

  const heroImage = metadata.image || fallbackImage || FALLBACK_IMG;
  const title = metadata.name || `Property #${tokenId != null ? Number(tokenId) : "?"}`;
  const phaseLabels = ["Phase 0", "Phase 1", "Phase 2", "Final"];
  const phaseLabel = phaseLabels[Math.min(currentPhase, 3)];

  return (
    <div className={cn("rounded-3xl bg-white/[0.04] border border-white/[0.08] shadow-[0_18px_60px_rgba(0,0,0,0.55)] overflow-hidden", className)}>
      {/* Hero */}
      <div className="relative">
        <IpfsImage
          src={heroImage}
          alt={title}
          className="w-full h-64 object-cover"
          fallback={fallbackImage || FALLBACK_IMG}
        />
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold border border-white/20 bg-black/50 text-white/80 backdrop-blur-sm">
          {phaseLabel}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">{title}</h2>
          {metadata.description && (
            <p className="text-sm text-white/70 mt-1 line-clamp-2 drop-shadow">{metadata.description}</p>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Phase progress */}
        <div className="mb-5">
          <PhaseProgressBar phase={currentPhase} variant="expanded" />
        </div>

        {/* Phase reveal overview */}
        <div className="mb-5 flex flex-wrap gap-2">
          <PhaseRevealIndicator currentPhase={currentPhase} />
        </div>

        {/* Reveal sections */}
        {SECTION_KEYS.map((section) => {
          const sectionTraits = getTraitsForSection(section, metadata.attributes);
          const sectionMedia = getMediaForSection(section, metadata.media);
          const sectionDocs = getDocumentsForSection(section, metadata.documents);

          return (
            <RevealSection key={section} section={section} currentPhase={currentPhase}>
              <TraitGrid traits={sectionTraits} />
              <MediaGallery media={sectionMedia} />
              <DocumentList documents={sectionDocs} />
              {sectionTraits.length === 0 && Object.keys(sectionMedia).length === 0 && Object.keys(sectionDocs).length === 0 && (
                <div className="text-xs text-white/30 py-2">No data available for this section yet.</div>
              )}
            </RevealSection>
          );
        })}
      </div>
    </div>
  );
}

// ============ TOKEN VARIANT ============

function TokenCard({
  metadata,
  currentPhase,
  tokenId,
  fallbackImage,
  className,
  isLoading,
  onClick,
}: PropertyCardProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden animate-pulse", className)}>
        <div className="h-48 w-full bg-white/[0.04]" />
        <div className="p-4 space-y-3">
          <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
          <div className="h-4 w-full rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  const heroImage = metadata?.image || fallbackImage || FALLBACK_IMG;
  const phaseLabels = ["Phase 0", "Phase 1", "Phase 2", "Final"];
  const phaseLabel = phaseLabels[Math.min(currentPhase, 3)];
  const title = metadata?.name || `Property #${tokenId != null ? Number(tokenId) : "?"}`;
  const description = metadata?.description;

  const city = metadata?.attributes?.find((t) => t.trait_type === "City");
  const neighborhood = metadata?.attributes?.find((t) => t.trait_type === "Neighborhood");
  const country = metadata?.attributes?.find((t) => t.trait_type === "Country");
  const locationParts = [neighborhood?.value, city?.value, country?.value].filter((v) => v && String(v) !== "");
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  return (
    <article
      onClick={onClick}
      className={cn(
        "group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all hover:border-cyan-400/50 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] cursor-pointer",
        className,
      )}
    >
      {/* Image with phase badge */}
      <div className="relative h-48 overflow-hidden">
        <IpfsImage
          src={heroImage}
          alt={title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallback={fallbackImage || FALLBACK_IMG}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 right-3 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm">
          {phaseLabel}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Title */}
        <h3 className="text-base font-bold text-white line-clamp-2">{title}</h3>

        {/* Location */}
        {locationText && (
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-400 shrink-0">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className="line-clamp-1">{locationText}</span>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-white/60 line-clamp-2">{description}</p>
        )}

        {/* Phase status */}
        <div className="pt-1">
          <PhaseProgressBar phase={currentPhase} variant="compact" />
        </div>
      </div>
    </article>
  );
}

// ============ MAIN EXPORT ============

export default function PropertyCard(props: PropertyCardProps) {
  switch (props.variant) {
    case "compact":
      return <CompactCard {...props} />;
    case "detail":
      return <DetailCard {...props} />;
    case "token":
      return <TokenCard {...props} />;
  }
}
