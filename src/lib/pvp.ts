import { z } from 'astro/zod';
import raw from '../data/pvp-ranks.json';

const schema = z.object({
  sourceUrl: z.url(),
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidence: z.literal('datamined'),
  honorCap: z.number().int().positive(),
  weeklyRankCeiling: z.array(z.number().int().min(1).max(14)).length(10),
  ranks: z
    .array(
      z.object({
        rank: z.number().int().min(1).max(14),
        alliance: z.string(),
        horde: z.string(),
        rankPoints: z.number().int().positive(),
        cumulativeRankPoints: z.number().int().positive(),
        rewards: z.array(z.string()).min(1),
      }),
    )
    .length(14),
  battlegrounds: z.array(
    z.object({
      name: z.string(),
      size: z.string(),
      minLevel: z.number().int(),
      status: z.enum(['official', 'datamined']),
    }),
  ),
  notes: z.array(z.string()),
});

export const PVP = schema.parse(raw);
export type PvpData = typeof PVP;
