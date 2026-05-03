# Saved Encounters Dashboard

The Saved Encounters Dashboard is now planned as a main app section and the app's starting view.

This pass adds a UI shell only. It uses local mock data shaped like the `encounters` table and the validated seed data. It does not read from Supabase, create database rows, add auth, add RLS, or replace the current local Encounter Builder and Runner state.

## Current Master-Detail Dashboard

The dashboard uses a master-detail layout with a clear user-facing purpose: choose an encounter to run, edit, or review.

- Left column: saved encounter picker.
- Right column: selected encounter briefing.

On desktop, the left column is the chooser and the right column is the selected encounter dossier. On smaller screens, the layout stacks so the selected details appear below the list.

The top header is intentionally plain:

- Saved Encounters
- Choose an encounter to run, edit, or review.
- Create New Encounter

## Left Encounter List

The left column is labeled `Your Encounters` and groups the search, status filter, and sort controls above the saved encounter list. Its helper text is `Pick one to inspect or open.`

Each encounter row is compact and clickable. It shows:

- status chip
- encounter name
- short description
- location
- last played or updated date
- accent strip
- optional important chips such as Lair or Round number

The selected encounter has a stronger accent strip, brighter border/background treatment, and a `Selected` label so it is easier to distinguish from the rest of the list.

If search or filters return no results, the list shows `No encounters found` with a hint to clear filters or create a new encounter, plus a simple Clear Filters button.

## Right Encounter Briefing

The right column starts with a selected encounter hero/header section. It shows:

- status chip
- optional Boss chip
- optional Lair actions chip
- selected encounter name
- location
- readable description
- Open Runner and Open Builder actions
- quieter future Duplicate and Archive placeholders

Open Runner is primary for running encounters. Open Builder is primary for drafts. Duplicate and Archive remain disabled placeholders.

If no encounter is selected, the right panel shows a clear empty state: choose an encounter on the left to view details, open the Builder, or start the Runner.

## Detail Tabs

Below the hero, the right panel uses tabs so the dashboard does not show every detail at once:

- Overview
- Roster
- Notes

Only one tab is visible at a time. Tab state is local React state only.

## Overview Tab

Overview answers: `What kind of encounter is this?`

It uses a compact fact layout with secondary labels and readable values:

- Difficulty
- Party
- Current Round or Updated
- Last Played
- Special boss/lair indicators
- Location

Combatant count, boss count, and group count are not shown as prominent stat cards.

## Roster Tab

Roster answers: `Who is in this encounter?`

The roster is names-only. It shows:

- combatant name
- small role badge
- colored group marker that matches Encounter Runner group colors
- combatants grouped by combat group when practical

The roster shows the first 12 combatants and then a `+ X more in encounter` row when the encounter has more. It does not show HP, initiative, AC, conditions, stat blocks, or combat controls.

## Notes Tab

Notes answers: `What should I remember about this encounter?`

It shows the encounter note text and local mock reminders such as lair timing, reinforcements, or boss behavior. These notes are original/custom sample content only.

## Local Data Only

Search, status filtering, sorting, selected encounter state, tabs, notes, reminders, and combatant previews are local React/mock-data behavior only.

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
