# Creature Library

The Creature Library is the planned home for saved creatures, custom monsters,
and imported stat blocks. It is currently a local mock-data UI only. It does
not read from or write to Supabase yet.

## Current Layout

The Library uses a two-column browser/detail layout:

- Left column: compact creature browser with search and filters.
- Right column: selected creature stat block preview with source metadata and
  future action placeholders.

On smaller screens, the layout can stack so the browser appears above the
selected creature details.

## Search and Filters

The browser supports local filtering by:

- Creature name, tags, trait text, and action text.
- Role/type: PC, Enemy, Boss, NPC, Ally, Summon, or Neutral.
- Source: Sample, Custom, Imported, or SRD / Creative Commons.
- Challenge rating ranges.
- Size.

These filters operate only on local sample data in this pass.

## Selected Creature Preview

Clicking a creature row selects it and updates the detail panel. The preview is
stat-block style, but it intentionally avoids copying any third-party visual
design.

The detail panel shows:

- Name, role/type, source, CR, and size.
- AC, HP, speed, and initiative bonus.
- Ability scores.
- Senses and languages.
- Traits, actions, bonus actions, reactions, legendary actions, and lair actions
  when present.
- Notes and tags.

## Source and License Metadata

The Library now has a visible source metadata area so future import workflows
can show where a creature came from.

Current local source examples include:

- Sample: original sample content made for this project.
- Custom: placeholder for user-created creatures.
- Imported: placeholder for future pasted stat block review output.
- SRD / Creative Commons: placeholder for future SRD 5.1 CC-BY-4.0 imports.

Future SRD imports should preserve license, attribution, source name, source
document version, and source URL metadata separately from non-SRD or
user-provided content.

## Actions

The detail panel includes placeholder actions:

- Add to Builder: currently switches to the Builder view only.
- Edit Creature later.
- Duplicate later.
- Delete/Archive later.

Persistent create, edit, duplicate, archive, and import behavior should be added
later when the database and auth model are ready.

## Not Wired Yet

This pass intentionally does not include:

- Supabase reads or writes.
- Auth or RLS.
- SRD importer implementation.
- Paste-stat-block parsing.
- Official copyrighted monster data.
- Runtime fetching from GitHub or other external sources.

Future database work may need creature template ownership fields, source/license
metadata, import review status, and campaign/encounter usage relationships.
