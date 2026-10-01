// Vendors talent + race data from talentsforever.com (CC BY 4.0) and game icons from zamimg.
// This is the only network code in the project; the site build never touches the network.
import { mkdir, readdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLASSES = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'];
const UA = { 'User-Agent': 'forever-meta-sync' };

const RACE_SLUGS = {
  Human: 'human',
  Dwarf: 'dwarf',
  'Night Elf': 'night-elf',
  Gnome: 'gnome',
  'Skyborne (High Order)': 'skyborne-high-order',
  Orc: 'orc',
  Undead: 'undead',
  Tauren: 'tauren',
  Troll: 'troll',
  'Skyborne (Windshaper)': 'skyborne-windshaper',
};
const NEW_COMBOS = {
  human: ['hunter'],
  dwarf: ['shaman'],
  gnome: ['priest'],
  orc: ['mage'],
  troll: ['warlock'],
  undead: ['paladin'],
};
const ICON_OVERRIDE = { race_skyborne: 'race_skyborne_male' };
const fixIcon = (n) => ICON_OVERRIDE[n] ?? n;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// 1. fetch everything before writing anything
const exports_ = {};
for (const c of CLASSES) {
  const res = await fetch(`https://talentsforever.com/export/${c}.json`, { headers: UA });
  if (res.status !== 200) fail(`${c}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.talents?.trees) fail(`${c}: export is missing talents.trees`);
  exports_[c] = json;
}

// 2. talents
await mkdir(join(ROOT, 'src/data/talents'), { recursive: true });
const icons = new Set(['inv_misc_questionmark']);
for (const c of CLASSES) {
  const j = exports_[c];
  const gameBuild = /build (\d+\.\d+\.\d+\.\d+)/.exec(j.talents.source ?? '')?.[1] ?? 'unknown';
  icons.add(`classicon_${c}`);
  const trees = j.talents.trees.map((t) => {
    icons.add(fixIcon(t.icon));
    return {
      name: t.name,
      icon: fixIcon(t.icon),
      talents: t.talents.map((x) => {
        icons.add(fixIcon(x.icon));
        const out = { name: x.name, max: x.max, row: x.row, col: x.col, icon: fixIcon(x.icon), desc: x.desc };
        if (x.req) out.req = x.req;
        return out;
      }),
    };
  });
  const out = { generated: j.generated, gameBuild, class: c, trees };
  await writeFile(join(ROOT, `src/data/talents/${c}.json`), JSON.stringify(out, null, 1) + '\n');
}

// 3. races
const byRace = new Map();
for (const c of CLASSES) {
  for (const faction of ['Alliance', 'Horde']) {
    for (const r of exports_[c].racials?.[faction] ?? []) {
      const slug = RACE_SLUGS[r.race];
      if (!slug) fail(`unknown race "${r.race}" in ${c} export`);
      const classes = new Set(r.classes.map((x) => x.toLowerCase()));
      const prev = byRace.get(slug);
      if (!prev) {
        byRace.set(slug, {
          slug,
          name: r.race,
          faction: faction.toLowerCase(),
          icon: fixIcon(r.icon),
          classes,
          racials: r.abilities.map(([name, text, icon]) => ({ name, text, icon })),
        });
      } else {
        const same = prev.classes.size === classes.size && [...classes].every((x) => prev.classes.has(x));
        if (!same) console.warn(`${slug}: class lists differ between exports; taking union`);
        for (const x of classes) prev.classes.add(x);
      }
    }
  }
}
if (byRace.size !== 10) fail(`expected 10 races, got ${byRace.size}`);
const races = [...byRace.values()].map((r) => {
  const slug = r.slug;
  for (const x of r.racials) icons.add(fixIcon(x.icon));
  icons.add(r.icon);
  return {
    slug,
    name: r.name,
    faction: r.faction,
    icon: r.icon,
    classes: CLASSES.filter((c) => r.classes.has(c)),
    newClasses: NEW_COMBOS[slug] ?? [],
    racials: r.racials.map((x) => ({ ...x, icon: fixIcon(x.icon) })),
  };
});
const order = Object.values(RACE_SLUGS);
races.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
await writeFile(join(ROOT, 'src/data/races.json'), JSON.stringify(races, null, 1) + '\n');

// 4. icons
const iconDir = join(ROOT, 'public/icons');
await mkdir(iconDir, { recursive: true });
const exists = (p) => access(p).then(() => true, () => false);
const queue = [...icons];
const missing = [];
async function worker() {
  while (queue.length) {
    const name = queue.pop();
    const file = join(iconDir, `${name}.jpg`);
    if (await exists(file)) continue;
    try {
      const res = await fetch(`https://wow.zamimg.com/images/wow/icons/large/${name}.jpg`, { headers: UA });
      if (res.status !== 200) {
        missing.push(name);
        continue;
      }
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
    } catch {
      missing.push(name);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
if (missing.length) console.warn(`missing icons (${missing.length}): ${missing.sort().join(', ')}`);
const present = (await readdir(iconDir)).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4)).sort();
await writeFile(join(ROOT, 'src/data/icons.json'), JSON.stringify(present, null, 1) + '\n');
console.log(`synced: ${CLASSES.length} classes, ${races.length} races, ${present.length} icons`);
