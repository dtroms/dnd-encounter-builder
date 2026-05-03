# SRD Import Plan

This plan covers a future Creative Commons SRD monster import workflow for the Creature Library. It does not implement importer UI, fetch external data, wire Supabase reads/writes, scrape websites, or add official non-SRD D&D monsters.

## Planned Source

Initial planned structured source:

- `source_name`: `Tabyltop CC-SRD`
- `source_type`: `srd`
- `source_document_version`: `SRD 5.1`
- `license_name`: `CC-BY-4.0`
- `source_url`: `https://github.com/Tabyltop/CC-SRD`

Imported `creature_templates` should preserve source, license, and attribution metadata.

## Source Caution

The Tabyltop CC-SRD repository converts SRD 5.1 Creative Commons content into machine-friendly formats. Because conversion from PDF/data formats can introduce formatting or JSON conversion errors, the app should not blindly trust imported JSON.

Before records become Creature Library templates, the import workflow should validate and normalize the data, then show a reviewable import preview.

## Future Adapter Workflow

Recommended future workflow:

1. Obtain the Tabyltop CC-SRD monster JSON through a reviewed local file or adapter script.
2. Normalize source fields into the app's `CreatureTemplateRecord` shape.
3. Validate required fields such as name, AC, HP, initiative bonus, challenge rating, and actions.
4. Preserve source/license/attribution metadata on each normalized record.
5. Generate an import preview with warnings for missing, malformed, or uncertain fields.
6. Let the user import all monsters or selected monsters into their Creature Library.

## Separate From Pasted Stat Blocks

Pasted stat block import and SRD bulk import should stay separate:

- Pasted stat block import is for messy, individual, user-provided content.
- Tabyltop CC-SRD import is a structured Creative Commons bulk import source.

The pasted importer should keep using draft/review/save states for one-off content. The SRD adapter should focus on repeatable validation, normalization, attribution, and bulk selection.

## Beta Recommendation

Avoid runtime fetching from GitHub for early beta unless caching, version pinning, network failure handling, and error handling are designed.

Preferred beta path:

1. Use a local adapter script or curated import file.
2. Review the normalized output.
3. Import reviewed records into the database deliberately.

This keeps the first SRD import workflow predictable and avoids making the app depend on GitHub availability at runtime.
