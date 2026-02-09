"use client";

import React, { useEffect, useMemo, useState } from "react";

// ============ TYPES ============

export type Trait = {
  trait_type: string;
  value: string | number;
  display_type?: string;
};

export type AuctionMeta = {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: Trait[];
  media: Record<string, string>;
  documents: Record<string, string>;
  properties: any;
};

export type PhaseKey = "momento0" | "momento1" | "momento2" | "momento3";

export type TraitDraft = {
  trait_type: string;
  value: string | number;
};

export type PhaseConfig = {
  title: string;
  revealPhaseNumber: number;
  traits: string[];
  mediaKeys: string[];
  documentKeys: string[];
  overrides?: Partial<Pick<AuctionMeta, "name" | "description" | "image" | "animation_url">>;
  traitOverrides?: Record<string, TraitDraft>;
};

// ============ CATEGORIES (from metadataschema.json) ============

const TRAIT_CATEGORIES: Record<string, string[]> = {
  Location: [
    "Country", "State", "City", "Neighborhood", "Address",
    "Zone", "Lot Size", "Orientation", "Topography", "View",
  ],
  Interior: [
    "Total Living Area", "Levels", "Bedrooms", "Bathrooms", "Half Baths",
    "Kitchen Type", "Living Rooms", "Dining Areas", "Balconies",
    "Study/Office", "Laundry Room", "Basement", "Attic",
  ],
  Amenities: [
    "Pool Type", "Pool Size", "Gym", "Parking", "Cinema",
    "Wine Cellar", "BBQ Area", "Garden", "Social Area",
    "Smart Home", "Security System", "Solar Panels", "Water Treatment",
  ],
};

const MEDIA_CATEGORIES: Record<string, string[]> = {
  "Location & Lot": ["lot_plan", "aerial_view", "drone_video"],
  "Interior": [
    "floor_plans", "interior_living_room", "interior_kitchen",
    "interior_master_bedroom", "interior_bathroom", "360_walkthrough",
  ],
  "Amenities": [
    "amenities_images_pool", "amenities_images_gym", "amenities_images_cinema",
    "amenities_images_wine_cellar", "amenities_images_bbq_area",
    "amenities_images_garden", "amenities_images_social_area", "smart_home_demo",
  ],
};

const DOCUMENT_KEYS = [
  "legal_documents", "property_deed", "warranties",
  "certificates", "complete_photo_gallery", "virtual_tour_360",
];

// ============ CONSTANTS (EMPTY - user fills everything) ============

export const PHASE_KEYS: PhaseKey[] = ["momento0", "momento1", "momento2", "momento3"];

export const BASE_META: AuctionMeta = {
  name: "",
  description: "",
  image: "",
  external_url: "",
  animation_url: "",
  attributes: [
    // Location
    { trait_type: "Country", value: "" },
    { trait_type: "State", value: "" },
    { trait_type: "City", value: "" },
    { trait_type: "Neighborhood", value: "" },
    { trait_type: "Address", value: "" },
    { trait_type: "Zone", value: "" },
    { trait_type: "Lot Size", value: "" },
    { trait_type: "Orientation", value: "" },
    { trait_type: "Topography", value: "" },
    { trait_type: "View", value: "" },
    // Interior
    { trait_type: "Total Living Area", value: "" },
    { trait_type: "Levels", value: 0 },
    { trait_type: "Bedrooms", value: 0 },
    { trait_type: "Bathrooms", value: 0 },
    { trait_type: "Half Baths", value: 0 },
    { trait_type: "Kitchen Type", value: "" },
    { trait_type: "Living Rooms", value: 0 },
    { trait_type: "Dining Areas", value: 0 },
    { trait_type: "Balconies", value: 0 },
    { trait_type: "Study/Office", value: "" },
    { trait_type: "Laundry Room", value: "" },
    { trait_type: "Basement", value: "" },
    { trait_type: "Attic", value: "" },
    // Amenities
    { trait_type: "Pool Type", value: "" },
    { trait_type: "Pool Size", value: "" },
    { trait_type: "Gym", value: "" },
    { trait_type: "Parking", value: "" },
    { trait_type: "Cinema", value: "" },
    { trait_type: "Wine Cellar", value: "" },
    { trait_type: "BBQ Area", value: "" },
    { trait_type: "Garden", value: "" },
    { trait_type: "Social Area", value: "" },
    { trait_type: "Smart Home", value: "" },
    { trait_type: "Security System", value: "" },
    { trait_type: "Solar Panels", value: "" },
    { trait_type: "Water Treatment", value: "" },
  ],
  media: {
    lot_plan: "",
    aerial_view: "",
    drone_video: "",
    floor_plans: "",
    interior_living_room: "",
    interior_kitchen: "",
    interior_master_bedroom: "",
    interior_bathroom: "",
    "360_walkthrough": "",
    amenities_images_pool: "",
    amenities_images_gym: "",
    amenities_images_cinema: "",
    amenities_images_wine_cellar: "",
    amenities_images_bbq_area: "",
    amenities_images_garden: "",
    amenities_images_social_area: "",
    smart_home_demo: "",
  },
  documents: {
    legal_documents: "",
    property_deed: "",
    warranties: "",
    certificates: "",
    complete_photo_gallery: "",
    virtual_tour_360: "",
  },
  properties: {
    auction: {
      phase: 0,
      bidding_open: false,
      auction_finalized: false,
      floor_price: 0,
      highest_bid: 0,
      bidder_lead: "",
    },
    revealed: {
      location: false,
      lot_details: false,
      interior_layout: false,
      amenities: false,
      legal_docs: false,
    },
    final_details: {
      ready_for_transfer: false,
      escrow_ready: false,
      inspections_complete: false,
      final_legal_review: "",
      owner: "",
      final_price: 0,
      sold_on: "",
    },
  },
};

export const DEFAULT_PHASES: Record<PhaseKey, PhaseConfig> = {
  momento0: {
    title: "Momento 0",
    revealPhaseNumber: 0,
    traits: ["Country", "State", "City", "Neighborhood", "Zone", "View"],
    mediaKeys: ["lot_plan", "aerial_view", "drone_video"],
    documentKeys: [],
    overrides: { name: "", description: "", image: "", animation_url: "" },
  },
  momento1: {
    title: "Momento 1",
    revealPhaseNumber: 1,
    traits: [
      "Lot Size", "Orientation", "Topography", "Total Living Area", "Levels",
      "Bedrooms", "Bathrooms", "Half Baths", "Kitchen Type", "Living Rooms",
      "Dining Areas", "Balconies", "Study/Office", "Laundry Room", "Basement",
      "Attic", "Parking",
    ],
    mediaKeys: [
      "floor_plans", "interior_living_room", "interior_kitchen",
      "interior_master_bedroom", "interior_bathroom", "360_walkthrough",
    ],
    documentKeys: [],
    overrides: { name: "", description: "", image: "", animation_url: "" },
  },
  momento2: {
    title: "Momento 2",
    revealPhaseNumber: 2,
    traits: [
      "Pool Type", "Pool Size", "Gym", "Cinema", "Wine Cellar", "BBQ Area",
      "Garden", "Social Area", "Smart Home", "Security System", "Solar Panels",
      "Water Treatment",
    ],
    mediaKeys: [
      "amenities_images_pool", "amenities_images_gym", "amenities_images_cinema",
      "amenities_images_wine_cellar", "amenities_images_bbq_area",
      "amenities_images_garden", "amenities_images_social_area", "smart_home_demo",
    ],
    documentKeys: [],
    overrides: { name: "", description: "", image: "", animation_url: "" },
  },
  momento3: {
    title: "Momento 3",
    revealPhaseNumber: 3,
    traits: ["Address"],
    mediaKeys: [],
    documentKeys: [
      "legal_documents", "property_deed", "warranties",
      "certificates", "complete_photo_gallery", "virtual_tour_360",
    ],
    overrides: { name: "", description: "", image: "", animation_url: "" },
  },
};

// ============ HELPERS ============

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

function stripDisplayType(attr: Trait): { trait_type: string; value: string | number } {
  return { trait_type: attr.trait_type, value: attr.value };
}

export function buildPhaseMetadata(
  key: PhaseKey,
  meta: AuctionMeta,
  phases: Record<PhaseKey, PhaseConfig>,
): AuctionMeta {
  const cfg = phases[key];

  const revealPhaseTrait: Trait = {
    trait_type: "Reveal Phase",
    value: cfg.revealPhaseNumber,
  };

  const attributesFiltered: Trait[] = meta.attributes
    .filter((a) => cfg.traits.includes(a.trait_type))
    .map((a) => {
      const ov = cfg.traitOverrides?.[a.trait_type];
      if (!ov) return { trait_type: a.trait_type, value: a.value };
      return { trait_type: a.trait_type, value: ov.value };
    });

  const attributes = [revealPhaseTrait, ...attributesFiltered].map(stripDisplayType);

  const media: Record<string, string> = {};
  for (const k of cfg.mediaKeys) {
    if (meta.media[k] !== undefined) media[k] = meta.media[k];
  }

  const documents: Record<string, string> = {};
  for (const k of cfg.documentKeys) {
    if (meta.documents[k] !== undefined) documents[k] = meta.documents[k];
  }

  const revealedLocation = cfg.traits.some((t) =>
    ["Country", "State", "City", "Neighborhood", "Zone", "Address"].includes(t)
  );
  const revealedLot = cfg.traits.some((t) =>
    ["Lot Size", "Orientation", "Topography"].includes(t)
  );
  const revealedInterior = cfg.mediaKeys.some((k) =>
    k.startsWith("interior_") || k === "floor_plans" || k === "360_walkthrough"
  );
  const revealedAmenities = cfg.mediaKeys.some((k) =>
    k.startsWith("amenities_images_") || k === "smart_home_demo"
  );
  const revealedLegal = cfg.documentKeys.some((k) =>
    ["legal_documents", "property_deed", "warranties", "certificates"].includes(k)
  );

  return {
    ...meta,
    ...cfg.overrides,
    attributes: attributes as any,
    media,
    documents,
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

// ============ COMPONENT ============

type PhaseMetadataBuilderProps = {
  singlePhase?: number;
  onUploaded?: (phaseIndex: number, ipfsUri: string, gatewayUrl: string) => void;
};

export default function PhaseMetadataBuilder({
  singlePhase,
  onUploaded,
}: PhaseMetadataBuilderProps) {
  const STORAGE_KEY = "admin_reveal_builder_v5";

  const [meta, setMeta] = useState<AuctionMeta>(BASE_META);
  const [phases, setPhases] = useState<Record<PhaseKey, PhaseConfig>>(DEFAULT_PHASES);
  const [activePhase, setActivePhase] = useState<PhaseKey>(
    singlePhase !== undefined ? PHASE_KEYS[singlePhase] : "momento0"
  );
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] = useState<{
    cid: string;
    ipfsUrl: string;
    gatewayUrl: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (singlePhase !== undefined) {
      setActivePhase(PHASE_KEYS[singlePhase]);
    }
  }, [singlePhase]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = safeJsonParse<{ meta: AuctionMeta; phases: Record<PhaseKey, PhaseConfig> }>(raw);
    if (parsed?.meta && parsed?.phases) {
      setMeta(parsed.meta);
      setPhases(parsed.phases);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, phases }));
  }, [meta, phases]);

  const phase = phases[activePhase];

  // ---- Filtering ----

  function matchesSearch(label: string) {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return label.toLowerCase().includes(q);
  }

  // ---- Base trait value editing ----

  function setBaseTraitValue(traitType: string, value: string | number) {
    setMeta((m) => ({
      ...m,
      attributes: m.attributes.map((a) =>
        a.trait_type === traitType ? { ...a, value } : a
      ),
    }));
  }

  function setMediaValue(key: string, value: string) {
    setMeta((m) => ({ ...m, media: { ...m.media, [key]: value } }));
  }

  function setDocumentValue(key: string, value: string) {
    setMeta((m) => ({ ...m, documents: { ...m.documents, [key]: value } }));
  }

  // ---- Phase toggling ----

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

  function toggleDocumentKey(key: string) {
    setPhases((p) => {
      const cur = p[activePhase];
      const has = cur.documentKeys.includes(key);
      const nextKeys = has ? cur.documentKeys.filter((x) => x !== key) : [...cur.documentKeys, key];
      return { ...p, [activePhase]: { ...cur, documentKeys: uniq(nextKeys) } };
    });
  }

  function onDragStart(e: React.DragEvent, payload: any) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  function onDropToPhase(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    const payload = safeJsonParse<{ kind: string; value: string }>(raw);
    if (!payload) return;
    if (payload.kind === "trait") toggleTrait(payload.value);
    if (payload.kind === "media") toggleMediaKey(payload.value);
    if (payload.kind === "document") toggleDocumentKey(payload.value);
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  function getBaseTrait(traitType: string): Trait | undefined {
    return meta.attributes.find((a) => a.trait_type === traitType);
  }

  function getEffectiveTrait(traitType: string): TraitDraft | null {
    const base = getBaseTrait(traitType);
    if (!base) return null;
    const ov = phases[activePhase].traitOverrides?.[traitType];
    return { trait_type: traitType, value: ov?.value ?? base.value };
  }

  function setTraitOverride(traitType: string, value: string | number) {
    setPhases((p) => {
      const cur = p[activePhase];
      return {
        ...p,
        [activePhase]: {
          ...cur,
          traitOverrides: {
            ...(cur.traitOverrides || {}),
            [traitType]: { trait_type: traitType, value },
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

  const activePreview = useMemo(
    () => buildPhaseMetadata(activePhase, meta, phases),
    [activePhase, phases, meta]
  );

  async function uploadPhaseToIpfs() {
    const phaseData = buildPhaseMetadata(activePhase, meta, phases);
    const name = `${activePhase}.json`;

    setUploading(true);
    setUploadError("");
    try {
      const response = await fetch("/api/pinata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content: phaseData }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadError(data?.error || data?.message || "Failed to upload to IPFS.");
        return;
      }
      setUploadResult({ cid: data.cid, ipfsUrl: data.ipfsUrl, gatewayUrl: data.gatewayUrl, name });
      onUploaded?.(phases[activePhase].revealPhaseNumber, data.ipfsUrl, data.gatewayUrl);
    } catch (error: any) {
      setUploadError(error?.message || "Failed to upload to IPFS.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadBundleToIpfs() {
    const bundle = {
      generated_at: new Date().toISOString(),
      phases: {
        momento0: buildPhaseMetadata("momento0", meta, phases),
        momento1: buildPhaseMetadata("momento1", meta, phases),
        momento2: buildPhaseMetadata("momento2", meta, phases),
        momento3: buildPhaseMetadata("momento3", meta, phases),
      },
    };
    setUploading(true);
    setUploadError("");
    try {
      const response = await fetch("/api/pinata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "reveal_bundle.json", content: bundle }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadError(data?.error || data?.message || "Failed to upload to IPFS.");
        return;
      }
      setUploadResult({ cid: data.cid, ipfsUrl: data.ipfsUrl, gatewayUrl: data.gatewayUrl, name: "reveal_bundle.json" });
    } catch (error: any) {
      setUploadError(error?.message || "Failed to upload to IPFS.");
    } finally {
      setUploading(false);
    }
  }

  // ============ RENDER HELPERS ============

  /** Render a single trait row in the inventory with inline editing */
  function renderTraitRow(t: string) {
    const picked = phase.traits.includes(t);
    const base = getBaseTrait(t);
    const isNum = typeof base?.value === "number";
    const valueStr = String(base?.value ?? "");
    const isEmpty = valueStr === "" || valueStr === "0";

    return (
      <div
        key={t}
        draggable
        onDragStart={(e) => onDragStart(e, { kind: "trait", value: t })}
        className={clsx(
          "rounded-lg border px-3 py-2 text-xs",
          picked ? "border-emerald-500/60 bg-emerald-500/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate font-semibold">{t}</div>
          <button
            onClick={() => toggleTrait(t)}
            className={clsx(
              "shrink-0 rounded-md px-2 py-1 text-[11px]",
              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
            )}
          >
            {picked ? "Included" : "Add"}
          </button>
        </div>
        <div className="mt-1.5">
          <input
            className={clsx(
              "w-full rounded-lg border bg-neutral-950/40 px-3 py-1.5 text-xs outline-none focus:border-emerald-500/60",
              isEmpty ? "border-amber-500/30" : "border-neutral-800"
            )}
            value={valueStr}
            onChange={(e) => {
              const raw = e.target.value;
              if (isNum) {
                const num = Number(raw);
                setBaseTraitValue(t, raw === "" ? 0 : (Number.isFinite(num) ? num : 0));
              } else {
                setBaseTraitValue(t, raw);
              }
            }}
            placeholder={isNum ? "0" : "Enter value..."}
          />
          {isEmpty && <div className="mt-0.5 text-[10px] text-amber-400/60">Value not set</div>}
        </div>
      </div>
    );
  }

  /** Render a media key row */
  function renderMediaRow(k: string) {
    const picked = phase.mediaKeys.includes(k);
    const val = meta.media[k] || "";
    const isEmpty = !val;

    return (
      <div
        key={k}
        draggable
        onDragStart={(e) => onDragStart(e, { kind: "media", value: k })}
        className={clsx(
          "rounded-lg border px-3 py-2 text-xs",
          picked ? "border-emerald-500/60 bg-emerald-500/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate font-semibold">{k}</div>
          <button
            onClick={() => toggleMediaKey(k)}
            className={clsx(
              "shrink-0 rounded-md px-2 py-1 text-[11px]",
              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-neutral-800 hover:bg-neutral-700"
            )}
          >
            {picked ? "Included" : "Add"}
          </button>
        </div>
        <input
          className={clsx(
            "mt-1 w-full rounded-lg border bg-neutral-950/40 px-3 py-1.5 text-xs outline-none focus:border-emerald-500/60",
            isEmpty ? "border-amber-500/30" : "border-neutral-800"
          )}
          value={val}
          onChange={(e) => setMediaValue(k, e.target.value)}
          placeholder="ipfs://..."
        />
        {isEmpty && <div className="mt-0.5 text-[10px] text-amber-400/60">Value not set</div>}
      </div>
    );
  }

  /** Render a document key row */
  function renderDocumentRow(k: string) {
    const picked = phase.documentKeys.includes(k);
    const val = meta.documents[k] || "";
    const isEmpty = !val;

    return (
      <div
        key={k}
        draggable
        onDragStart={(e) => onDragStart(e, { kind: "document", value: k })}
        className={clsx(
          "rounded-lg border px-3 py-2 text-xs",
          picked ? "border-cyan-500/60 bg-cyan-500/10" : "border-neutral-800 bg-neutral-950/20 hover:bg-neutral-950/40"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate font-semibold">{k}</div>
          <button
            onClick={() => toggleDocumentKey(k)}
            className={clsx(
              "shrink-0 rounded-md px-2 py-1 text-[11px]",
              picked ? "bg-cyan-600 hover:bg-cyan-500" : "bg-neutral-800 hover:bg-neutral-700"
            )}
          >
            {picked ? "Included" : "Add"}
          </button>
        </div>
        <input
          className={clsx(
            "mt-1 w-full rounded-lg border bg-neutral-950/40 px-3 py-1.5 text-xs outline-none focus:border-cyan-500/60",
            isEmpty ? "border-amber-500/30" : "border-neutral-800"
          )}
          value={val}
          onChange={(e) => setDocumentValue(k, e.target.value)}
          placeholder="ipfs://..."
        />
        {isEmpty && <div className="mt-0.5 text-[10px] text-amber-400/60">Value not set</div>}
      </div>
    );
  }

  /** Render a category group section */
  function renderCategoryGroup(title: string, items: React.ReactNode[], color: string) {
    if (!items.length) return null;
    return (
      <div className="mt-3 first:mt-0">
        <div className={clsx("text-[11px] font-semibold mb-1.5", color)}>{title}</div>
        <div className="grid gap-1.5">{items}</div>
      </div>
    );
  }

  const isSingleMode = singlePhase !== undefined;
  const panelHeight = isSingleMode ? "" : "h-[calc(100vh-170px)]";

  // ============ RENDER ============

  return (
    <div className={isSingleMode ? "" : "min-h-screen bg-neutral-950 text-neutral-100"}>
      <div className={isSingleMode ? "" : "mx-auto max-w-[1400px] px-3 py-4"}>
        {/* Header (full mode only) */}
        {!isSingleMode && (
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-neutral-400">Admin &middot; Progressive Reveal</div>
              <h1 className="text-xl font-semibold tracking-tight">Fases (Momento 0 &rarr; 3)</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Set trait values, assign traits/media/documents to phases, and upload JSON to IPFS.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setMeta(BASE_META); setPhases(DEFAULT_PHASES); localStorage.removeItem(STORAGE_KEY); }}
                className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
              >
                Reset All
              </button>
              <button
                onClick={() => downloadJson("base_meta.json", meta)}
                className="rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
              >
                Download Base JSON
              </button>
              <button
                onClick={() => {
                  const bundle = {
                    generated_at: new Date().toISOString(),
                    phases: {
                      momento0: buildPhaseMetadata("momento0", meta, phases),
                      momento1: buildPhaseMetadata("momento1", meta, phases),
                      momento2: buildPhaseMetadata("momento2", meta, phases),
                      momento3: buildPhaseMetadata("momento3", meta, phases),
                    },
                  };
                  downloadJson("reveal_bundle.json", bundle);
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium hover:bg-emerald-500"
              >
                Export Bundle (4 phases)
              </button>
              <button
                onClick={uploadBundleToIpfs}
                className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-medium hover:bg-cyan-600 disabled:opacity-60"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload to IPFS"}
              </button>
            </div>
          </header>
        )}

        {/* Upload result / error */}
        {(uploadResult || uploadError) && (
          <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="text-sm font-medium text-neutral-200">IPFS (Pinata)</div>
            {uploadError && <div className="mt-2 text-xs text-red-300">{uploadError}</div>}
            {uploadResult && (
              <div className="mt-2 grid gap-1 text-xs text-neutral-300">
                <div><span className="text-neutral-500">File:</span> {uploadResult.name}</div>
                <div><span className="text-neutral-500">CID:</span> {uploadResult.cid}</div>
                <div><span className="text-neutral-500">IPFS:</span> {uploadResult.ipfsUrl}</div>
                <div>
                  <span className="text-neutral-500">Gateway:</span>{" "}
                  <a href={uploadResult.gatewayUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">
                    {uploadResult.gatewayUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========= SINGLE PHASE (compact) ========= */}
        {isSingleMode ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {/* Left: Inventory */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 max-h-[500px] overflow-auto">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-sm font-medium">Inventory</div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-[140px] rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs outline-none"
                  />
                </div>

                {/* Trait categories */}
                {Object.entries(TRAIT_CATEGORIES).map(([cat, traits]) => {
                  const filtered = traits.filter(matchesSearch);
                  if (!filtered.length) return null;
                  return renderCategoryGroup(
                    cat,
                    filtered.map((t) => {
                      const picked = phase.traits.includes(t);
                      const base = getBaseTrait(t);
                      const isNum = typeof base?.value === "number";
                      return (
                        <div key={t} className={clsx(
                          "rounded-lg border px-2 py-1.5 text-xs",
                          picked ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/5 bg-white/[0.02]"
                        )}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{t}</span>
                            <button onClick={() => toggleTrait(t)} className={clsx(
                              "shrink-0 rounded px-2 py-0.5 text-[10px]",
                              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20"
                            )}>
                              {picked ? "On" : "Add"}
                            </button>
                          </div>
                          <input
                            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] outline-none focus:border-cyan-500/50"
                            value={String(base?.value ?? "")}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (isNum) {
                                const num = Number(raw);
                                setBaseTraitValue(t, raw === "" ? 0 : (Number.isFinite(num) ? num : 0));
                              } else {
                                setBaseTraitValue(t, raw);
                              }
                            }}
                            placeholder={isNum ? "0" : "Enter value..."}
                          />
                        </div>
                      );
                    }),
                    "text-emerald-400"
                  );
                })}

                {/* Media categories */}
                {Object.entries(MEDIA_CATEGORIES).map(([cat, keys]) => {
                  const filtered = keys.filter(matchesSearch);
                  if (!filtered.length) return null;
                  return renderCategoryGroup(
                    `Media: ${cat}`,
                    filtered.map((k) => {
                      const picked = phase.mediaKeys.includes(k);
                      const val = meta.media[k] || "";
                      return (
                        <div key={k} className={clsx(
                          "rounded-lg border px-2 py-1.5 text-xs",
                          picked ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/5 bg-white/[0.02]"
                        )}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{k}</span>
                            <button onClick={() => toggleMediaKey(k)} className={clsx(
                              "shrink-0 rounded px-2 py-0.5 text-[10px]",
                              picked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20"
                            )}>
                              {picked ? "On" : "Add"}
                            </button>
                          </div>
                          <input
                            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] outline-none focus:border-cyan-500/50"
                            value={val}
                            onChange={(e) => setMediaValue(k, e.target.value)}
                            placeholder="ipfs://..."
                          />
                        </div>
                      );
                    }),
                    "text-blue-400"
                  );
                })}

                {/* Documents */}
                {(() => {
                  const filtered = DOCUMENT_KEYS.filter(matchesSearch);
                  if (!filtered.length) return null;
                  return renderCategoryGroup(
                    "Documents",
                    filtered.map((k) => {
                      const picked = phase.documentKeys.includes(k);
                      const val = meta.documents[k] || "";
                      return (
                        <div key={k} className={clsx(
                          "rounded-lg border px-2 py-1.5 text-xs",
                          picked ? "border-cyan-500/60 bg-cyan-500/10" : "border-white/5 bg-white/[0.02]"
                        )}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{k}</span>
                            <button onClick={() => toggleDocumentKey(k)} className={clsx(
                              "shrink-0 rounded px-2 py-0.5 text-[10px]",
                              picked ? "bg-cyan-600 hover:bg-cyan-500" : "bg-white/10 hover:bg-white/20"
                            )}>
                              {picked ? "On" : "Add"}
                            </button>
                          </div>
                          <input
                            className="mt-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] outline-none focus:border-cyan-500/50"
                            value={val}
                            onChange={(e) => setDocumentValue(k, e.target.value)}
                            placeholder="ipfs://..."
                          />
                        </div>
                      );
                    }),
                    "text-cyan-400"
                  );
                })()}
              </div>

              {/* Right: Overrides + Preview */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 max-h-[500px] overflow-auto">
                <div className="text-sm font-medium mb-2">Phase Overrides &middot; {phase.title}</div>
                <div className="grid gap-2">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none"
                    value={phase.overrides?.name ?? ""}
                    onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), name: e.target.value } } }))}
                    placeholder="Name for this phase"
                  />
                  <textarea
                    className="min-h-[50px] w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none"
                    value={phase.overrides?.description ?? ""}
                    onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), description: e.target.value } } }))}
                    placeholder="Description for this phase"
                  />
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none"
                    value={phase.overrides?.image ?? ""}
                    onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), image: e.target.value } } }))}
                    placeholder="Image (ipfs://...)"
                  />
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs outline-none"
                    value={phase.overrides?.animation_url ?? ""}
                    onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), animation_url: e.target.value } } }))}
                    placeholder="Animation URL (ipfs://...)"
                  />
                </div>
                <div className="mt-3">
                  <div className="text-xs text-white/50 mb-1">Preview JSON</div>
                  <pre className="max-h-[200px] overflow-auto rounded-lg border border-white/5 bg-black/30 p-2 text-[10px] text-white/70">
                    {JSON.stringify(activePreview, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={uploadPhaseToIpfs}
                disabled={uploading}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : `Build & Upload ${phase.title} to IPFS`}
              </button>
              <button
                onClick={() => downloadJson(`${activePhase}.json`, activePreview)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Download JSON
              </button>
            </div>
          </div>
        ) : (
          /* ========= FULL MODE ========= */
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-12">
              {/* LEFT: phases + overrides */}
              <aside className={clsx("xl:col-span-3", panelHeight)}>
                <div className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
                  <div className="h-full overflow-auto p-3">
                    <div className="text-sm font-medium text-neutral-200">Phases</div>
                    <div className="mt-2 grid gap-2">
                      {PHASE_KEYS.map((k) => {
                        const cfg = phases[k];
                        const active = k === activePhase;
                        return (
                          <button
                            key={k}
                            onClick={() => setActivePhase(k)}
                            className={clsx(
                              "rounded-lg border px-3 py-2 text-left transition",
                              active ? "border-emerald-500/60 bg-emerald-500/10" : "border-neutral-800 bg-neutral-950/30 hover:bg-neutral-950/60"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{cfg.title}</div>
                              <span className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200">
                                phase {cfg.revealPhaseNumber}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-400">
                              Traits: {cfg.traits.length} &middot; Media: {cfg.mediaKeys.length} &middot; Docs: {cfg.documentKeys.length}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 border-t border-neutral-800 pt-3">
                      <div className="text-sm font-medium text-neutral-200">Phase Overrides</div>
                      <div className="mt-2 grid gap-2">
                        <label className="text-[11px] text-neutral-400">Name</label>
                        <input
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                          value={phase.overrides?.name ?? ""}
                          onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), name: e.target.value } } }))}
                          placeholder="Name for this phase"
                        />
                        <label className="text-[11px] text-neutral-400">Description</label>
                        <textarea
                          className="min-h-[70px] w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                          value={phase.overrides?.description ?? ""}
                          onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), description: e.target.value } } }))}
                          placeholder="Description for this phase"
                        />
                        <label className="text-[11px] text-neutral-400">Image (IPFS)</label>
                        <input
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                          value={phase.overrides?.image ?? ""}
                          onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), image: e.target.value } } }))}
                          placeholder="ipfs://..."
                        />
                        <label className="text-[11px] text-neutral-400">Animation (IPFS)</label>
                        <input
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                          value={phase.overrides?.animation_url ?? ""}
                          onChange={(e) => setPhases((p) => ({ ...p, [activePhase]: { ...p[activePhase], overrides: { ...(p[activePhase].overrides || {}), animation_url: e.target.value } } }))}
                          placeholder="ipfs://..."
                        />
                        <button
                          onClick={() => downloadJson(`${activePhase}.json`, buildPhaseMetadata(activePhase, meta, phases))}
                          className="mt-1 w-full rounded-lg bg-neutral-800 px-3 py-2 text-xs hover:bg-neutral-700"
                        >
                          Download JSON for this phase
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* MIDDLE: inventory with categories */}
              <section className={clsx("xl:col-span-4", panelHeight)}>
                <div className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-800 p-3">
                    <div>
                      <div className="text-sm font-medium text-neutral-200">Inventory</div>
                      <div className="text-[11px] text-neutral-400">Set values, then drag or toggle to assign to {phase.title}.</div>
                    </div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-[170px] rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                    />
                  </div>
                  <div className="h-full overflow-auto p-3 pb-20">
                    {/* Trait categories */}
                    {Object.entries(TRAIT_CATEGORIES).map(([cat, traits]) => {
                      const filtered = traits.filter(matchesSearch);
                      if (!filtered.length) return null;
                      return (
                        <div key={cat} className="mb-3">
                          <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                            <div className="text-sm font-medium text-emerald-400">{cat}</div>
                            <div className="mt-2 grid gap-2">
                              {filtered.map(renderTraitRow)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Media categories */}
                    {Object.entries(MEDIA_CATEGORIES).map(([cat, keys]) => {
                      const filtered = keys.filter(matchesSearch);
                      if (!filtered.length) return null;
                      return (
                        <div key={cat} className="mb-3">
                          <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                            <div className="text-sm font-medium text-blue-400">Media: {cat}</div>
                            <div className="mt-2 grid gap-2">
                              {filtered.map(renderMediaRow)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Documents */}
                    {(() => {
                      const filtered = DOCUMENT_KEYS.filter(matchesSearch);
                      if (!filtered.length) return null;
                      return (
                        <div className="mb-3">
                          <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                            <div className="text-sm font-medium text-cyan-400">Documents</div>
                            <div className="mt-2 grid gap-2">
                              {filtered.map(renderDocumentRow)}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>

              {/* RIGHT: dropzone + preview */}
              <section className={clsx("xl:col-span-5", panelHeight)}>
                <div
                  onDrop={onDropToPhase}
                  onDragOver={allowDrop}
                  className="h-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-800 p-3">
                    <div>
                      <div className="text-sm font-medium text-neutral-200">Dropzone &middot; {phase.title}</div>
                      <div className="text-[11px] text-neutral-400">Drop traits/media/docs here to add them to this phase.</div>
                    </div>
                    <span className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200">
                      phase {phase.revealPhaseNumber}
                    </span>
                  </div>
                  <div className="h-full overflow-auto p-3 pb-20">
                    {/* Included traits editor */}
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                      <div className="text-sm font-medium">Included Traits (editable per phase)</div>
                      <div className="mt-2 grid gap-2">
                        {phase.traits.length === 0 ? (
                          <span className="text-xs text-neutral-500">No traits assigned yet.</span>
                        ) : (
                          phase.traits.slice().sort((a, b) => a.localeCompare(b)).map((t) => {
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
                                      Base: <span className={String(base.value) ? "text-neutral-200" : "text-amber-400/60"}>{String(base.value) || "(empty)"}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => toggleTrait(t)} className="rounded-md bg-neutral-800 px-2 py-1 text-[11px] hover:bg-neutral-700">Remove</button>
                                    <button
                                      onClick={() => clearTraitOverride(t)}
                                      disabled={!hasOverride}
                                      className={clsx("rounded-md px-2 py-1 text-[11px]", hasOverride ? "bg-amber-600 hover:bg-amber-500" : "bg-neutral-900 text-neutral-600")}
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <label className="text-[11px] text-neutral-400">Value (phase override)</label>
                                  <input
                                    className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs outline-none focus:border-emerald-500/60"
                                    value={String(eff.value)}
                                    onChange={(e) => {
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
                                    <span className="text-emerald-400">Overridden in {phase.title} &#10003;</span>
                                  ) : (
                                    <span className="text-neutral-500">Using base value</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Included media */}
                    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                      <div className="text-sm font-medium">Included Media</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {phase.mediaKeys.length === 0 ? (
                          <span className="text-xs text-neutral-500">No media assigned yet.</span>
                        ) : (
                          phase.mediaKeys.slice().sort((a, b) => a.localeCompare(b)).map((k) => (
                            <button key={k} onClick={() => toggleMediaKey(k)} className="rounded-lg border border-neutral-800 bg-neutral-950/20 px-2 py-1 text-[11px] hover:bg-neutral-950/40" title="Remove">
                              {k} &#10005;
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Included documents */}
                    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                      <div className="text-sm font-medium">Included Documents</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {phase.documentKeys.length === 0 ? (
                          <span className="text-xs text-neutral-500">No documents assigned yet.</span>
                        ) : (
                          phase.documentKeys.slice().sort((a, b) => a.localeCompare(b)).map((k) => (
                            <button key={k} onClick={() => toggleDocumentKey(k)} className="rounded-lg border border-cyan-800/50 bg-cyan-950/20 px-2 py-1 text-[11px] hover:bg-cyan-950/40" title="Remove">
                              {k} &#10005;
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">Preview JSON (phase)</div>
                        <button
                          onClick={() => downloadJson(`${activePhase}.json`, activePreview)}
                          className="rounded-lg bg-neutral-800 px-3 py-2 text-[11px] hover:bg-neutral-700"
                        >
                          Download
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

            {/* Base JSON global settings */}
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
                        properties: { ...m.properties, auction: { ...(m.properties?.auction || {}), floor_price: Number(e.target.value || 0) } },
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <footer className="py-4 text-center text-[11px] text-neutral-500">
              Admin reveal builder &middot; Set your own values, build JSON, upload to IPFS.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
