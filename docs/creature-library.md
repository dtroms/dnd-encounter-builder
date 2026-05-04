# Creature Library

The Creature Library is the planned home for saved creatures, custom monsters,
and imported stat blocks. It now has first-pass Supabase persistence for
signed-in beta users. When Supabase is configured, the user is signed in, and
local demo mode is off, the Library reads and writes `creature_templates` rows.

When Supabase is not configured or `NEXT_PUBLIC_USE_DEMO_DATA=true`, the Library
keeps using local mock/session data.

The Library remains the in-session source of truth for creature templates used by
the Builder. In signed-in mode, fetched Supabase creature templates are loaded
into that shared in-session list, so the Builder can see them during the current
session. Builder encounter save/load is not database-wired yet.

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

These filters operate on whichever creature list is active: signed-in Supabase
creatures or local demo/sample creatures.

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

The Library now supports creature management:

- Create Creature opens a compact editor and adds a new custom creature.
- Edit Creature opens the same editor with the selected creature pre-filled and
  updates the template after saving.
- Duplicate Creature copies the selected creature into a custom variant and
  selects the duplicate.
- Remove from Library asks for confirmation, then removes the template from the
  Library and Builder creature browser.

In signed-in Supabase mode, those actions operate on `creature_templates` rows
owned by the current user. In local demo mode, those actions remain local/session
state only.

Created, edited, and duplicated creatures appear in the Builder during the same
session because the Builder uses the Library-backed local creature list.

Existing encounter combatants already added to a roster are snapshots. They do
not need to retroactively update when a Library template is edited or removed.

The current database schema does not include a soft-delete/archive flag for
`creature_templates`, so signed-in Remove from Library currently deletes the
template row. Existing encounter combatant snapshots should remain separate from
library templates. A future migration should prefer soft-delete/archive behavior
before broader persistence is exposed.

## Source and License Metadata

The Library now has a visible source metadata area so future import workflows
can show where a creature came from.

Current local source examples include:

- Sample: original sample content made for this project.
- Custom: placeholder for user-created creatures.
- Imported: placeholder for future pasted stat block review output.
- SRD / Creative Commons: placeholder for future SRD 5.1 CC-BY-4.0 imports.

The Importer can save a reviewed pasted stat block into the Creature Library.
In signed-in mode, pasted imports create private `creature_templates` rows owned
by the current user. In local demo mode, pasted imports still save into the
shared local/session creature list. Those creatures use the Imported source
badge and become searchable in both the Library and Builder during the current
session.

The hidden SRD importer work can also save Ready records through the same
Library save path when enabled for development. It remains hidden from the
normal beta UI unless `NEXT_PUBLIC_ENABLE_SRD_IMPORT=true`.

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

User-created and user-edited creatures use the same `characterSheetUrl`,
`characterSheetTitle`, and `externalSheetNotes` fields as sample creatures, so a
saved custom link displays with the same Library detail treatment as the sample
linked-sheet example.

When a Library creature with a linked sheet is added to an encounter, the local
combatant snapshot keeps the character sheet URL and display title. In the
Encounter Runner, combatants with linked sheets show a small sheet icon next to
their name in the initiative tracker. Clicking it opens the same embedded viewer
when the host website allows iframes, and Open in New Tab remains available as
the fallback. The selected combatant stat panel also shows a small external
sheet action.

For the current local prototype, editing a Library creature also syncs the
external sheet URL, title, and notes onto matching current encounter combatants
with the same template id. This lets a player character such as Aria Vale show
the Runner sheet icon immediately after the Library edit is saved, without
changing that combatant's HP, initiative, conditions, or custom display name.

## Actions

The detail panel includes placeholder actions:

- Add to Builder: currently switches to the Builder view only.
- Edit Creature: updates local/session state or the signed-in user's Supabase
  creature row.
- Duplicate Creature: creates a local/session variant or a signed-in Supabase
  copy.
- Remove from Library: removes the local/session template or deletes the
  signed-in Supabase row after confirmation.

Importer paste saves now create signed-in `creature_templates` rows when
Supabase mode is active, or local/session creatures in demo mode.

## Not Wired Yet

This pass intentionally does not include:

- Builder save/load persistence.
- Runner combat/runtime persistence.
- `stat_block_imports` import history writes.
- Visible SRD importer tools in normal beta UI.
- Paste-stat-block parsing beyond the current heuristic local review scaffold.
- Official copyrighted monster data.
- Runtime fetching from GitHub or other external sources.

Future database work may need creature template soft-delete/archive fields,
character sheet URL columns, import review status, and campaign/encounter usage
relationships.
