╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 PropertyCard: Phase-Aware NFT Metadata Display          
   
 Context                                                 
                                                        
 The admin side has a PhaseMetadataBuilder that
 constructs rich metadata per reveal phase (location,
 interior, amenities, legal). But the public-facing
 pages only show basic info (name, image, price). The
 metadata schema includes 36+ traits, 17 media keys, and
  6 document keys organized into 4 progressive reveal
 phases — none of this is visually surfaced to users.

 Goal: Create a reusable PropertyCard component that
 renders the full metadata schema with phase-aware
 progressive reveal. Unrevealed sections appear blurred
 with a lock icon. Used on Auctions, Biddings, and
 Properties pages.

 ---
 Step 1: Create app/components/utils.ts

 The existing Card.tsx imports cn from ./utils which
 doesn't exist. Create it:

 export function cn(...classes: (string | false | null |
  undefined)[]): string {
   return classes.filter(Boolean).join(" ");
 }

 ---
 Step 2: Create lib/metadata.ts — Shared Types &
 Utilities

 Centralizes duplicated logic across pages.

 Contents:
 - Re-export AuctionMeta, Trait types from
 PhaseMetadataBuilder.tsx
 - IPFS_GATEWAY constant (use Pinata:
 https://gateway.pinata.cloud/ipfs/)
 - ipfsToHttp(uri) — converts ipfs:// URIs (currently
 duplicated in auctions + properties pages with
 different gateways)
 - fetchNFTMetadataFull(tokenURI) — fetches and returns
 full AuctionMeta or null
 - Phase-to-section mapping constants (derived from
 DEFAULT_PHASES in PhaseMetadataBuilder):
 Phase: 0
 Section: Location
 Traits: Country, State, City, Neighborhood, Zone, View
 Media: lot_plan, aerial_view, drone_video
 ────────────────────────────────────────
 Phase: 1
 Section: Interior
 Traits: Lot Size, Orientation, ..., Parking (17 traits)
 Media: floor_plans, interior_*, 360_walkthrough
 ────────────────────────────────────────
 Phase: 2
 Section: Amenities
 Traits: Pool Type, Gym, Cinema, ... (12 traits)
 Media: amenities_images_*, smart_home_demo
 ────────────────────────────────────────
 Phase: 3
 Section: Legal
 Traits: Address
 Media: legal_documents, property_deed, warranties,
   certificates, complete_photo_gallery,
   virtual_tour_360
 - isSectionRevealed(section, currentPhase) — returns
 true if phase >= section's reveal phase
 - getTraitsForSection(section, attributes) — filters
 attributes to a specific section
 - formatMediaLabel(key) — "aerial_view" → "Aerial View"

 Files to deduplicate from:
 - app/auctions/page.tsx lines 128-155 (fetchNFTMetadata
  + IPFS conversion via ipfs.io)
 - app/properties/page.tsx lines 72-76 (ipfsToHttp via
 Pinata gateway)

 ---
 Step 3: Create app/components/PropertyCard.tsx

 Props

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
 };

 Sub-components (all internal to the file)

 IpfsImage — <img> with IPFS URI conversion,
 loading="lazy", fallback on error

 LockedOverlay — The blur/lock UI for unrevealed
 sections:
 - Content area rendered with blur-md select-none
 pointer-events-none
 - Overlay: dark semi-transparent bg + lock SVG icon +
 "Revealed in Phase X" text
 - Shows skeleton placeholder content (gray trait pills,
  gray image rectangles) so the blurred shape hints at
 what's coming

 TraitGrid — Renders an array of traits as a responsive
 grid of key-value cells:
 - Each cell: trait_type as small muted label, value as
 prominent text
 - Grid: 2-col on mobile, 3-col on desktop
 - Styled with existing pattern: bg-black/30 border
 border-white/[0.08] rounded-xl

 MediaGallery — Grid of IPFS image/video thumbnails:
 - 3-col grid of rounded image thumbnails
 - Video keys (drone_video, 360_walkthrough,
 smart_home_demo) get a play icon overlay
 - Each thumbnail shows the media label below it

 DocumentList — List of document links:
 - Each document: icon + label + "View" link pointing to
  IPFS gateway URL
 - Only renders documents with non-empty values

 RevealSection — Wraps content per phase section:
 - If isSectionRevealed(section, currentPhase) → renders
  children normally
 - If not → renders children wrapped in LockedOverlay
 - Section header with title (e.g. "Location & Lot",
 "Interior Layout")

 Variant Behaviors

 compact (Auctions grid cards — replaces current inline
 JSX):
 - Hero image (170px) with status badge + phase badge
 overlay
 - Title + location (from Location traits: City,
 Neighborhood)
 - Price pill (currentHighBid or floorPrice)
 - Bidder count + leader row
 - PhaseProgressBar compact
 - "Place Bid" / "View Details" CTA
 - Key revealed traits shown as small pills below the
 image (e.g., "3 Bed · 2 Bath · Pool")
 - Unrevealed trait summary: small muted text "More
 details in Phase X"

 detail (Biddings page — full property view):
 - Large hero image with phase badge
 - Title, description
 - 4 sections using RevealSection:
   - Location & Lot → TraitGrid + MediaGallery
   - Interior Layout → TraitGrid + MediaGallery
   - Amenities & Features → TraitGrid + MediaGallery
   - Legal & Documents → TraitGrid (Address) +
 DocumentList
 - PhaseProgressBar expanded
 - Each unrevealed section blurred with lock

 token (Properties page — mid-detail token card):
 - Token ID header + phase badge
 - PhaseProgressBar expanded
 - Owner + tokenURI info
 - 4 sections with reveal/lock (more compact than
 detail)
 - Expandable phase URIs section (preserve existing
 properties page UX)

 ---
 Step 4: Integrate on Auctions Page

 File: app/auctions/page.tsx

 Changes:
 1. Import fetchNFTMetadataFull from lib/metadata.ts
 (replace local fetchNFTMetadata)
 2. Store full AuctionMeta in the AuctionData type (add
 metadata?: AuctionMeta | null)
 3. Replace inline card JSX (lines 555-631) with
 <PropertyCard variant="compact" />
 4. Keep existing data fetching via
 publicClient.multicall — just pass the fetched metadata
  through

 ---
 Step 5: Integrate on Biddings Page

 File: app/biddings/page.tsx

 Changes:
 1. Add metadata state: const [propertyMeta,
 setPropertyMeta] = useState<AuctionMeta | null>(null)
 2. In refreshData, after reading auction params, also
 read nftContract + tokenId from the auction, then
 tokenURI from the NFT, then fetch the metadata JSON
 3. Insert <PropertyCard variant="detail" /> above the
 existing "Auction Status" card, spanning full width of
 the left column
 4. Pass auctionData from existing state variables

 ---
 Step 6: Integrate on Properties Page

 File: app/properties/page.tsx

 Changes:
 1. Import shared ipfsToHttp and fetchNFTMetadataFull
 from lib/metadata.ts
 2. Add metadata?: AuctionMeta | null to TokenData type
 3. After fetching token data, fetch and parse tokenURI
 metadata for each token
 4. Replace inline token card JSX (lines 280-398) with
 <PropertyCard variant="token" />

 ---
 Files Summary
 File: app/components/utils.ts
 Action: Create (~5 lines) — fixes existing Card.tsx
   import
 ────────────────────────────────────────
 File: lib/metadata.ts
 Action: Create (~100 lines) — types, IPFS helpers,
 phase
    mappings
 ────────────────────────────────────────
 File: app/components/PropertyCard.tsx
 Action: Create (~400-500 lines) — main component +
   sub-components
 ────────────────────────────────────────
 File: app/auctions/page.tsx
 Action: Modify — swap inline card for PropertyCard
   compact
 ────────────────────────────────────────
 File: app/biddings/page.tsx
 Action: Modify — add metadata fetch + PropertyCard
   detail
 ────────────────────────────────────────
 File: app/properties/page.tsx
 Action: Modify — swap inline card for PropertyCard
 token
 Execution order: Steps 1-3 (infrastructure + component)
  → Step 4 (auctions) → Step 5 (biddings) → Step 6
 (properties)

 ---
 Verification

 1. npm run build succeeds
 2. Auctions page: cards render with property images,
 traits, phase indicators; clicking navigates to
 biddings
 3. Biddings page: property detail section shows
 metadata sections; unrevealed phases show
 blurred/locked
 4. Properties page: token cards show metadata with
 phase-aware reveal
 5. Unrevealed sections: blur overlay visible with lock
 icon and "Revealed in Phase X" text
 6. IPFS images load correctly (Pinata gateway)
 7. Fallback image shows when metadata/image unavailable