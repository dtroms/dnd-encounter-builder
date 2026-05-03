# Saved Encounters Dashboard

The Saved Encounters Dashboard is now planned as a main app section and the app's starting view.

This pass adds a UI shell only. It uses local mock data shaped like the `encounters` table and the validated seed data. It does not read from Supabase, create database rows, add auth, add RLS, or replace the current local Encounter Builder and Runner state.

## Current Master-Detail Shell

The dashboard uses a master-detail layout:

- Left column: saved encounter list with search, status filters, and sort controls.
- Right column: selected encounter details.

On desktop, the left column is the chooser and the right column is the selected encounter dossier. On smaller screens, the layout stacks so the selected details appear below the list.

The left list uses compact encounter rows. Each row shows the encounter name, status chip, short description, location, recent date, and accent marker. Large combatant, boss, and group stat cards are intentionally not shown in the list.

The right detail panel shows:

- selected encounter name, status, location, and description
- current round when running
- party level and party size
- difficulty label
- last played and updated dates
- lair action and boss indicators
- action buttons for opening Builder or Runner
- disabled placeholders for future Duplicate and Archive actions

The selected encounter description is treated as the main dossier note instead of being buried under large stat cards. Small facts and chips can summarize combatants, bosses, lair actions, dates, party level, party size, and difficulty without dominating the layout.

The detail panel also includes a names-only combatant preview. This list uses lightweight local mock data, shows combatant names with type badges, and uses group color markers that match the Encounter Runner color keys. Group names appear only when useful. Long lists are truncated to the first 10 combatants with a `+ X more` note.

Search, status filtering, sorting, and selected encounter state are local React state only.

The dashboard still uses local mock data only. It does not read from Supabase, write to Supabase, add auth, add RLS, or connect saved encounters to persistent storage yet.

## Future Database Wiring

When database wiring is added later, the dashboard should read from `encounters` and use its summary fields:

- `status`
- `last_played_at`
- `last_opened_mode`
- `accent_color`
- `difficulty_label`
- `party_level`
- `party_size`
- `estimated_difficulty`
- `combatant_count_snapshot`
- `boss_count_snapshot`
- `has_lair_actions_snapshot`

Group count can be derived from `combat_groups` for each encounter or stored as a future summary field if needed.

## Future Actions

Dashboard actions are placeholders in this pass.

Later:

- Create New Encounter should create a draft encounter.
- Open Builder should load the encounter into the Builder workspace.
- Open Runner should load running combat state.
- Duplicate should copy an encounter and its child rows.
- Archive/Delete should use a safe confirmation flow.

The current placeholder buttons only switch views or show disabled future actions.
