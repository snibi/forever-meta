// Content schemas. Must not import `astro:*` virtual modules so vitest can load it.
import { z } from 'astro/zod';
import { ALL_SPECS, CLASSES, CLASS_SLUGS, type ClassSlug } from './classes';
import { getClassTalents, replayOrder, totalPoints, validateAllocation, MAX_POINTS } from './talents';
import { uniqueRacials, validateRacePick } from './races';

export const evidence = z.enum(['official', 'beta-tested', 'datamined', 'theory']);
export const confidence = z.enum(['low', 'medium', 'high']);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const source = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  url: z.url(),
  publisher: z.string(),
  date,
  tier: z.enum(['official', 'reputable', 'fan', 'seller']),
});

const racePick = z.object({
  race: z.string(),
  why: z.string().min(10),
  runnerUp: z.string().optional(),
});

const buildBase = {
  title: z.string().min(3),
  summary: z.string().min(20),
  stats: z.object({ priority: z.array(z.string()).min(3), note: z.string().optional() }),
  races: z.object({ alliance: racePick, horde: racePick }),
  playstyle: z.array(z.string()).min(3).max(8),
  enchants: z
    .array(z.object({ slot: z.string(), name: z.string(), note: z.string().optional(), evidence }))
    .default([]),
  bis: z
    .array(z.object({ slot: z.string(), item: z.string(), wowheadItemId: z.number().int().optional(), sourceId: z.string() }))
    .optional(),
  gearNote: z.string().optional(),
  confidence,
  evidence: z.array(evidence).min(1),
  sourceIds: z.array(z.string()).min(1),
};

const allocBuild = z
  .object({
    ...buildBase,
    points: z.record(z.string(), z.record(z.string(), z.number().int().min(1))),
  })
  .strict();

const levelingBuild = z
  .object({
    ...buildBase,
    order: z.array(z.string()).min(1).max(51),
  })
  .strict();

export type SpecBuildMode = 'pvp' | 'pve' | 'leveling';

export const specSchema = z
  .object({
    class: z.enum(CLASS_SLUGS),
    spec: z.string(),
    tagline: z.string().max(120),
    verdict: z.array(z.string()).min(2).max(5),
    strengths: z.array(z.string()).min(2).max(5),
    weaknesses: z.array(z.string()).min(2).max(5),
    builds: z.object({ pvp: allocBuild, pve: allocBuild, leveling: levelingBuild }),
    sources: z.array(source).min(2),
    verifiedOn: date,
    gameBuild: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),
  })
  .superRefine((s, ctx) => {
    const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });

    const classDef = CLASSES.find((c) => c.slug === s.class);
    if (!classDef?.specs.some((x) => x.slug === s.spec)) {
      fail(['spec'], `spec "${s.spec}" does not exist for class "${s.class}"`);
      return;
    }
    const ct = getClassTalents(s.class as ClassSlug);

    for (const mode of ['pvp', 'pve'] as const) {
      const points = s.builds[mode].points;
      for (const e of validateAllocation(ct, points)) fail(['builds', mode, 'points'], e);
      const total = totalPoints(points);
      if (total !== MAX_POINTS) fail(['builds', mode, 'points'], `total points ${total} must be exactly ${MAX_POINTS}`);
    }

    const order = s.builds.leveling.order;
    if (order.length !== MAX_POINTS) fail(['builds', 'leveling', 'order'], `order length ${order.length} must be ${MAX_POINTS}`);
    for (const e of replayOrder(ct, order).errors) fail(['builds', 'leveling', 'order'], e);

    const ids = new Set<string>();
    for (const src of s.sources) {
      if (ids.has(src.id)) fail(['sources'], `duplicate source id "${src.id}"`);
      ids.add(src.id);
    }

    for (const mode of ['pvp', 'pve', 'leveling'] as const) {
      const b = s.builds[mode];
      for (const faction of ['alliance', 'horde'] as const) {
        const pick = b.races[faction];
        for (const key of ['race', 'runnerUp'] as const) {
          const slug = pick[key];
          if (!slug) continue;
          const err = validateRacePick(s.class, faction, slug);
          if (err) fail(['builds', mode, 'races', faction, key], err);
        }
      }
      for (const id of b.sourceIds) if (!ids.has(id)) fail(['builds', mode, 'sourceIds'], `unknown source id "${id}"`);
      for (const row of b.bis ?? []) if (!ids.has(row.sourceId)) fail(['builds', mode, 'bis'], `unknown source id "${row.sourceId}"`);
    }
  });

export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
export type SpecContent = z.infer<typeof specSchema>;

export const tierListSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    scope: z.enum(['pvp', 'pve', 'leveling', 'racials']),
    coverage: z.enum(['all', 'dps', 'tank', 'healer', 'racials']),
    basis: z.string(),
    updatedOn: date,
    confidence,
    tiers: z.array(
      z.object({
        tier: z.enum(TIERS),
        entries: z.array(z.object({ ref: z.string(), note: z.string().max(140) })),
      }),
    ),
    sources: z.array(source).min(1),
  })
  .superRefine((l, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', path: ['tiers'], message });

    if (l.tiers.map((t) => t.tier).join('') !== TIERS.join('')) fail('tiers must be exactly S, A, B, C, D in that order');

    const expected = expectedRefs(l.coverage);
    const seen = new Set<string>();
    for (const tier of l.tiers) {
      for (const { ref } of tier.entries) {
        if (seen.has(ref)) fail(`duplicate ref "${ref}"`);
        seen.add(ref);
        if (!expected.has(ref)) fail(`unknown ref "${ref}"`);
      }
    }
    for (const ref of expected) if (!seen.has(ref)) fail(`missing ref "${ref}"`);
  });

export type TierListContent = z.infer<typeof tierListSchema>;

export function expectedRefs(coverage: TierListContent['coverage']): Set<string> {
  if (coverage === 'racials') return new Set(uniqueRacials().map((r) => r.name));
  const specs = ALL_SPECS.filter((s) => {
    switch (coverage) {
      case 'all':
        return true;
      case 'dps':
        return s.role === 'melee' || s.role === 'ranged';
      case 'tank':
        return s.role === 'tank' || !!s.altRoles?.includes('tank');
      case 'healer':
        return s.role === 'healer';
    }
  });
  return new Set(specs.map((s) => s.id));
}
