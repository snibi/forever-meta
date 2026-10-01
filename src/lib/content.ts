import { getCollection } from 'astro:content';
import { getClassTalents, replayOrder, type Points } from './talents';
import type { SpecContent, SpecBuildMode, TierListContent } from './schema';
import type { FlatSpec } from './classes';
import { href } from './paths';

export interface SpecEntry {
  id: string; // "{class}-{spec}"
  data: SpecContent;
}

export interface TierListEntry {
  id: string;
  data: TierListContent;
}

export async function getSpecs(): Promise<SpecEntry[]> {
  const entries = await getCollection('specs');
  const seen = new Set<string>();
  const out: SpecEntry[] = [];
  for (const e of entries) {
    const key = `${e.data.class}-${e.data.spec}`;
    if (seen.has(key)) throw new Error(`duplicate spec ${key}`);
    seen.add(key);
    out.push({ id: key, data: e.data });
  }
  return out;
}

export async function getTierLists(): Promise<TierListEntry[]> {
  const entries = await getCollection('tierlists');
  return entries.map((e) => ({ id: e.id, data: e.data }));
}

export function resolvePoints(spec: SpecContent, mode: SpecBuildMode): Points {
  if (mode === 'leveling') return replayOrder(getClassTalents(spec.class), spec.builds.leveling.order).points;
  return spec.builds[mode].points;
}

export const MODES = [
  { key: 'pvp', label: 'PvP', sub: 'Battlegrounds & world PvP', path: '' },
  { key: 'pve', label: 'PvE', sub: 'L60 dungeons & raid prep', path: 'pve/' },
  { key: 'leveling', label: 'Leveling', sub: 'Levels 10–60', path: 'leveling/' },
] as const;

export type ModeKey = (typeof MODES)[number]['key'];

export const specHref = (s: Pick<FlatSpec, 'class' | 'slug'>, mode?: ModeKey) => {
  const m = MODES.find((x) => x.key === mode);
  return href(`/classes/${s.class}/${s.slug}/${m?.path ?? ''}`);
};

/** Tier letter for a spec in the tier list that drives a given build mode, or null. */
export function tierOf(list: TierListEntry | undefined, ref: string): string | null {
  return list?.data.tiers.find((t) => t.entries.some((e) => e.ref === ref))?.tier ?? null;
}

export function pveListId(role: FlatSpec['role']): string {
  if (role === 'tank') return 'pve-tank';
  return role === 'healer' ? 'pve-healer' : 'pve-dps';
}

/** Tier letters (or null) for a spec in each mode's driving tier list. */
export function specTiers(lists: TierListEntry[], spec: FlatSpec): Record<ModeKey, string | null> {
  const find = (id: string) => lists.find((l) => l.id === id);
  return {
    pvp: tierOf(find('pvp-overall'), spec.id),
    pve: tierOf(find(pveListId(spec.role)), spec.id),
    leveling: tierOf(find('leveling'), spec.id),
  };
}
