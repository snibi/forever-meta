import { describe, expect, it } from 'vitest';
import { replayOrder, validateAllocation, type ClassTalents, type Talent } from '../src/lib/talents';
import { validateRacePick } from '../src/lib/races';

// Synthetic class: trees "Tree A/B/C", each with one 5-rank talent per row 1..7 (named A1..A7),
// plus a 1-rank row-5 talent "A5r" that requires A5 at max.
function tree(letter: string): { name: string; icon: string; talents: Talent[] } {
  const talents: Talent[] = [];
  for (let row = 1; row <= 7; row++) {
    talents.push({ name: `${letter}${row}`, max: 5, row, col: 1, icon: 'x', desc: ['d'] });
  }
  if (letter === 'A') talents.push({ name: 'A5r', max: 1, row: 5, col: 2, icon: 'x', desc: ['d'], req: 'A5' });
  return { name: `Tree ${letter}`, icon: 'x', talents };
}
const ct: ClassTalents = { trees: [tree('A'), tree('B'), tree('C')] };

const legal51 = {
  'Tree A': { A1: 5, A2: 5, A3: 5, A4: 5, A5: 5, A6: 5, A7: 5 },
  'Tree B': { B1: 5, B2: 5, B3: 5 },
  'Tree C': { C1: 1 },
};

describe('validateAllocation', () => {
  it('accepts a legal 51-point allocation', () => {
    expect(validateAllocation(ct, legal51)).toEqual([]);
  });

  it('rejects a row-3 talent with only 9 points above', () => {
    expect(validateAllocation(ct, { 'Tree A': { A1: 5, A2: 4, A3: 1 } })).toEqual([
      '"A3" (row 3) needs 10 points in rows above in "Tree A", has 9',
    ]);
  });

  it('rejects a talent whose requirement is not at max rank', () => {
    const errs = validateAllocation(ct, { 'Tree A': { A1: 5, A2: 5, A3: 5, A4: 5, A5: 4, A5r: 1 } });
    expect(errs).toEqual(['"A5r" requires "A5" at max rank']);
  });

  it('rejects rank above max, unknown talents and unknown trees', () => {
    expect(validateAllocation(ct, { 'Tree A': { A1: 6 } })).toContain('"A1" rank 6 must be 1..max (5)');
    expect(validateAllocation(ct, { 'Tree A': { Nope: 1 } })).toContain('unknown talent "Nope" in tree "Tree A"');
    expect(validateAllocation(ct, { 'Tree Z': { A1: 1 } })).toContain('unknown tree "Tree Z"');
  });

  it('rejects more than 51 points', () => {
    const errs = validateAllocation(ct, {
      'Tree A': { A1: 5, A2: 5, A3: 5, A4: 5, A5: 5, A6: 5, A7: 5 },
      'Tree B': { B1: 5, B2: 5, B3: 5, B4: 2 },
    });
    expect(errs).toEqual(['total points 52 exceeds 51']);
  });
});

describe('replayOrder', () => {
  it('reports the level at which an order first becomes illegal', () => {
    const { errors } = replayOrder(ct, ['A1', 'A1', 'A1', 'A2']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('at level 13');
    expect(errors[0]).toContain('"A2" (row 2)');
  });

  it('returns the resulting points for a valid order', () => {
    const order = ['A1', 'A1', 'A1', 'A1', 'A1', 'A2', 'A2', 'B1'];
    expect(replayOrder(ct, order)).toEqual({ points: { 'Tree A': { A1: 5, A2: 2 }, 'Tree B': { B1: 1 } }, errors: [] });
  });

  it('flags unknown talent names', () => {
    expect(replayOrder(ct, ['Nope']).errors).toEqual(['unknown talent "Nope"']);
  });
});

describe('validateRacePick', () => {
  it('rejects a race on the wrong faction or class list, accepts new combos', () => {
    expect(validateRacePick('paladin', 'horde', 'orc')).toBe('race "orc" is not a playable horde paladin');
    expect(validateRacePick('paladin', 'horde', 'undead')).toBeNull();
    expect(validateRacePick('paladin', 'alliance', 'undead')).not.toBeNull();
  });
});
