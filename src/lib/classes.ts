export type ClassSlug =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'druid';

export type Role = 'tank' | 'healer' | 'melee' | 'ranged';

export interface SpecDef {
  slug: string;
  tree: string;
  name: string;
  role: Role;
  altRoles?: Role[];
}

export interface ClassDef {
  slug: ClassSlug;
  name: string;
  color: string;
  specs: [SpecDef, SpecDef, SpecDef];
}

export interface FlatSpec extends SpecDef {
  id: string;
  class: ClassSlug;
  className: string;
  color: string;
}

const spec = (slug: string, tree: string, role: Role, altRoles?: Role[]): SpecDef => ({
  slug,
  tree,
  name: '', // filled in below once the class name is known
  role,
  ...(altRoles ? { altRoles } : {}),
});

const RAW: Array<Omit<ClassDef, 'specs'> & { specs: [SpecDef, SpecDef, SpecDef] }> = [
  {
    slug: 'warrior',
    name: 'Warrior',
    color: '#C69B6D',
    specs: [spec('arms', 'Arms', 'melee'), spec('fury', 'Fury', 'melee'), spec('protection', 'Protection', 'tank')],
  },
  {
    slug: 'paladin',
    name: 'Paladin',
    color: '#F48CBA',
    specs: [spec('holy', 'Holy', 'healer'), spec('protection', 'Protection', 'tank'), spec('retribution', 'Retribution', 'melee')],
  },
  {
    slug: 'hunter',
    name: 'Hunter',
    color: '#AAD372',
    specs: [
      spec('beast-mastery', 'Beast Mastery', 'ranged'),
      spec('marksmanship', 'Marksmanship', 'ranged'),
      spec('survival', 'Survival', 'melee'),
    ],
  },
  {
    slug: 'rogue',
    name: 'Rogue',
    color: '#FFF468',
    specs: [spec('assassination', 'Assassination', 'melee'), spec('combat', 'Combat', 'melee'), spec('subtlety', 'Subtlety', 'melee')],
  },
  {
    slug: 'priest',
    name: 'Priest',
    color: '#FFFFFF',
    specs: [spec('discipline', 'Discipline', 'healer'), spec('holy', 'Holy', 'healer'), spec('shadow', 'Shadow', 'ranged')],
  },
  {
    slug: 'shaman',
    name: 'Shaman',
    color: '#0070DD',
    specs: [spec('elemental', 'Elemental', 'ranged'), spec('enhancement', 'Enhancement', 'melee'), spec('restoration', 'Restoration', 'healer')],
  },
  {
    slug: 'mage',
    name: 'Mage',
    color: '#3FC7EB',
    specs: [spec('arcane', 'Arcane', 'ranged'), spec('fire', 'Fire', 'ranged'), spec('frost', 'Frost', 'ranged')],
  },
  {
    slug: 'warlock',
    name: 'Warlock',
    color: '#8788EE',
    specs: [spec('affliction', 'Affliction', 'ranged'), spec('demonology', 'Demonology', 'ranged'), spec('destruction', 'Destruction', 'ranged')],
  },
  {
    slug: 'druid',
    name: 'Druid',
    color: '#FF7C0A',
    specs: [
      spec('balance', 'Balance', 'ranged'),
      spec('feral-combat', 'Feral Combat', 'melee', ['tank']),
      spec('restoration', 'Restoration', 'healer'),
    ],
  },
];

export const CLASSES: ClassDef[] = RAW.map((c) => ({
  ...c,
  specs: c.specs.map((s) => ({ ...s, name: `${s.tree} ${c.name}` })) as ClassDef['specs'],
}));

export const CLASS_SLUGS = CLASSES.map((c) => c.slug) as [ClassSlug, ...ClassSlug[]];

export const ALL_SPECS: FlatSpec[] = CLASSES.flatMap((c) =>
  c.specs.map((s) => ({ ...s, id: `${c.slug}-${s.slug}`, class: c.slug, className: c.name, color: c.color })),
);

export function specById(id: string): FlatSpec | undefined {
  return ALL_SPECS.find((s) => s.id === id);
}

export function classBySlug(slug: string): ClassDef | undefined {
  return CLASSES.find((c) => c.slug === slug);
}

/** Brand color is too dark for small text on #191d27. Shaman is the only miss (3.5:1). */
export function textColor(color: string): string {
  return color.toLowerCase() === '#0070dd' ? '#8ebeff' : color;
}

export const ROLE_LABEL: Record<Role, string> = { tank: 'Tank', healer: 'Healer', melee: 'Melee DPS', ranged: 'Ranged DPS' };
