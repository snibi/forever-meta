import warrior from '../data/talents/warrior.json';
import paladin from '../data/talents/paladin.json';
import hunter from '../data/talents/hunter.json';
import rogue from '../data/talents/rogue.json';
import priest from '../data/talents/priest.json';
import shaman from '../data/talents/shaman.json';
import mage from '../data/talents/mage.json';
import warlock from '../data/talents/warlock.json';
import druid from '../data/talents/druid.json';
import type { ClassSlug } from './classes';

export interface Talent {
  name: string;
  max: number;
  row: number;
  col: number;
  icon: string;
  desc: string[];
  req?: string;
}

export interface Tree {
  name: string;
  icon: string;
  talents: Talent[];
}

export interface ClassTalents {
  generated?: string;
  gameBuild?: string;
  class?: string;
  trees: Tree[];
}

/** tree name -> talent name -> rank */
export type Points = Record<string, Record<string, number>>;

export const MAX_POINTS = 51;
export const POINTS_PER_ROW = 5;
export const FIRST_TALENT_LEVEL = 10;

const DATA: Record<ClassSlug, ClassTalents> = {
  warrior,
  paladin,
  hunter,
  rogue,
  priest,
  shaman,
  mage,
  warlock,
  druid,
} as Record<ClassSlug, ClassTalents>;

export function getClassTalents(slug: ClassSlug): ClassTalents {
  return DATA[slug];
}

export function treePoints(points: Points, tree: string): number {
  return Object.values(points[tree] ?? {}).reduce((a, b) => a + b, 0);
}

export function totalPoints(points: Points): number {
  return Object.keys(points).reduce((a, t) => a + treePoints(points, t), 0);
}

export function validateAllocation(ct: ClassTalents, points: Points): string[] {
  const errors: string[] = [];
  for (const [treeName, alloc] of Object.entries(points)) {
    const tree = ct.trees.find((t) => t.name === treeName);
    if (!tree) {
      errors.push(`unknown tree "${treeName}"`);
      continue;
    }
    for (const [name, rank] of Object.entries(alloc)) {
      const talent = tree.talents.find((t) => t.name === name);
      if (!talent) {
        errors.push(`unknown talent "${name}" in tree "${treeName}"`);
        continue;
      }
      if (!Number.isInteger(rank) || rank < 1 || rank > talent.max) {
        errors.push(`"${name}" rank ${rank} must be 1..max (${talent.max})`);
      }
    }
  }

  const total = totalPoints(points);
  if (total > MAX_POINTS) errors.push(`total points ${total} exceeds ${MAX_POINTS}`);

  for (const tree of ct.trees) {
    const alloc = points[tree.name];
    if (!alloc) continue;
    for (const talent of tree.talents) {
      const rank = alloc[talent.name] ?? 0;
      if (rank <= 0) continue;
      const need = POINTS_PER_ROW * (talent.row - 1);
      let above = 0;
      for (const other of tree.talents) if (other.row < talent.row) above += alloc[other.name] ?? 0;
      if (above < need) {
        errors.push(`"${talent.name}" (row ${talent.row}) needs ${need} points in rows above in "${tree.name}", has ${above}`);
      }
      if (talent.req) {
        const reqTalent = tree.talents.find((t) => t.name === talent.req);
        if ((alloc[talent.req] ?? 0) < (reqTalent?.max ?? Infinity)) {
          errors.push(`"${talent.name}" requires "${talent.req}" at max rank`);
        }
      }
    }
  }
  return errors;
}

export function replayOrder(ct: ClassTalents, order: string[]): { points: Points; errors: string[] } {
  const points: Points = {};
  for (let i = 0; i < order.length; i++) {
    const name = order[i];
    const tree = ct.trees.find((t) => t.talents.some((x) => x.name === name));
    if (!tree) return { points, errors: [`unknown talent "${name}"`] };
    const alloc = (points[tree.name] ??= {});
    alloc[name] = (alloc[name] ?? 0) + 1;
    const errs = validateAllocation(ct, points);
    if (errs.length) {
      return { points, errors: [`order[${i}] "${name}" at level ${FIRST_TALENT_LEVEL + i}: ${errs[0]}`] };
    }
  }
  return { points, errors: [] };
}

export function treeIcon(slug: ClassSlug, treeName: string): string {
  return DATA[slug].trees.find((t) => t.name === treeName)?.icon ?? 'inv_misc_questionmark';
}
