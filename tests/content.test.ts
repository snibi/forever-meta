import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_SPECS } from '../src/lib/classes';
import { specSchema, tierListSchema } from '../src/lib/schema';
import meta from '../src/data/meta.json';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src', 'content');
const files = (dir: string): string[] => readdirSync(join(root, dir)).filter((f: string) => f.endsWith('.json'));
const load = (dir: string, f: string): unknown => JSON.parse(readFileSync(join(root, dir, f), 'utf8'));

const specFiles = files('specs');
const tierFiles = files('tierlists');

describe('spec files', () => {
  for (const f of specFiles) {
    it(`${f} parses and is legal`, () => {
      const res = specSchema.safeParse(load('specs', f));
      if (!res.success) {
        throw new Error(res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      }
      expect(f).toBe(`${res.data.class}-${res.data.spec}.json`);
      expect(res.data.gameBuild).toBe(meta.gameBuild);
    });
  }

  it('has exactly one file for each of the 27 specs', () => {
    expect([...specFiles].sort()).toEqual(ALL_SPECS.map((s) => `${s.id}.json`).sort());
  });
});

describe('tier list files', () => {
  for (const f of tierFiles) {
    it(`${f} parses and covers its scope`, () => {
      const res = tierListSchema.safeParse(load('tierlists', f));
      if (!res.success) {
        throw new Error(res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      }
    });
  }

  it('has all 6 lists', () => {
    expect([...tierFiles].sort()).toEqual([
      'leveling.json',
      'pve-dps.json',
      'pve-healer.json',
      'pve-tank.json',
      'pvp-overall.json',
      'racials.json',
    ]);
  });
});
