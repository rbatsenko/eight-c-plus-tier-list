import type { TierId } from "./types";

export type TierDef = {
  id: TierId;
  label: string;
  /** Tailwind classes for the tier's label block. */
  swatch: string;
  accent: string;
};

export const TIERS: TierDef[] = [
  {
    id: "S",
    label: "S",
    swatch: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
    accent: "border-amber-400/40",
  },
  {
    id: "A",
    label: "A",
    swatch: "bg-gradient-to-br from-rose-400 to-rose-600 text-rose-950",
    accent: "border-rose-400/40",
  },
  {
    id: "B",
    label: "B",
    swatch: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950",
    accent: "border-orange-400/40",
  },
  {
    id: "C",
    label: "C",
    swatch: "bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950",
    accent: "border-emerald-400/40",
  },
  {
    id: "D",
    label: "D",
    swatch: "bg-gradient-to-br from-sky-300 to-sky-500 text-sky-950",
    accent: "border-sky-400/40",
  },
  {
    id: "TERRANOVA",
    label: "Terranova",
    swatch: "bg-gradient-to-br from-violet-400 to-fuchsia-600 text-violet-950",
    accent: "border-fuchsia-400/40",
  },
];

export const TIER_IDS = TIERS.map((t) => t.id);

export function tierDef(id: TierId): TierDef {
  const found = TIERS.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown tier: ${id}`);
  return found;
}

/** Container ids used by dnd-kit. The unranked pool is not a tier, so it gets its own id. */
export const POOL_ID = "POOL";
export type ContainerId = TierId | typeof POOL_ID;

export function containerToTier(id: ContainerId): TierId | null {
  return id === POOL_ID ? null : id;
}

export function tierToContainer(tier: TierId | null): ContainerId {
  return tier ?? POOL_ID;
}
