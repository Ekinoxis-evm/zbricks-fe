"use client";

import React, { useState } from "react";
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
import type { AuctionMeta, SectionKey } from "@/lib/metadata";
import PhaseProgressBar from "./PhaseProgressBar";

// ============ TYPES ============

type PropertyDetailPageProps = {
  metadata: AuctionMeta | null;
  currentPhase: number;
  tokenId?: number | bigint;
  title?: string;
  fallbackImage?: string;
};

// ============ CONSTANTS ============

const FALLBACK_IMG = "/auctions/ALH_Taller_Edificio_E_Cam_01_2025_06_07.jpg";

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  location: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  interior: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 21V9l9-7 9 7v12H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  amenities: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M12 2v4m6.36-1.64-2.83 2.83M22 12h-4M18.36 18.36l-2.83-2.83M12 22v-4M5.64 18.36l2.83-2.83M2 12h4M5.64 5.64l2.83 2.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  legal: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ============ SUB-COMPONENTS ============

function IpfsImage({
  src,
  alt,
  className,
  fallback,
  clickable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  clickable?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = errored ? (fallback || FALLBACK_IMG) : (ipfsToHttp(src) || fallback || FALLBACK_IMG);
  const ipfsUrl = ipfsToHttp(src) || src;

  const imgElement = (
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn(className, clickable && "cursor-pointer hover:opacity-80 transition-opacity")}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );

  if (!clickable) return imgElement;

  return (
    <a
      href={ipfsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {imgElement}
    </a>
  );
}

function MediaCard({
  label,
  uri,
  isVideo,
}: {
  label: string;
  uri: string;
  isVideo: boolean;
}) {
  const ipfsUrl = ipfsToHttp(uri) || uri;

  return (
    <a
      href={ipfsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block h-full rounded-xl border border-white/10 bg-black/30 overflow-hidden hover:border-cyan-400/50 transition-colors"
    >
      <IpfsImage
        src={uri}
        alt={label}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
        {isVideo ? (
          <div className="rounded-full bg-cyan-500/90 p-3 mb-2">
            <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <div className="rounded-full bg-cyan-500/90 p-3 mb-2">
            <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 12m-6-6h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <span className="text-sm font-semibold text-white">Open in IPFS</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
        <p className="text-xs text-white/80 truncate">{label}</p>
      </div>
    </a>
  );
}

function DocumentCard({
  label,
  uri,
}: {
  label: string;
  uri: string;
}) {
  const ipfsUrl = ipfsToHttp(uri) || uri;

  return (
    <a
      href={ipfsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 hover:border-cyan-400/50 hover:bg-white/[0.08] transition-all"
    >
      <div className="rounded-lg bg-cyan-500/20 p-2.5 group-hover:bg-cyan-500/30 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cyan-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{label}</p>
        <p className="text-xs text-white/40 truncate">{uri}</p>
      </div>
      <div className="flex items-center gap-2 text-cyan-400 group-hover:text-cyan-300 transition-colors shrink-0">
        <span className="text-xs font-semibold">Open</span>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </a>
  );
}

function TraitPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function SectionHeader({
  section,
  revealed,
}: {
  section: SectionKey;
  revealed: boolean;
}) {
  const cfg = SECTION_CONFIG[section];

  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
      <div className={revealed ? "text-cyan-400" : "text-white/30"}>
        {SECTION_ICONS[section]}
      </div>
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white">{cfg.title}</h2>
        <p className="text-xs text-white/40 mt-1">{cfg.description}</p>
      </div>
      {!revealed && (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          <LockIcon className="h-3 w-3 text-white/30" />
          <span className="text-xs text-white/30 font-medium">Phase {cfg.revealPhase}</span>
        </div>
      )}
      {revealed && (
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-emerald-400">
            <path d="M6.5 12.5l-4-4 1.4-1.4L6.5 9.7l5.6-5.6L13.5 5.5z" />
          </svg>
          <span className="text-xs text-emerald-400 font-medium">Revealed</span>
        </div>
      )}
    </div>
  );
}

function LockedSection({ phase }: { phase: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] p-8">
      <div className="blur-sm select-none pointer-events-none opacity-30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-white/[0.04] h-24" />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="rounded-full bg-white/5 p-4 mb-3">
          <LockIcon className="h-8 w-8 text-white/40" />
        </div>
        <h3 className="text-lg font-semibold text-white/60 mb-1">Content Locked</h3>
        <p className="text-sm text-white/40">This section will be revealed in Phase {phase}</p>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function PropertyDetailPage({
  metadata,
  currentPhase,
  tokenId,
  title,
  fallbackImage,
}: PropertyDetailPageProps) {
  if (!metadata) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 text-white/20 mx-auto mb-4">
            <path d="M3 21V9l9-7 9 7v12H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <h1 className="text-2xl font-bold text-white/60">No metadata available</h1>
          <p className="text-white/40 mt-2">Metadata will be available once the token is set.</p>
        </div>
      </div>
    );
  }

  const heroImage = metadata.image || fallbackImage || FALLBACK_IMG;
  const displayTitle = title || metadata.name || `Property #${tokenId}`;
  const phaseLabels = ["Phase 0", "Phase 1", "Phase 2", "Final"];
  const phaseLabel = phaseLabels[Math.min(currentPhase, 3)];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <IpfsImage
          src={heroImage}
          alt={displayTitle}
          className="w-full h-full object-cover"
          fallback={fallbackImage || FALLBACK_IMG}
          clickable={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute top-6 left-6 right-6 flex items-start justify-between z-10">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/60 px-4 py-2 text-sm text-white/80 hover:bg-black/80 hover:text-white transition-all"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white/80">
              {phaseLabel}
            </div>
            {metadata.external_url && (
              <a
                href={metadata.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                External Link
              </a>
            )}
          </div>
        </div>

        {/* Hero Text */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{displayTitle}</h1>
            {metadata.description && (
              <p className="mt-4 text-lg text-white/80 drop-shadow">{metadata.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#030712]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Phase Progress */}
          <div className="mb-16">
            <h2 className="text-lg font-semibold text-white mb-4">Reveal Progress</h2>
            <PhaseProgressBar phase={currentPhase} variant="expanded" />
          </div>

          {/* Sections */}
          {SECTION_KEYS.map((section) => {
            const cfg = SECTION_CONFIG[section];
            const revealed = isSectionRevealed(section, currentPhase);
            const sectionTraits = getTraitsForSection(section, metadata.attributes);
            const sectionMedia = getMediaForSection(section, metadata.media);
            const sectionDocs = getDocumentsForSection(section, metadata.documents);

            return (
              <section key={section} className="mb-20">
                <SectionHeader section={section} revealed={revealed} />

                {!revealed ? (
                  <LockedSection phase={cfg.revealPhase} />
                ) : (
                  <div className="space-y-12">
                    {/* Traits */}
                    {sectionTraits.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">
                          Characteristics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {sectionTraits
                            .filter((t) => t.value !== "" && t.value !== 0 && t.trait_type !== "Reveal Phase")
                            .map((trait) => (
                              <TraitPill
                                key={trait.trait_type}
                                label={trait.trait_type}
                                value={String(trait.value)}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Media Gallery */}
                    {Object.keys(sectionMedia).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">
                          Media
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(sectionMedia)
                            .filter(([, uri]) => !!uri)
                            .map(([key, uri]) => (
                              <div key={key} className="aspect-square">
                                <MediaCard
                                  label={formatMediaLabel(key)}
                                  uri={uri}
                                  isVideo={isVideoKey(key)}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {Object.keys(sectionDocs).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-4">
                          Documents
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(sectionDocs)
                            .filter(([, uri]) => !!uri)
                            .map(([key, uri]) => (
                              <DocumentCard
                                key={key}
                                label={formatMediaLabel(key)}
                                uri={uri}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {sectionTraits.length === 0 &&
                      Object.keys(sectionMedia).length === 0 &&
                      Object.keys(sectionDocs).length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/40">
                          <p>No data available for this section yet.</p>
                        </div>
                      )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
