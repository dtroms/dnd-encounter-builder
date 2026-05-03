# Creature Library

The Creature Library is the planned home for saved creatures, custom monsters,
and imported stat blocks. It is currently a local mock-data UI only. It does
not read from or write to Supabase yet.

The Library is now the local source of truth for creature templates used by the
Builder. During the current browser session, the Builder receives the same local
creature list that the Library displays and edits.

The Library manages creatures. The Importer page handles SRD imports and pasted
stat block imports, so the Library header no longer shows a direct Import SRD
button.

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
- Monster Type: D&D-style taxonomy such as Humanoid, Beast, Monstrosity,
  Undead, or Custom / Other.
- Combat Role: how this app treats the creature in an encounter, such as PC,
  Enemy, Boss, NPC, Ally, Summon, Minion, or Neutral.
- Source: Sample, Custom, Imported, or SRD / Creative Commons.
- Challenge rating ranges.
- Size.

These filters operate only on local sample data in this pass.

Monster Type and Combat Role are intentionally separate. For example, a
Humanoid can be a Boss, a Beast can be a Summon, and an Undead can be an Enemy.

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

## Create, Edit, and Duplicate

The Library now supports local-only creature management:

- Create Creature opens a compact editor and adds a new custom creature to the
  shared local list.
- Edit Creature opens the same editor with the selected creature pre-filled and
  updates the local template after saving.
- Duplicate Creature copies the selected creature into a custom local variant
  and selects the duplicate.
- Remove from Library asks for confirmation, then removes the template from the
  local Library and Builder creature browser.

Created, edited, and duplicated creatures appear in the Builder during the same
session because the Builder uses the Library-backed local creature list.

Existing encounter combatants already added to a roster are snapshots. They do
not need to retroactively update when a Library template is edited or removed.

For the current local-only prototype, removing a creature deletes it from the
in-memory creature template list for this browser session. Future database
behavior should likely use archive or soft-delete behavior so saved encounter
history can still point at old template records safely.

## Source and License Metadata

The Library now has a visible source metadata area so future import workflows
can show where a creature came from.

Current local source examples include:

- Sample: original sample content made for this project.
- Custom: placeholder for user-created creatures.
- Imported: placeholder for future pasted stat block review output.
- SRD / Creative Commons: placeholder for future SRD 5.1 CC-BY-4.0 imports.

The Importer can now save a reviewed pasted stat block into the shared local
creature list for the current browser session. Those creatures use the Imported
source badge and become searchable in both the Library and Builder. This is
still local state only and does not persist to Supabase.

The Importer can also import selected SRD preview creatures into the same local
session list. Those creatures use the SRD / Creative Commons source badge and
preserve Tabyltop CC-SRD source, license, URL, and attribution metadata.

Future SRD imports should preserve license, attribution, source name, source
document version, and source URL metadata separately from non-SRD or
user-provided content.

## External Character Sheets

Create/Edit Creature now includes an optional External Character Sheet section.
Users can add:

- Character Sheet URL
- Display title
- Notes

The URL must start with `http://` or `https://`. `javascript:` and `data:` style
URLs are not accepted.

When a creature has a character sheet URL, the Library detail panel shows an
External Character Sheet section with:

- View Sheet
- Open in New Tab

View Sheet opens an in-app iframe panel using a sandboxed iframe. Some websites
block embedding with browser security headers such as X-Frame-Options or
Content-Security-Policy. The app cannot bypass those restrictions, so Open in
New Tab remains available as the safe fallback.

External character sheet links are user-provided links. The app does not scrape,
import, or read data from those pages.

When a Library creature with a linked sheet is added to an encounter, the local
combatant snapshot keeps the character sheet URL and display title. In the
Encounter Runner, combatants with linked sheets show a small sheet icon next to
their name in the initiative tracker. Clicking it opens the same embedded viewer
when the host website allows iframes, and Open in New Tab remains available as
the fallback. The selected combatant stat panel also shows a small external
sheet action.

## Actions

The detail panel includes placeholder actions:

- Add to Builder: currently switches to the Builder view only.
- Edit Creature: local/session-only template editing.
- Duplicate Creature: local/session-only custom variant creation.
- Remove from Library: local/session-only template removal with confirmation.

Persistent create, edit, duplicate, archive, and import behavior should be added
later when the database and auth model are ready.

## Not Wired Yet

This pass intentionally does not include:

- Supabase reads or writes.
- Auth or RLS.
- Persistent SRD importer implementation.
- Paste-stat-block parsing beyond the current heuristic local review scaffold.
- Official copyrighted monster data.
- Runtime fetching from GitHub or other external sources.

Future database work may need creature template ownership fields, source/license
metadata, import review status, and campaign/encounter usage relationships.
