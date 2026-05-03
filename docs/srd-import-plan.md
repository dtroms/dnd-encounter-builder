# SRD Import Plan

The first structured SRD import workflow is planned around Tabyltop CC-SRD:

- Repository: `https://github.com/Tabyltop/CC-SRD`
- Source type: SRD / Creative Commons
- Source document: SRD 5.1
- License: CC-BY-4.0

The repository contains converted SRD data. Because conversion errors may exist,
the app should normalize and validate records before they become Creature
Library templates.

## Current Local Workflow

The Importer SRD tab currently uses a tiny local Tabyltop-shaped sample subset.
It does not fetch GitHub at runtime and does not bundle the full SRD monster
list.

The workflow is:

1. Load Local Preview.
2. Normalize sample records into the local creature template shape.
3. Show validation state: Ready, Needs Review, Error, or Already in library.
4. Select importable records.
5. Import selected records into local session state.

For full-library testing, the SRD tab also accepts pasted JSON and processes it
on demand. Supported shapes are arrays, objects with `monsters`, `data`, or
`results` arrays, and keyed objects whose values are monster records.

Imported creatures appear in the Creature Library and Builder during the same
browser session because both use the shared local creature list.

## Normalization

The helper in `src/lib/encounter/srd-importer.ts` maps likely Tabyltop/SRD JSON
fields into the app creature template shape:

- Name
- Meta size/type/alignment
- Armor Class and armor note
- Hit Points and HP formula
- Speed
- STR, DEX, CON, INT, WIS, CHA
- Saving throws
- Skills
- Senses
- Languages
- Challenge Rating and XP text
- Traits
- Actions
- Bonus actions
- Reactions
- Legendary actions
- Lair actions
- Damage vulnerabilities, resistances, and immunities
- Condition immunities
- Source/license/attribution metadata

Validation blocks obvious broken records from import and marks incomplete
records as Needs Review.

Import All Valid imports Ready records only. It skips Error records, Needs
Review records, and duplicates. Error records include missing names, invalid AC
or HP, missing CR, missing ability scores, unknown creature type, malformed
records, malformed actions/traits, or invalid numeric values.

## Boundaries

This is local/session-only for now.

Not included yet:

- Supabase persistence.
- Auth or RLS.
- Runtime GitHub fetching.
- Full SRD bulk import.
- D&D Beyond scraping.
- Official non-SRD D&D monster data.

Future production import should use either a curated pinned CC-SRD JSON file or
a reviewed local adapter output, then perform licensing and schema review before
public release.
