# Stat Block Importer

The Stat Block Importer is the workspace for bringing creature data into the
Creature Library. In signed-in mode, reviewed pasted imports can now save to the
current user's Supabase `creature_templates` rows. In Local Demo Mode, the same
workflow still saves into local/session state only.

## Import Methods

The visible beta Importer currently focuses on:

- Paste Stat Block: paste user-provided stat block text, parse it locally, and
  review the detected creature fields before saving.
- Import History: placeholder for future saved import attempts and parser
  status once persistence exists.

The SRD import workflow is still in the codebase and planning docs, but it is
hidden from the normal beta UI while validation work continues. Local developers
can re-enable the in-progress SRD tab by setting:

`NEXT_PUBLIC_ENABLE_SRD_IMPORT=true`

## Planned SRD Source

The planned SRD source is:

- Source name: Tabyltop CC-SRD
- Source URL: `https://github.com/Tabyltop/CC-SRD`
- Source document version: SRD 5.1
- License: CC-BY-4.0
- Source type: `srd`

The automated workflow fetches the direct raw JSON file from GitHub only after
the user clicks Import All SRD Monsters. The app does not fetch the file on page
load and does not scrape GitHub HTML pages.

Raw JSON URL:

`https://raw.githubusercontent.com/Tabyltop/CC-SRD/main/SRD5.1-CCBY4.0License-TT.json`

Future SRD import work should use a local adapter script or curated import file,
then review the output before records become Library creature templates.

## Hidden SRD Import Workflow

The SRD tab is currently hidden from normal app UI. When the local feature flag
is enabled, it supports:

1. Import All SRD Monsters.
2. Fetch the raw Tabyltop CC-SRD JSON from GitHub.
3. Extract monster stat blocks from either structured monster arrays or the
   Tabyltop full-document block format.
4. Normalize Tabyltop-shaped SRD records into the app creature template shape.
5. Show validation status for each record: Ready, Needs Review, Error, or
   Already in library.
6. Import only Ready records into the signed-in Creature Library or local demo
   session, depending on app mode.
7. Skip Needs Review, Error, and Already in library records.
8. Show an import report with processed, imported, duplicate, review, and error
   counts.
9. Show a compact Import Diagnostics panel with root shape, chosen monster
   path, candidate collection counts, sample record keys, top error reasons,
   and sample failed records.

Manual fallback tools remain available behind the feature flag: Load Local
Preview, paste SRD JSON, Process Import, select records, and Import All
Valid/selected records. The pasted JSON fallback uses the same normalization,
validation, duplicate prevention, and save pipeline.

The SRD tab also supports full-dataset testing by pasting SRD monster JSON into
the dataset textarea and clicking Process Import. Supported JSON shapes are:

- An array of monster records.
- `{ "monsters": [...] }`
- `{ "data": [...] }`
- `{ "results": [...] }`
- A keyed object such as `{ "wolf": { ...monster } }`
- The Tabyltop full-document block array, where monster entries are rebuilt from
  heading, paragraph, and ability-score table blocks.

The full Tabyltop source is a converted document array, not a clean monster
array. The importer now has a document-block adapter that looks for the
`Monsters` section and rebuilds individual stat blocks from monster headings,
metadata paragraphs, AC/HP/speed/CR paragraphs, ability-score tables, traits,
actions, reactions, legendary actions, and lair actions.

If the shape is not recognized or the JSON cannot be parsed, the importer shows
a clear error and does not import anything.

Imported SRD creatures use:

- `sourceType = srd`
- `sourceName = Tabyltop CC-SRD`
- `sourceUrl = https://github.com/Tabyltop/CC-SRD`
- `sourceRawUrl = https://raw.githubusercontent.com/Tabyltop/CC-SRD/main/SRD5.1-CCBY4.0License-TT.json`
- `sourceDocumentVersion = SRD 5.1`
- `licenseName = CC-BY-4.0`
- `importMethod = automated-srd-json` for the one-click path, or
  `srd-json-review` for manual selected imports
- `importedAt` when available

Duplicate prevention checks the normalized creature name, source type, source
name, and SRD document version. Already imported records are skipped and are not
overwritten.

Import All SRD Monsters fetches, extracts, normalizes, validates, and imports in
one user-triggered action. Import All SRD Monsters and Import All Valid import
Ready records only. They skip Error records, Needs Review records, and
duplicates. The report area summarizes total processed records, imported count,
skipped duplicates, skipped errors, skipped needs-review records, source used,
and the first issue details.

Fetch failures are handled without crashing. Network failures, CORS failures,
non-200 responses, invalid JSON, unrecognized dataset shapes, and timeouts show
a friendly error and leave existing Library data untouched. The UI suggests
trying again later or using the pasted SRD JSON fallback.

The normalizer extracts or preserves common fields such as name, meta
size/type/alignment, AC, HP, speed, ability scores, saving throws, skills,
senses, languages, CR, traits, actions, reactions, legendary actions, lair
actions, defenses, license metadata, and raw source JSON.

Tabyltop `stats` objects are supported directly. Lowercase keys such as
`str`, `dex`, `con`, `int`, `wis`, and `cha` are mapped into the app's canonical
ability score shape, and string values like `"21"` or `"21 (+5)"` are parsed as
numbers without producing `NaN`.

Critical validation failures become Error and are skipped:

- Missing name.
- Missing or invalid AC.
- Missing or invalid HP.
- Missing or invalid CR.
- Missing or invalid ability scores.
- Unknown creature type.
- Malformed record object.
- NaN or invalid core numeric values.
- Malformed actions or traits data.

Non-critical issues become Needs Review and are skipped by Import All Valid for
now:

- No actions found.
- No traits found.
- Missing languages or senses.
- Unusual or incomplete non-core fields.
- Unknown type/size when the importer can safely default the field for review.

The diagnostics panel is meant to make adapter tuning visible. If most records
fail, it shows the likely cause, such as missing AC, missing HP, malformed
action data, or unexpected raw keys.

## Paste Stat Block Workflow

The paste workflow is:

1. Paste stat block text.
2. Optionally add a source name and source URL.
3. Run the local parser helper.
4. Review detected creature fields.
5. Fill in missing required fields.
6. Save the reviewed creature into the Creature Library.

Saved pasted creatures are marked as `Imported` with `importMethod = paste`.
They are treated as user-provided content.

When Supabase is configured, the user is signed in, and Local Demo Mode is off,
Save to Library creates a private `creature_templates` row owned by that user.
The saved creature is also added to the shared in-session creature list so it is
visible in the Creature Library and Builder without a reload.

Signed-in saves include `owner_user_id` from the current Supabase Auth user so
RLS can allow the insert. If a save fails, the Importer now shows a safe reason
such as a missing required field, missing session, RLS rejection, or database
schema mismatch instead of only a generic failure message.

When Supabase is not configured or `NEXT_PUBLIC_USE_DEMO_DATA=true`, Save to
Library keeps the previous local/session behavior.

## Parser Scope

The parser is intentionally heuristic, but it now normalizes pasted text before
parsing. Normalization handles common copy/paste issues such as smart quotes,
unicode dashes, unicode fractions, repeated spaces, tabs, odd line endings,
bullets, and repeated blank lines without destroying meaningful section breaks.

It attempts to detect:

- Name
- Size, creature type, subtype, and alignment line
- Armor Class
- Armor Class notes such as natural armor or shield text
- Hit Points
- Hit Point formula
- Speed
- Ability scores
- Initiative bonus
- Saving throws
- Skills
- Damage vulnerabilities, resistances, and immunities
- Condition immunities
- Senses
- Languages
- Challenge rating
- Challenge XP text
- Traits
- Actions
- Bonus actions
- Reactions
- Legendary actions
- Lair actions

The parser supports common SRD/homebrew variations such as `AC 12`,
`Armor Class 16 (natural armor)`, `Hit Points 13 (3d8)`, `CR 1/2`, abbreviated
or fully spelled-out ability score tables, unheaded traits before `ACTIONS`,
bullet lair actions, and legendary action intro text.

The parser can still be wrong or incomplete. It returns confidence, warnings,
low-confidence fields, extra preserved sections, and missing required fields so
the user can review the result before saving.

## Review Before Saving

The review panel exposes editable fields for identity, combat role, core stats,
ability scores, traits, actions, advanced action sections, notes, tags, and
source metadata.

Required fields are:

- Name
- Creature type
- Armor Class
- Hit Points
- Speed
- Challenge Rating
- Ability scores

The Save to Library button remains disabled until required fields are present.
The UI also guards against bad numeric values so `NaN`, `undefined`, `null`, and
object output are not shown as review values.

## Save Behavior

Save to Library validates the reviewed creature before writing anything. It
requires a name, creature type, AC, HP, speed, challenge rating, and complete
ability scores. Invalid core values such as `NaN`, `undefined`, `null`, or object
output are blocked before save.

Pasted imports preserve metadata where the schema supports it:

- `source_type = imported`
- `import_method = paste`
- original pasted text
- source name and source URL when provided
- parser confidence
- parser version
- import notes
- `imported` tag

The richer `stat_block_imports` history table is not wired yet. For now, pasted
imports save directly to `creature_templates`; fuller import audit/history can
be added later.

If a hosted Supabase project is behind the latest local schema and rejects an
optional import metadata column, the save helper can retry with only the core
`creature_templates` fields. This preserves the creature save while making it
clear that richer import history still depends on the full migration set.

## Boundaries

This pass intentionally does not include:

- Builder save/load persistence.
- Runner runtime persistence.
- Writing to `stat_block_imports`.
- D&D Beyond scraping.
- Official non-SRD D&D monster data.
- Automatic fetches on app load.
- Visible SRD import tools in the normal beta UI.

Use only content the user has the right to use. SRD Creative Commons imports
should preserve attribution and license metadata. Official non-SRD content
should not be bundled with the app.

The future Tabyltop CC-SRD workflow is separate from the paste parser. Paste
imports are messy user-provided content; SRD imports should use structured,
reviewed Creative Commons source data with explicit attribution.
