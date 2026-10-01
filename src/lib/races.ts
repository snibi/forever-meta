import racesJson from '../data/races.json';
import type { ClassSlug } from './classes';

export interface Racial {
  name: string;
  text: string;
  icon: string;
}

export interface Race {
  slug: string;
  name: string;
  faction: 'alliance' | 'horde';
  icon: string;
  classes: ClassSlug[];
  newClasses: ClassSlug[];
  racials: Racial[];
}

export const RACES = racesJson as Race[];

export const raceBySlug = (slug: string): Race | undefined => RACES.find((r) => r.slug === slug);

export function validateRacePick(classSlug: string, faction: 'alliance' | 'horde', raceSlug: string): string | null {
  const race = raceBySlug(raceSlug);
  if (!race || race.faction !== faction || !race.classes.includes(classSlug as ClassSlug)) {
    return `race "${raceSlug}" is not a playable ${faction} ${classSlug}`;
  }
  return null;
}

/** Unique racials by name (shared Skyborne racials count once). */
export function uniqueRacials(): Array<Racial & { races: Race[] }> {
  const map = new Map<string, Racial & { races: Race[] }>();
  for (const race of RACES) {
    for (const r of race.racials) {
      const e = map.get(r.name);
      if (e) e.races.push(race);
      else map.set(r.name, { ...r, races: [race] });
    }
  }
  return [...map.values()];
}
