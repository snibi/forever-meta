# Forever Meta

Static meta site for **World of Warcraft: Forever**. One best build per spec for PvP, PvE, and leveling, plus cross-spec tier lists.

Live: https://snibi.github.io/forever-meta/

## Run

Requires Node `>=22.12`.

```sh
npm install
npm run sync    # re-vendor talents and races; the site build does not use the network
npm test
npm run check
npm run build
npm run preview
```

`npm run dev` serves the same pages with the dev server.

## What a page claims

27 specs (9 classes × 3 trees). Each spec file has:

- **PvP** — battlegrounds and world PvP. No arena, no rated ladder, no PvP talents.
- **PvE** — level-60 dungeons and raid prep. Not a best-in-slot list. Item stats are hidden until items drop, so `bis` is omitted.
- **Leveling** — a 51-step order from level 10 to 60, legal at every prefix, meant to need no respec.

Talent legality is enforced at build time: 51 points, 5 points in earlier rows per row gate, prerequisites at max rank, playable race for that faction and class. An illegal file fails `astro build`.

## Data

| Data | Source |
| --- | --- |
| Talents and racials | [talentsforever.com](https://talentsforever.com) exports, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), trimmed by `scripts/sync-data.mjs` |
| Icons | Wowhead zamimg, stored in `public/icons/`. © Blizzard Entertainment |
| PvP ranks | [Icy Veins PvP rank system](https://www.icy-veins.com/wow-forever/pvp-rank-system), datamined beta numbers |

Vendored talent text is client build `1.60.1.70009`. `meta.json` records the later beta build `1.60.1.70124` because the Sep 30 patch notes say talents did not change in that build.

This is a fan site. It is not affiliated with Blizzard.

## Changes

Live site: https://snibi.github.io/forever-meta/. Pushes to `master` redeploy through GitHub Actions.

| Commit | What changed |
| --- | --- |
| `25e1aef` | Initial snapshot: 27 specs, 6 tier lists, vendored talent data, build-time legality checks. |
| `1d2e5f5` | GitHub Pages deploy. Internal links use the `/forever-meta` base path. |
| `a86942c` | Dark icons get a framed plate so race portraits no longer vanish. Role marks are SVG, not emoji. Shaman names use `#8EBEFF` because `#0070DD` was 3.5:1 on the chip background. |
| `a8baae6` | Meta snapshot hover notes open under the chip. The tier card was clipping them. |

Also fixed before the first push: the beta banner no longer truncates “L60 conclusions are projections until launch” at 390px, and the mobile nav sits under the logo instead of beside it.

## Review (2026-10-01)

Reviewed against the beta client data in this repo, the pages that were actually opened while writing content, and the live Pages site.

### Verified

- `npm test`: 44 tests. Allocation rules, race picks, all 27 spec files, all 6 tier lists.
- `npm run check`: 0 errors.
- `npm run build`: 100 `index.html` files plus `404.html` (home, 9 class pages, 81 build pages, tier hub, 6 lists, races, methodology).
- Negative check: setting Arms `Deflection` to 6 fails the build with `"Deflection" rank 6 must be 1..max (5)`. Reverted.
- Preview at 1440px and 390px: countdown ticks, 9 class cards, Arms trees sum to 51, a spent-talent tooltip shows the rank text, leveling order runs Level 10 through Level 60, PvP list has 27 chips, races page has 6 NEW pills.
- Every leveling order finishes in its own tree (lowest primary-tree total is Holy Priest at 31, which keeps 5 Spirit Tap points so the solo path does not respec).
- After `a8baae6`, hovering a meta-snapshot chip shows the note under the chip instead of clipping it.

### Limits, not bugs

- Level-60 allocations are projections. Confidence is `low` unless a build is only claiming a level-20 path that a guide actually printed. Raids are not open. There is no BiS list.
- Icy Veins pages dated 17 Sep 2026 still say Gnome Eureka! cuts cost by 50%. The 24 Sep notes and the 28 Sep race guide say 10% cost and 10% effect. This site follows the later number. Eureka! is not S on the racial list.
- Blizzard’s 30 Sep Priest & Warrior deep dive says Iron Will moved to Arms. The vendored client still has it in Fury. Builds follow the client. If a later build moves it, `npm test` and `npm run build` will reject any spec that names a talent the client no longer has.
- Public rankings disagree, and several of the indexed lists are seller sites. Those are corroboration only. A spec file that calls itself weak is not placed in S.
- Wowhead guide bodies are JavaScript-rendered. Rank letters on this site are not copied from a Wowhead table this session could not read.
- `https://world-of-warcraft-forever.wiki` is not a source. It invents Mastery and Versatility.

### Not in scope

No arena tools, no item database, no live talent calculator. GitHub Pages publishes `master` via `.github/workflows/deploy.yml`.
