import type { AuctionMeta, Trait } from "@/app/components/PhaseMetadataBuilder";

export type { AuctionMeta, Trait };

// ============ IPFS ============

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) return IPFS_GATEWAY + uri.slice(7);
  return uri;
}

// ============ FETCH METADATA ============

export async function fetchNFTMetadataFull(tokenURI: string): Promise<AuctionMeta | null> {
  try {
    const url = ipfsToHttp(tokenURI);
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name ?? "",
      description: data.description ?? "",
      image: data.image ?? "",
      external_url: data.external_url,
      animation_url: data.animation_url,
      attributes: Array.isArray(data.attributes) ? data.attributes : [],
      media: data.media && typeof data.media === "object" ? data.media : {},
      documents: data.documents && typeof data.documents === "object" ? data.documents : {},
      properties: data.properties ?? {},
    } as AuctionMeta;
  } catch {
    return null;
  }
}

// ============ PHASE SECTION MAPPING ============

export type SectionKey = "location" | "interior" | "amenities" | "legal";

export const SECTION_CONFIG: Record<
  SectionKey,
  {
    title: string;
    revealPhase: number;
    traits: string[];
    mediaKeys: string[];
    documentKeys: string[];
  }
> = {
  location: {
    title: "Location & Lot",
    revealPhase: 0,
    traits: ["Country", "State", "City", "Neighborhood", "Zone", "View"],
    mediaKeys: ["lot_plan", "aerial_view", "drone_video"],
    documentKeys: [],
  },
  interior: {
    title: "Interior Layout",
    revealPhase: 1,
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
  },
  amenities: {
    title: "Amenities & Features",
    revealPhase: 2,
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
  },
  legal: {
    title: "Legal & Documents",
    revealPhase: 3,
    traits: ["Address"],
    mediaKeys: [],
    documentKeys: [
      "legal_documents", "property_deed", "warranties",
      "certificates", "complete_photo_gallery", "virtual_tour_360",
    ],
  },
};

export const SECTION_KEYS: SectionKey[] = ["location", "interior", "amenities", "legal"];

export function isSectionRevealed(section: SectionKey, currentPhase: number): boolean {
  return currentPhase >= SECTION_CONFIG[section].revealPhase;
}

export function getTraitsForSection(section: SectionKey, attributes: Trait[]): Trait[] {
  const traitNames = SECTION_CONFIG[section].traits;
  return attributes.filter((a) => traitNames.includes(a.trait_type));
}

export function getMediaForSection(section: SectionKey, media: Record<string, string>): Record<string, string> {
  const keys = SECTION_CONFIG[section].mediaKeys;
  const result: Record<string, string> = {};
  for (const k of keys) {
    if (media[k]) result[k] = media[k];
  }
  return result;
}

export function getDocumentsForSection(section: SectionKey, documents: Record<string, string>): Record<string, string> {
  const keys = SECTION_CONFIG[section].documentKeys;
  const result: Record<string, string> = {};
  for (const k of keys) {
    if (documents[k]) result[k] = documents[k];
  }
  return result;
}

export function formatMediaLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const VIDEO_KEYS = new Set(["drone_video", "360_walkthrough", "smart_home_demo"]);

export function isVideoKey(key: string): boolean {
  return VIDEO_KEYS.has(key);
}
