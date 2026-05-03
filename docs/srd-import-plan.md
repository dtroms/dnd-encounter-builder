# SRD Import Plan

The first structured SRD import workflow is planned around Tabyltop CC-SRD:

- Repository: `https://github.com/Tabyltop/CC-SRD`
- Source type: SRD / Creative Commons
- Source document: SRD 5.1
- License: CC-BY-4.0

The repository contains converted SRD data. Because conversion errors may exist,
the app should normalize and validate records before they become Creature
Library templates.

## Current GitHub Fetch Workflow

The Importer SRD tab fetches the direct raw Tabyltop CC-SRD JSON file only when
the user clicks Import All SRD Monsters. It does not fetch on app load and does
not scrape GitHub HTML pages.

Raw URL:

`https://raw.githubusercontent.com/Tabyltop/CC-SRD/main/SRD5.1-CCBY4.0License-TT.json`

The automated workflow is:

1. Click Import All SRD Monsters.
2. Fetch the raw CC-SRD JSON from GitHub.
3. Extract monster records from structured arrays or rebuild them from the
   Tabyltop full-document heading/paragraph/table block format.
4. Normalize each record into the local creature template shape.
5. Validate each record as Ready, Needs Review, Error, or Already in library.
6. Import Ready records only.
7. Skip Needs Review, Error, and duplicate records.
8. Show an import report.
9. Show Import Diagnostics when testing the adapter.

Manual review remains available through Load Local Preview, pasted SRD JSON,
Process Import, selected rows, and Import All Valid.

The raw Tabyltop JSON is a converted SRD document array. It contains many
non-monster records such as headings, paragraphs, tables, spells, rules, and
appendices. The importer now diagnoses the JSON shape and reconstructs monster
records from the `Monsters` section rather than treating every document block as
a creature.

For full-library testing, the SRD tab also accepts pasted JSON and processes it
on demand. Supported shapes are arrays, objects with `monsters`, `data`, or
`results` arrays, and keyed objects whose values are monster records.

Imported creatures appear in the Creature Library and Builder during the same
browser session because both use the shared local creature list.

If the GitHub fetch fails, the app shows a friendly error and imports nothing
from that attempt. The pasted JSON fallback remains available for manually
testing the same normalization and validation pipeline.

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

Tabyltop ability scores are explicitly supported when they appear as a `stats`
object with lowercase, uppercase, or full-name keys. For example:

```json
{
  "stats": {
    "str": "21",
    "dex": "9",
    "con": "15",
    "int": "18",
    "wis": "15",
    "cha": "18"
  }
}
```

This normalizes into the app ability score shape:

```json
{
  "str": 21,
  "dex": 9,
  "con": 15,
  "int": 18,
  "wis": 15,
  "cha": 18
}
```

String values such as `"21 (+5)"` are also reduced to the score number.

Validation blocks obvious broken records from import and marks incomplete
records as Needs Review.

Diagnostics include:

- Root data type and top-level keys.
- Candidate monster collection paths and counts.
- Chosen monster path.
- Sample record keys.
- Top validation error reasons.
- Sample failed records and raw keys.

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
- Automatic background fetching on app load.
- D&D Beyond scraping.
- Official non-SRD D&D monster data.

Future production import should keep the raw source URL pinned or configurable,
then perform licensing and schema review before public release.
