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

The Importer SRD tab currently uses a tiny local/static Tabyltop-shaped JSON
source at `src/data/srd/tabyltop-cc-srd-monsters.sample.json`. It does not fetch
GitHub at runtime and does not bundle the full SRD monster list yet.

The automated workflow is:

1. Click Import All SRD Monsters.
2. Load the configured local/static CC-SRD-shaped JSON source.
3. Extract the monster array from the supported dataset shape.
4. Normalize each record into the local creature template shape.
5. Validate each record as Ready, Needs Review, Error, or Already in library.
6. Import Ready records only.
7. Skip Needs Review, Error, and duplicate records.
8. Show an import report.

Manual review remains available through Load Local Preview, pasted SRD JSON,
Process Import, selected rows, and Import All Valid.

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

Import All SRD Monsters and Import All Valid import Ready records only. They
skip Error records, Needs Review records, and duplicates. Error records include
missing names, invalid AC or HP, missing CR, missing ability scores, unknown
creature type, malformed records, malformed actions/traits, or invalid numeric
values.

Duplicate detection uses the normalized creature name plus source type, source
name, and SRD document version. Existing local creatures are not overwritten.

## Boundaries

This is local/session-only for now.

Not included yet:

- Supabase persistence.
- Auth or RLS.
- Runtime GitHub fetching.
- The full curated CC-SRD monster JSON file.
- D&D Beyond scraping.
- Official non-SRD D&D monster data.

Future production import should use either a curated pinned CC-SRD JSON file or
a reviewed local adapter output, then perform licensing and schema review before
public release.
