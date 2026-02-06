"use client";

import React, { useEffect, useMemo, useState } from "react";

/**
 * Admin Reveal Builder (Responsive + compact)
 * - 4 fases: momento0..momento3
 * - Base JSON: metadata completo
 * - Asignas traits/media por fase (toggle + drag & drop)
 * - Editas value de cada trait por fase (overrides)
 * - Exportas JSON por fase o bundle
 *
 * Cambios solicitados:
 * - Se elimina display_type del UI
 * - Se elimina display_type del JSON exportado (incluye "Reveal Phase")
 * - Layout ajustado a pantalla: compacto + scroll en paneles
 */

type Trait = {
  trait_type: string;
  value: string | number;
  // mantenemos opcional internamente, pero NO lo mostramos ni lo exportamos
  display_type?: string;
};

type Media = Record<string, any>;

type AuctionMeta = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: Trait[];
  media: Media;
  properties: any;
};

type PhaseKey = "momento0" | "momento1" | "momento2" | "momento3";

type TraitDraft = {
  trait_type: string;
  value: string | number;
};

type PhaseConfig = {
  title: string;
  revealPhaseNumber: number; // 0..3
  traits: string[]; // list of trait_type
  mediaKeys: string[]; // keys of meta.media
  overrides?: Partial<Pick<AuctionMeta, "name" | "description" | "image" | "animation_url">>;

  // overrides por trait (solo value)
  traitOverrides?: Record<string, TraitDraft>;
};

const STORAGE_KEY = "admin_reveal_builder_v3_compact";

const BASE_META: AuctionMeta = {
  name: "Luxury Villa #1 - Complete Property",
  description:
    "Progressive auction complete: All property details, legal documentation, and warranties revealed. Ready for finalization.",
  image: "ipfs://QmPhase3/complete-hero.jpg",
  external_url: "https://yourauction.com/villa-1",
  animation_url: "ipfs://QmPhase3/complete-tour.mp4",

  attributes: [
    { trait_type: "Reveal Phase", value: 3, display_type: "number" },
    { trait_type: "Revealed", value: "100%" },
    { trait_type: "Status", value: "Sold" },
    { trait_type: "Country", value: "Colombia" },
    { trait_type: "State", value: "Valle del Cauca" },
    { trait_type: "City", value: "Cali" },
    { trait_type: "Neighborhood", value: "Normandia" },
    { trait_type: "Zone", value: "Residential" },
    { trait_type: "Lot Size", value: "1,000 m²", display_type: "number" },
    { trait_type: "Orientation", value: "North-facing" },
    { trait_type: "Topography", value: "Flat" },
    { trait_type: "View", value: "Mountain view" },
    { trait_type: "Address", value: "Calle 10 #23-45" },
    { trait_type: "Total Living Area", value: "450 m²", display_type: "number" },
    { trait_type: "Levels", value: 3, display_type: "number" },
    { trait_type: "Bedrooms", value: 5, display_type: "number" },
    { trait_type: "Bathrooms", value: 6, display_type: "number" },
    { trait_type: "Half Baths", value: 2, display_type: "number" },
    { trait_type: "Kitchen Type", value: "Open Concept" },
    { trait_type: "Living Rooms", value: 2, display_type: "number" },
    { trait_type: "Dining Areas", value: 1, display_type: "number" },
    { trait_type: "Balconies", value: 3, display_type: "number" },
    { trait_type: "Study/Office", value: "Yes" },
    { trait_type: "Pool Type", value: "Infinity" },
    { trait_type: "Pool Size", value: "60 m²", display_type: "number" },
    { trait_type: "Gym", value: "Private Equipped" },
    { trait_type: "Parking", value: "4 Cars", display_type: "number" },
    { trait_type: "Cinema", value: "Private Theater" },
    { trait_type: "Wine Cellar", value: "Climate Controlled" },
    { trait_type: "BBQ Area", value: "Covered Outdoor" },
    { trait_type: "Garden", value: "Landscaped" },
    { trait_type: "Social Area", value: "Terrace + Lounge" },
    { trait_type: "Smart Home", value: "Full Automation" },
    { trait_type: "Security System", value: "24/7 Monitoring" },
    { trait_type: "Solar Panels", value: "Yes" },
    { trait_type: "Water Treatment", value: "Filtration System" },
    { trait_type: "Year Built", value: 2023, display_type: "number" },
    { trait_type: "Property ID", value: "COL-VDC-CALI-001" },
    { trait_type: "Legal Status", value: "Clear Title" },
    { trait_type: "Zoning", value: "Residential - R1" },
    { trait_type: "Property Tax/Year", value: "12,000,000 COP" },
    { trait_type: "HOA Fees/Month", value: "500,000 COP" },
    { trait_type: "Warranty", value: "10 Years Structural" },
    { trait_type: "Utilities", value: "All Connected" },
    { trait_type: "Internet", value: "Fiber 1Gbps" },
    { trait_type: "Energy Rating", value: "A+" },
    { trait_type: "Nearby Parks", value: "3 within 1km" },
    { trait_type: "Schools", value: "International School 2km" },
    { trait_type: "Shopping", value: "Mall 1.5km" },
  ],

  media: {
    neighborhood_map: "ipfs://QmPhase0/map.png",
    lot_plan: "ipfs://QmPhase0/lot-plan.pdf",
    drone_video: "ipfs://QmPhase0/drone.mp4",
    floor_plans: "ipfs://QmPhase1/floor-plans.pdf",
    interior_images: [
      "ipfs://QmPhase1/living-room.jpg",
      "ipfs://QmPhase1/kitchen.jpg",
      "ipfs://QmPhase1/master-bedroom.jpg",
      "ipfs://QmPhase1/bathroom.jpg",
    ],
    "3d_walkthrough": "ipfs://QmPhase1/walkthrough.mp4",
    amenity_images: [
      "ipfs://QmPhase2/pool.jpg",
      "ipfs://QmPhase2/gym.jpg",
      "ipfs://QmPhase2/cinema.jpg",
      "ipfs://QmPhase2/wine-cellar.jpg",
      "ipfs://QmPhase2/bbq-area.jpg",
    ],
    smart_home_demo: "ipfs://QmPhase2/automation.mp4",
    legal_documents: "ipfs://QmPhase2/legal-docs.pdf",
    property_deed: "ipfs://QmPhase2/deed.pdf",
    warranties: "ipfs://QmPhase2/warranties.pdf",
    certificates: "ipfs://QmPhase2/certificates.pdf",
    complete_photo_gallery: "ipfs://QmPhase2/gallery/",
    virtual_tour_360: "ipfs://QmPhase2/tour360.html",
  },

  properties: {
    auction: {
      phase: 3,
      bidding_open: false,
      auction_finalized: true,
      floor_price: 500000,
      highest_bid: 550000,
      bidder_lead: "0x1234...abcd",
    },
    revealed: {
      location: true,
      lot_details: true,
      interior_layout: true,
      amenities: true,
      legal_docs: true,
    },
    final_details: {
      ready_for_transfer: true,
      escrow_ready: true,
      inspections_complete: true,
      owner: "0x5678",
      final_price: 550000,
      sold_on: "2026-02-15T12:00:00Z",
    },
  },
};

const DEFAULT_PHASES: Record<PhaseKey, PhaseConfig> = {
  momento0: {
    title: "Momento 0",
    revealPhaseNumber: 0,
    traits: ["Country", "State", "City", "Neighborhood", "Zone", "View"],
    mediaKeys: ["neighborhood_map", "lot_plan", "drone_video"],
    overrides: {
      name: "Luxury Villa #1 — Preview",
      description: "Inicio de subasta: ubicación general + teaser visual. Lo demás está bloqueado (todavía).",
      image: "ipfs://QmPhase0/teaser-hero.jpg",
      animation_url: "ipfs://QmPhase0/teaser.mp4",
    },
  },
  momento1: {
    title: "Momento 1",
    revealPhaseNumber: 1,
    traits: [
      "Lot Size",
      "Orientation",
      "Topography",
      "Total Living Area",
      "Levels",
      "Bedrooms",
      "Bathrooms",
      "Half Baths",
      "Kitchen Type",
      "Living Rooms",
      "Dining Areas",
      "Balconies",
      "Study/Office",
      "Parking",
    ],
    mediaKeys: ["floor_plans", "interior_images", "3d_walkthrough"],
    overrides: {
      name: "Luxury Villa #1 — Layout Reveal",
      description: "Se revela distribución, metraje y primeros interiores. Ya huele a mansión, pero falta la magia.",
      image: "ipfs://QmPhase1/layout-hero.jpg",
      animation_url: "ipfs://QmPhase1/walkthrough.mp4",
    },
  },
  momento2: {
    title: "Momento 2",
    revealPhaseNumber: 2,
    traits: [
      "Pool Type",
      "Pool Size",
      "Gym",
      "Cinema",
      "Wine Cellar",
      "BBQ Area",
      "Garden",
      "Social Area",
      "Smart Home",
      "Security System",
      "Solar Panels",
      "Water Treatment",
      "Utilities",
      "Internet",
      "Energy Rating",
      "Nearby Parks",
      "Schools",
      "Shopping",
    ],
    mediaKeys: ["amenity_images", "smart_home_demo", "complete_photo_gallery", "virtual_tour_360"],
    overrides: {
      name: "Luxury Villa #1 — Amenities Reveal",
      description: "Se desbloquean zonas comunes, automatización y tour 360. Ya esto es “final boss”.",
      image: "ipfs://QmPhase2/amenities-hero.jpg",
      animation_url: "ipfs://QmPhase2/automation.mp4",
    },
  },
  momento3: {
    title: "Momento 3",
    revealPhaseNumber: 3,
    traits: [
      "Reveal Phase",
      "Revealed",
      "Status",
      "Address",
      "Year Built",
      "Property ID",
      "Legal Status",
      "Zoning",
      "Property Tax/Year",
      "HOA Fees/Month",
      "Warranty",
    ],
    mediaKeys: ["legal_documents", "property_deed", "warranties", "certificates"],
    overrides: {
      name: "Luxury Villa #1 - Complete Property",
      description: "Subasta finalizada: documentación legal y garantías reveladas. Listo para transferencia.",
      image: "ipfs://QmPhase3/complete-hero.jpg",
      animation_url: "ipfs://QmPhase3/complete-tour.mp4",
    },
  },
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function uniq(xs: string[]) {
  return Array.from(new Set(xs));
}

// Elimina display_type SIEMPRE en export
function stripDisplayType(attr: Trait): { trait_type: string; value: string | number } {
  return { trait_type: attr.trait_type, value: attr.value };
}

export default function AdminRevealPage() {
  const [meta, setMeta] = useState<AuctionMeta>(BASE_META);
  const [phases, setPhases] = useState<Record<PhaseKey, PhaseConfig>>(DEFAULT_PHASES);
  const [activePhase, setActivePhase] = useState<PhaseKey>("momento0");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState<{
    cid: string;
    ipfsUrl: string;
    gatewayUrl: string;
    name: string;
  } | null>(null);

  // Load localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeJsonParse<{ meta: AuctionMeta; phases: Record<PhaseKey, PhaseConfig> }>(raw);
    if (parsed?.meta && parsed?.phases) {
      setMeta(parsed.meta);
      setPhases(parsed.phases);
    }
  }, []);

  // Save localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, phases }));
  }, [meta, phases]);

  const allTraitTypes = useMemo(() => {
    const types = meta.attributes.map((a) => a.trait_type);
    return uniq(types).sort((a, b) => a.localeCompare(b));
  }, [meta.attributes]);

  const mediaKeys = useMemo(() => {
    return Object.keys(meta.media || {}).sort((a, b) => a.localeCompare(b));
  }, [meta.media]);

  const filteredTraits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTraitTypes;
    return allTraitTypes.filter((t) => t.toLowerCase().includes(q));
  }, [allTraitTypes, search]);

  const filteredMediaKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mediaKeys;
    return mediaKeys.filter((k) => k.toLowerCase().includes(q));
  }, [mediaKeys, search]);

  const phase = phases[activePhase];

  function toggleTrait(traitType: string) {
    setPhases((p) => {
      const cur = p[activePhase];
      const has = cur.traits.includes(traitType);
      const nextTraits = has ? cur.traits.filter((x) => x !== traitType) : [...cur.traits, traitType];

      const nextOverrides = { ...(cur.traitOverrides || {}) };
      if (has) delete nextOverrides[traitType];

      return {
        ...p,
        [activePhase]: {
          ...cur,
          traits: uniq(nextTraits),
          traitOverrides: Object.keys(nextOverrides).length ? nextOverrides : undefined,
        },
      };
    });
  }

  function toggleMediaKey(key: string) {
    setPhases((p) => {
      const cur = p[activePhase];
      const has = cur.mediaKeys.includes(key);
      const nextKeys = has ? cur.mediaKeys.filter((x) => x !== key) : [...cur.mediaKeys, key];
      return { ...p, [activePhase]: { ...cur, mediaKeys: uniq(nextKeys) } };
    });
  }

  function onDragStart(e: React.DragEvent, payload: any) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  function onDropToPhase(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    const payload = safeJsonParse<{ kind: "trait" | "media"; value: string }>(raw);
    if (!payload) return;
    if (payload.kind === "trait") toggleTrait(payload.value);
    if (payload.kind === "media") toggleMediaKey(payload.value);
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  // ----- Trait editing (per phase) -----
  function getBaseTrait(traitType: string): Trait | undefined {
    return meta.attributes.find((a) => a.trait_type === traitType);
  }

  function getEffectiveTrait(traitType: string): TraitDraft | null {
    const base = getBaseTrait(traitType);
    if (!base) return null;
    const ov = phases[activePhase].traitOverrides?.[traitType];
    return {
      trait_type: traitType,
      value: ov?.value ?? base.value,
    };
  }

  function setTraitOverride(traitType: string, value: string | number) {
    setPhases((p) => {
      const cur = p[activePhase];
      const base = meta.attributes.find((a) => a.trait_type === traitType);
      if (!base) return p;

      const next: TraitDraft = { trait_type: traitType, value };

      return {
        ...p,
        [activePhase]: {
          ...cur,
          traitOverrides: {
            ...(cur.traitOverrides || {}),
            [traitType]: next,
          },
        },
      };
    });
  }

  function clearTraitOverride(traitType: string) {
    setPhases((p) => {
      const cur = p[activePhase];
      const map = { ...(cur.traitOverrides || {}) };
      delete map[traitType];
      return {
        ...p,
        [activePhase]: {
          ...cur,
          traitOverrides: Object.keys(map).length ? map : undefined,
        },
      };
    });
  }

  function buildPhaseMetadata(key: PhaseKey): AuctionMeta {
    const cfg = phases[key];

    // Reveal Phase SIEMPRE (sin display_type en export)
    const revealPhaseTrait: Trait = {
      trait_type: "Reveal Phase",
      value: cfg.revealPhaseNumber,
    };

    const attributesFiltered: Trait[] = meta.attributes
      .filter((a) => cfg.traits.includes(a.trait_type))
      .filter((a) => a.trait_type !== "Reveal Phase")
      .map((a) => {
        const ov = cfg.traitOverrides?.[a.trait_type];
        if (!ov) return { trait_type: a.trait_type, value: a.value }; // strip display_type
        return { trait_type: a.trait_type, value: ov.value }; // strip display_type
      });

    const attributes = [revealPhaseTrait, ...attributesFiltered].map(stripDisplayType);

    const media: Media = {};
    for (const k of cfg.mediaKeys) media[k] = meta.media?.[k];

    const revealedLocation = !!cfg.traits.some((t) =>
      ["Country", "State", "City", "Neighborhood", "Zone", "Address"].includes(t)
    );
    const revealedLot = !!cfg.traits.some((t) => ["Lot Size", "Orientation", "Topography"].includes(t));
    const revealedInterior = !!cfg.mediaKeys.some((k) =>
      ["floor_plans", "interior_images", "3d_walkthrough"].includes(k)
    );
    const revealedAmenities = !!cfg.mediaKeys.some((k) =>
      ["amenity_images", "smart_home_demo", "virtual_tour_360"].includes(k)
    );
    const revealedLegal = !!cfg.mediaKeys.some((k) =>
      ["legal_documents", "property_deed", "warranties", "certificates"].includes(k)
    );

    return {
      ...meta,
      ...cfg.overrides,
      // ⚠️ aquí ya viene sin display_type
      attributes: attributes as any,
      media,
      properties: {
        ...meta.properties,
        auction: {
          ...(meta.properties?.auction || {}),
          phase: cfg.revealPhaseNumber,
        },
        revealed: {
          ...(meta.properties?.revealed || {}),
          location: revealedLocation,
          lot_details: revealedLot,
          interior_layout: revealedInterior,
          amenities: revealedAmenities,
          legal_docs: revealedLegal,
        },
      },
    };
  }

  const activePreview = useMemo(() => buildPhaseMetadata(activePhase), [activePhase, phases, meta]);

  // Altura usable para paneles con scroll (evita que se “estire feo”)
  const panelHeight = "h-[calc(100vh-170px)]";

  async function uploadJsonToIpfs(name: string, content: any) {
    setUploading(true);
    setUploadError("");
    try {
      const response = await fetch("/api/pinata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          content,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error || data?.message || "No se pudo subir a IPFS.";
        setUploadError(msg);
        return;
      }

      setUploadResult({
        cid: data.cid,
        ipfsUrl: data.ipfsUrl,
        gatewayUrl: data.gatewayUrl,
        name,
      });
    } catch (error: any) {
      setUploadError(error?.message || "No se pudo subir a IPFS.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-[1400px] px-3 py-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-neutral-400">Admin · Progressive Reveal</div>
            <h1 className="text-xl font-semibold tracking-tight">Fases (Momento 0 → 3)</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Arrastra traits/media, edita valores y exporta JSON por fase (sin display_type).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setMeta(BASE_META);
                setPhases(DEFAULT_PHASES);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
            >
              Reset
            </button>

            <button
              onClick={() => downloadJson("base_meta.json", meta)}
              className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
            >
              Descargar base JSON
            </button>

            <button
              onClick={() => {
                const bundle = {
                  generated_at: new Date().toISOString(),
                  phases: {
                    momento0: buildPhaseMetadata("momento0"),
                    momento1: buildPhaseMetadata("momento1"),
                    momento2: buildPhaseMetadata("momento2"),
                    momento3: buildPhaseMetadata("momento3"),
                  },
                };
                downloadJson("reveal_bundle.json", bundle);
              }}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium hover:bg-emerald-500"
            >
              Exportar bundle (4 fases)
            </button>

            <button
              onClick={() => {
                const bundle = {
                  generated_at: new Date().toISOString(),
                  phases: {
                    momento0: buildPhaseMetadata("momento0"),
                    momento1: buildPhaseMetadata("momento1"),
                    momento2: buildPhaseMetadata("momento2"),
                    momento3: buildPhaseMetadata("momento3"),
                  },
                };
                uploadJsonToIpfs("reveal_bundle.json", bundle);
              }}
              className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-medium hover:bg-cyan-600 disabled:opacity-60"
              disabled={uploading}
            >
              {uploading ? "Subiendo..." : "Subir a IPFS"}
            </button>
          </div>
        </header>

        {(uploadResult || uploadError) && (
          <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-sm font-medium text-neutral-200">IPFS (Pinata)</div>
            {uploadError && (
              <div className="mt-2 text-xs text-red-300">{uploadError}</div>
            )}
            {uploadResult && (
              <div className="mt-2 grid gap-1 text-xs text-neutral-300">
                <div>
                  <span className="text-neutral-500">Archivo:</span> {uploadResult.name}
                </div>
                <div>
                  <span className="text-neutral-500">CID:</span> {uploadResult.cid}
                </div>
                <div>
                  <span className="text-neutral-500">IPFS:</span> {uploadResult.ipfsUrl}
                </div>
                <div>
                  <span className="text-neutral-500">Gateway:</span>{" "}
                  <a
                    href={uploadResult.gatewayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:underline"
                  >
                    {uploadResult.gatewayUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* LEFT: fases + overrides */}
          <aside className={clsx("xl:col-span-3", panelHeight)}>
            <div className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <div className="h-full overflow-auto p-3">
                <div className="text-sm font-medium text-neutral-200">Fases</div>

                <div className="mt-2 grid gap-2">
                  {(["momento0", "momento1", "momento2", "momento3"] as PhaseKey[]).map((k) => {
                    const cfg = phases[k];
                    const active = k === activePhase;
                    return (
                      <button
                        key={k}
                        onClick={() => setActivePhase(k)}
                        className={clsx(
                          "rounded-lg border px-3 py-2 text-left transition",
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-neutral-800 bg-neutral-950/30 hover:bg-neutral-950/60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{cfg.title}</div>
                          <span className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200">
                            phase {cfg.revealPhaseNumber}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-neutral-400">
                          Traits: {cfg.traits.length} · Media: {cfg.mediaKeys.length}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-neutral-800 pt-3">
                  <div className="text-sm font-medium text-neutral-200">Overrides del momento</div>

                  <div className="mt-2 grid gap-2">
                    <label className="text-[11px] text-neutral-400">Name</label>
                    <input
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                      value={phase.overrides?.name ?? ""}
                      onChange={(e) =>
                        setPhases((p) => ({
                          ...p,
                          [activePhase]: {
                            ...p[activePhase],
                            overrides: { ...(p[activePhase].overrides || {}), name: e.target.value },
                          },
                        }))
                      }
                      placeholder="Nombre para esta fase"
                    />

                    <label className="text-[11px] text-neutral-400">Description</label>
                    <textarea
                      className="min-h-[70px] w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                      value={phase.overrides?.description ?? ""}
                      onChange={(e) =>
                        setPhases((p) => ({
                          ...p,
                          [activePhase]: {
                            ...p[activePhase],
                            overrides: { ...(p[activePhase].overrides || {}), description: e.target.value },
                          },
                        }))
                      }
                      placeholder="Descripción para esta fase"
                    />

                    <label className="text-[11px] text-neutral-400">Image (IPFS)</label>
                    <input
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                      value={phase.overrides?.image ?? ""}
                      onChange={(e) =>
                        setPhases((p) => ({
                          ...p,
                          [activePhase]: {
                            ...p[activePhase],
                            overrides: { ...(p[activePhase].overrides || {}), image: e.target.value },
                          },
                        }))
                      }
                      placeholder="ipfs://..."
                    />

                    <label className="text-[11px] text-neutral-400">Animation (IPFS)</label>
                    <input
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                      value={phase.overrides?.animation_url ?? ""}
                      onChange={(e) =>
                        setPhases((p) => ({
                          ...p,
                          [activePhase]: {
                            ...p[activePhase],
                            overrides: { ...(p[activePhase].overrides || {}), animation_url: e.target.value },
                          },
                        }))
                      }
                      placeholder="ipfs://..."
                    />

                    <button
                      onClick={() => downloadJson(`${activePhase}.json`, buildPhaseMetadata(activePhase))}
                      className="mt-1 w-full rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
                    >
                      Descargar JSON de este momento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* MIDDLE: inventario */}
          <section className={clsx("xl:col-span-4", panelHeight)}>
            <div className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800 p-3">
                <div>
                  <div className="text-sm font-medium text-neutral-200">Inventario</div>
                  <div className="text-[11px] text-neutral-400">Arrastra o marca lo que se revela en {phase.title}.</div>
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="w-[170px] rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="h-full overflow-auto p-3">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-sm font-medium">Traits</div>
                  <div className="mt-2 grid gap-2">
                    {filteredTraits.map((t) => {
                      const picked = phase.traits.includes(t);
                      return (
                        <div
                          key={t}
                          draggable
                          onDragStart={(e) => onDragStart(e, { kind: "trait", value: t })}
                          className={clsx(
                            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs",
                            picked
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40"
                          )}
                        >
                          <div className="min-w-0 truncate">{t}</div>
                          <button
                            onClick={() => toggleTrait(t)}
                            className={clsx(
                              "rounded-md px-2 py-1 text-[11px]",
                              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
                            )}
                          >
                            {picked ? "Incluido" : "Añadir"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-sm font-medium">Media (keys)</div>
                  <div className="mt-2 grid gap-2">
                    {filteredMediaKeys.map((k) => {
                      const picked = phase.mediaKeys.includes(k);
                      return (
                        <div
                          key={k}
                          draggable
                          onDragStart={(e) => onDragStart(e, { kind: "media", value: k })}
                          className={clsx(
                            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs",
                            picked
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : "border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40"
                          )}
                        >
                          <div className="min-w-0 truncate">{k}</div>
                          <button
                            onClick={() => toggleMediaKey(k)}
                            className={clsx(
                              "rounded-md px-2 py-1 text-[11px]",
                              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
                            )}
                          >
                            {picked ? "Incluido" : "Añadir"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: editor + preview */}
          <section className={clsx("xl:col-span-5", panelHeight)}>
            <div
              onDrop={onDropToPhase}
              onDragOver={allowDrop}
              className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50"
            >
              <div className="flex items-start justify-between gap-2 border-b border-neutral-800 p-3">
                <div>
                  <div className="text-sm font-medium text-neutral-200">Dropzone · {phase.title}</div>
                  <div className="text-[11px] text-neutral-400">Suelta aquí traits/media para agregarlos a esta fase.</div>
                </div>
                <span className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200">
                  phase {phase.revealPhaseNumber}
                </span>
              </div>

              <div className="h-full overflow-auto p-3">
                {/* Traits editor */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-sm font-medium">Incluye Traits (editable)</div>

                  <div className="mt-2 grid gap-2">
                    {phase.traits.length === 0 ? (
                      <span className="text-xs text-neutral-500">Nada aún… suelta algo acá.</span>
                    ) : (
                      phase.traits
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((t) => {
                          const eff = getEffectiveTrait(t);
                          const base = getBaseTrait(t);
                          const hasOverride = !!phase.traitOverrides?.[t];
                          if (!eff || !base) return null;

                          return (
                            <div key={t} className="rounded-lg border border-neutral-800 bg-neutral-950/20 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-semibold">{t}</div>
                                  <div className="mt-1 text-[11px] text-neutral-500">
                                    Base: <span className="text-neutral-200">{String(base.value)}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleTrait(t)}
                                    className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] hover:bg-neutral-700"
                                    title="Quitar de esta fase"
                                  >
                                    Quitar
                                  </button>
                                  <button
                                    onClick={() => clearTraitOverride(t)}
                                    disabled={!hasOverride}
                                    className={clsx(
                                      "rounded-md px-2 py-1 text-[11px]",
                                      hasOverride ? "bg-amber-600 hover:bg-amber-500" : "bg-neutral-900 text-neutral-600"
                                    )}
                                    title="Volver al valor base"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </div>

                              <div className="mt-2">
                                <label className="text-[11px] text-neutral-400">Value</label>
                                <input
                                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                                  value={String(eff.value)}
                                  onChange={(e) => {
                                    // Si el base es number, guardamos number; si no, string.
                                    const raw = e.target.value;
                                    if (typeof base.value === "number") {
                                      const num = Number(raw);
                                      setTraitOverride(t, Number.isFinite(num) ? num : 0);
                                    } else {
                                      setTraitOverride(t, raw);
                                    }
                                  }}
                                />
                              </div>

                              <div className="mt-2 text-[11px]">
                                {hasOverride ? (
                                  <span className="text-emerald-400">Editado en {phase.title} ✓</span>
                                ) : (
                                  <span className="text-neutral-500">Usando valor base</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Media includes */}
                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="text-sm font-medium">Incluye Media</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {phase.mediaKeys.length === 0 ? (
                      <span className="text-xs text-neutral-500">Nada aún… suelta algo acá.</span>
                    ) : (
                      phase.mediaKeys
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((k) => (
                          <button
                            key={k}
                            onClick={() => toggleMediaKey(k)}
                            className="rounded-lg border border-neutral-800 bg-neutral-950/20 px-2 py-1 text-[11px] hover:bg-neutral-950/40"
                            title="Quitar"
                          >
                            {k} ✕
                          </button>
                        ))
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">Preview JSON (fase)</div>
                    <button
                      onClick={() => downloadJson(`${activePhase}.json`, activePreview)}
                      className="rounded-lg bg-neutral-800 px-3 py-2 text-[11px] hover:bg-neutral-700"
                    >
                      Descargar
                    </button>
                  </div>

                  <pre className="mt-2 max-h-[320px] overflow-auto rounded-lg border border-neutral-800 bg-neutral-950/50 p-3 text-[11px] text-neutral-200">
{JSON.stringify(activePreview, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Base mini */}
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
          <div className="text-sm font-medium text-neutral-200">Base JSON (global)</div>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <label className="text-[11px] text-neutral-400">external_url</label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                value={meta.external_url ?? ""}
                onChange={(e) => setMeta((m) => ({ ...m, external_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400">properties.auction.floor_price</label>
              <input
                className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                value={String(meta.properties?.auction?.floor_price ?? "")}
                onChange={(e) =>
                  setMeta((m) => ({
                    ...m,
                    properties: {
                      ...m.properties,
                      auction: {
                        ...(m.properties?.auction || {}),
                        floor_price: Number(e.target.value || 0),
                      },
                    },
                  }))
                }
                placeholder="500000"
              />
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-[11px] text-neutral-500">
          Admin reveal builder · compacto, usable, y sin display_type (como Dios manda).
        </footer>
      </div>
    </div>
  );
}
