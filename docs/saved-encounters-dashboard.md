# Saved Encounters Dashboard

The Saved Encounters Dashboard is now planned as a main app section and the app's starting view.

The dashboard now has first-pass Supabase metadata persistence for signed-in
beta users. When Supabase is configured and the user is signed in, it reads and
manages rows from the `encounters` table. When Supabase is not configured, the
dashboard keeps using local mock/demo data.

This pass only wires Saved Encounter metadata. It does not load full combatants,
groups, waves, or initiative state into Builder or Runner yet.

## Current Master-Detail Dashboard

The dashboard uses a master-detail layout with a clear user-facing purpose: choose an encounter to run, edit, or review.

- Left column: saved encounter picker.
- Right column: selected encounter briefing.

On desktop, the left column is the chooser and the right column is the selected encounter dossier. On smaller screens, the layout stacks so the selected details appear below the list.

The top header is intentionally plain:

- Saved Encounters
- Choose an encounter to run, edit, or review.
- Create New Encounter

## Campaign Tabs And Management

The dashboard now has manageable campaign tabs above the two-column layout:

- All Campaigns
- Unassigned
- user-created campaigns

Campaign tabs filter saved encounters first. Search, status filters, and sort
then apply inside the selected campaign result. `All Campaigns` shows every
encounter. `Unassigned` shows encounters with no campaign assignment.

Signed-in users can create campaigns, rename campaigns, and archive campaigns.
Archiving a campaign does not delete encounters. Encounters assigned to that
campaign are moved to Unassigned.

Local demo mode uses local/session campaign state. Supabase mode uses the
`campaigns` table and `encounters.campaign_id`.

## Left Encounter List

The left column is labeled `Your Encounters`. Search, status filter, and sort controls sit in a shared dashboard control row above the two columns so the left encounter list and right selected encounter hero start at a more intentional height.

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
- Edit Encounter action
- Duplicate and Archive actions

Open Runner is primary for running encounters. Open Builder is primary for
drafts. Duplicate is a secondary action, and Archive is a muted danger action
with confirmation.

Edit Encounter opens a compact form for changing the encounter name,
description, location, status, campaign assignment, difficulty label, party
level, party size, and notes.

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

## Supabase Metadata Mode

When signed in with Supabase configured, the dashboard:

- fetches the signed-in user's encounter rows through RLS
- fetches the signed-in user's active campaign rows through RLS
- maps `encounters` rows into the dashboard card/detail view
- maps campaign names onto encounter cards through `campaign_id`
- creates a new draft encounter shell
- creates, renames, and archives campaigns
- updates encounter metadata, including name and campaign assignment
- duplicates encounter metadata into a new draft row
- archives an encounter by setting `status = 'archived'`
- keeps search, status filtering, and sorting in the client UI

Database reads and writes are limited to the `encounters` table in this pass.
The campaign management pass also uses the `campaigns` table. The app does not
fetch child combatants, combat groups, waves, initiative rows, or logs for the
dashboard yet.

The dashboard shows loading, empty, and safe error states around Supabase calls.

## Local Demo Fallback

When Supabase env vars are missing, or `NEXT_PUBLIC_USE_DEMO_DATA=true`, the
dashboard keeps using local mock data.
Search, status filtering, sorting, selected encounter state, tabs, notes,
reminders, duplicate, and archive continue to work in local/session state.
Local campaign create, rename, archive, and encounter metadata editing also work
in local/session state.

This fallback keeps development and tabletop demos usable without a database.

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

Campaign support now uses a separate `campaigns` table with encounter records
linked by `campaign_id`. `All Campaigns` is a UI filter, not a database row.
`Unassigned` means `campaign_id` is null.

## Actions

Duplicate and Archive work in local/session state for demo mode and against
Supabase encounter rows for signed-in users.

- Create New Encounter creates a draft encounter shell in Supabase when signed
  in. If a real campaign tab is selected, the new encounter starts in that
  campaign. It does not create combatants or groups yet.
- Duplicate creates a metadata-only copy, marks it Draft, clears last played,
  and selects the copy. Deep-copying combatants/groups/waves comes later.
- Archive asks for confirmation, changes status to Archived, and keeps the
  encounter in the list.
- Edit Encounter updates the selected encounter metadata locally or in Supabase.
- Archive Campaign archives/removes the campaign from the visible tabs and moves
  its encounters to Unassigned.

Archive is not a permanent delete. Archived encounters remain visible in All or
Archived filters.

Open Builder and Open Runner still navigate to the current local prototype
state. Loading a selected database encounter into Builder/Runner is the next
data-wiring step.
