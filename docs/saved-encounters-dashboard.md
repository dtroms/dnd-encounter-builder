# Saved Encounters Dashboard

The Saved Encounters Dashboard is now planned as a main app section and the app's starting view.

This pass adds a UI shell only. It uses local mock data shaped like the `encounters` table and the validated seed data. It does not read from Supabase, create database rows, add auth, add RLS, or replace the current local Encounter Builder and Runner state.

## Current Master-Detail Dashboard

The dashboard uses a master-detail layout with a clear user-facing purpose: choose an encounter to edit, run, or review.

- Left column: choose an encounter.
- Right column: inspect and act on the selected encounter.

On desktop, the left column is the chooser and the right column is the selected encounter dossier. On smaller screens, the layout stacks so the selected details appear below the list.

The top header is intentionally plain:

- Saved Encounters
- Choose an encounter to edit, run, or review.
- Create New Encounter

## Left Encounter List

The left column is labeled `Your Encounters` and groups the search, status filter, and sort controls above the saved encounter list.

Each encounter row is compact and clickable. It shows:

- status chip
- encounter name
- short description
- location
- last played or updated date
- accent strip

The selected encounter has a stronger accent strip, brighter border/background treatment, and a `Selected` label so it is easier to distinguish from the rest of the list.

If search or filters return no results, the list shows `No encounters found` with a hint to clear filters or create a new encounter.

## Right Detail Panel

The right detail panel shows:

- selected encounter name, status, location, and description
- primary Open Runner/Open Builder actions near the selected encounter title
- an Overview section with status, difficulty, party, current round or updated date, last played, and special boss/lair indicators
- a Combatant Preview section
- quieter future management placeholders for Duplicate and Archive

The selected encounter description is shown in a highlighted block so the encounter premise is easier to read. The overview details use a compact grid with secondary labels and stronger values.

## Combatant Preview

The Combatant Preview is names-only. It shows:

- combatant name
- small role badge
- colored group marker that matches Encounter Runner group colors
- group name when helpful

The preview shows the first 8 combatants and then a `+ X more in encounter` row when the encounter has more. It does not show HP, initiative, conditions, stat blocks, or combat controls.

## Local Data Only

Search, status filtering, sorting, selected encounter state, and combatant previews are local React/mock-data behavior only.

The dashboard still uses local mock data only. It does not read from Supabase, write to Supabase, add auth, add RLS, or connect saved encounters to persistent storage yet.

## Previous Detail Fields

The dashboard still keeps the useful encounter summary information available in the selected detail panel:

- current round when running
- party level and party size
- difficulty label
- lair action and boss indicators
- action buttons for opening Builder or Runner
- disabled placeholders for future Duplicate and Archive actions

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
