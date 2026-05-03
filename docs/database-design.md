# Database Design

## Database Goals

This database foundation is for the D&D Encounter Builder and Initiative Tracker. It is meant to support saved encounters, reusable creature records, custom monsters, pasted stat block imports, planned waves, combat groups, initiative state, HP/runtime state, and synthetic initiative rows.

This database foundation includes planning, schema, TypeScript record types, mapper scaffolding, and local sample seed data. The current app still uses local React state and local sample data.

The main design rule is:

Creature templates are reusable library records. Encounter combatants are live snapshots inside a specific encounter.

That separation keeps a saved or running encounter stable if a reusable library creature is edited later.

## App Sections Supported By The Database

The schema is intended to support these app areas:

- Saved Encounters Dashboard
- Encounter Builder
- Encounter Runner
- Creature Library
- Stat Block Importer

The database does not implement these screens in this pass. It only gives them a shared model to build on later.

## Core Entities

- `creature_templates`: reusable creatures for the Creature Library, including PCs, monsters, NPCs, summons, bosses, custom creatures, and imported creatures.
- `stat_block_imports`: raw stat block import attempts before they become saved creatures.
- `encounters`: saved encounter containers for the dashboard, builder, and runner.
- `encounter_combatants`: live combatant snapshots inside one encounter.
- `combat_groups`: encounter-specific groups such as Party, Red Warband, or Skullfang Pack.
- `encounter_waves`: planned waves or reinforcements.
- `encounter_wave_members`: planned creature quantities inside a wave.
- `initiative_entries`: tracker rows, including real combatants and synthetic rows such as Lair Actions.
- `encounter_log`: future combat history, undo, and activity feed.

## Table List

Initial schema tables:

- `creature_templates`
- `stat_block_imports`
- `encounters`
- `encounter_combatants`
- `combat_groups`
- `encounter_waves`
- `encounter_wave_members`
- `initiative_entries`
- `encounter_log`

## Saved Encounters Dashboard

The dashboard should start from `encounters`.

Dashboard-friendly fields include:

- `name`
- `description`
- `location`
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
- `notes`
- `created_at`
- `updated_at`

The dashboard can search by name/location/notes later, filter by `status`, and open an encounter in either Builder or Runner. Future duplicate/archive/delete behavior can operate on `encounters` plus its child rows.

Stored dashboard summary fields should be treated as convenience snapshots, not the source of truth. Counts and flags can be recomputed from `encounter_combatants` and `initiative_entries` whenever an encounter is saved, duplicated, or opened.

Statuses should include:

- `draft`
- `running`
- `completed`
- `archived`

## Creature Library

The Creature Library is based on `creature_templates`.

Templates are reusable records with stat block data, tags, source metadata, and import metadata. They should include both original sample creatures and user-created/imported creatures later. Official copyrighted monster data should not be bundled.

## Stat Block Importer

The Stat Block Importer is its own workspace, separate from the Encounter Builder.

Recommended flow:

1. User opens the Stat Block Importer.
2. User pastes stat block text or provides a future supported source URL.
3. The app creates a `stat_block_imports` draft record.
4. A parser attempts to fill `parsed_result`.
5. User reviews and edits parsed fields.
6. User approves the result.
7. The app creates a `creature_templates` record.
8. The import record changes to `status = 'saved'` and points to the new creature template.

A messy pasted stat block should not immediately become a saved creature. It should first be an import attempt, then a reviewed draft, then a saved creature template.

## Encounter Builder

The Builder should use `encounters`, `creature_templates`, `combat_groups`, `encounter_waves`, and `encounter_wave_members`.

Builder responsibilities later:

- choose creature templates from the library
- create combat groups
- plan waves/reinforcements
- set quantities
- preview difficulty metadata
- create encounter combatant snapshots when the encounter is prepared or started

The Builder should not mutate running combatant state unless the user intentionally applies changes to the live encounter.

## Encounter Runner

The Runner uses live encounter data:

- `encounters` for round, current turn, and selected row
- `encounter_combatants` for HP, conditions, initiative, notes, snapshots, and group assignment
- `combat_groups` for group names/colors/counts
- `initiative_entries` for normal and synthetic tracker rows
- `encounter_log` later for history and undo

The current UI is not wired to these tables yet.

## Why Creature Templates And Encounter Combatants Are Separate

Creature templates are reusable library records. Encounter combatants are live copies used inside a specific encounter.

Example:

- A template named "Cindercap Sneak" exists in the Creature Library.
- The DM adds three copies to an encounter.
- The encounter creates three `encounter_combatants` with names such as "Cindercap Sneak 1", "Cindercap Sneak 2", and "Cindercap Sneak Alpha".

If the library template changes later, those live combatants should not change automatically. A running encounter needs stability.

## How Encounter Combatants Are Snapshots/Copies Of Templates

`encounter_combatants` can keep `creature_template_id` as a source reference, but it also stores the runtime copy:

- display name
- combatant type/role
- AC
- max HP
- current HP
- speed
- initiative bonus
- traits/actions/reactions/legendary actions/lair actions
- notes
- tags
- conditions
- group assignment

This lets a saved encounter resume exactly as it was.

## How Combat Groups Work

Combat groups are encounter-specific, not global library folders.

Examples:

- Party
- Red Warband
- Gold Warband
- Skullfang Pack

`combat_groups` stores group name, color, and sort order. `encounter_combatants.combat_group_id` links a combatant to one group.

The current Runner workflow maps cleanly to this:

- groups are created and managed in the Combat Groups card
- row-level assignment uses existing created groups
- group counts derive from assigned combatants
- row tint and end-cap use the group's `color_key`
- group Roll Init and Shared Init operate on assigned eligible combatants

Ungrouped combatants do not need a database row. A null `combat_group_id` is enough to represent Ungrouped / No Group. Counts should be derived from `encounter_combatants`, not stored on `combat_groups`.

This review did not add `is_default`, `is_party_group`, or `created_from_template`. Those can be added later if the Builder needs starter templates or campaign-level party defaults, but they are not required for the current Runner workflow.

## How Waves/Reinforcements Work

`encounter_waves` stores planned reinforcement groups for an encounter.

`encounter_wave_members` stores planned template quantities and optional default group assignment.

When a wave is deployed later, the app can create `encounter_combatants` snapshots from the wave members. `deployed` and `deployed_at` record whether the wave has entered play.

Deployment should also create or refresh normal `initiative_entries` for the new combatants. If a deployed creature has lair actions, the Runner can create or reveal the relevant synthetic Lair Action row.

## How Initiative State Works

High-level state lives on `encounters`:

- `current_round`
- `current_turn_index`
- `active_entry_id`
- `selected_entry_id`

Tracker rows live in `initiative_entries`. This is useful because not every row is a real creature. Lair Actions are already synthetic rows in the current Runner.

`active_entry_id` is the currently acting row. `selected_entry_id` is the row the user clicked for inspection. These are intentionally separate because the Runner allows the selected row and active turn row to be different.

## Initiative Logic

Normal roll:

- roll `d20 + initiative_bonus`

Global Roll NPC Init:

- rolls eligible non-PC combatants
- does not roll PCs by default

Group Roll Init:

- rolls each eligible combatant in the group separately
- does not roll PCs by default
- does not roll synthetic Lair Action rows

Shared Init:

- rolls each eligible group member behind the scenes
- averages the rolled totals
- rounds with `Math.round`
- applies the same result to eligible group members
- does not overwrite PCs by default
- does not affect synthetic Lair Action rows

Manual typed initiative:

- user input wins
- typed value overrides the current initiative value

## How Synthetic Initiative Entries Work

Synthetic entries are initiative tracker rows that are not normal combatants.

`initiative_entries` supports:

- `entry_type`
- `is_synthetic`
- `display_name`
- `initiative_value`
- `initiative_manually_set`
- `combatant_id`
- `source_combatant_id`
- `sort_order`
- `metadata`

This allows cosmetic overrides without losing the link to the real source combatant.

Normal combatant rows generally use `entry_type = 'combatant'` and point to `encounter_combatants.id` through `combatant_id`.

Synthetic Lair Action rows use `entry_type = 'lair_action'`, `is_synthetic = true`, and point to the owning monster through `source_combatant_id`. Their `display_name` and `initiative_value` are row-level cosmetic/current state, so renaming the row or changing INIT 20 to another number does not alter the owner monster.

Future custom rows, such as hazards or reminders, can use `entry_type = 'custom'` with `metadata` for extra details.

## How Synthetic Lair Action Rows Work

Synthetic Lair Action rows should:

- appear only when a tracked combatant has lair actions
- default to initiative 20
- allow cosmetic name overrides
- allow cosmetic initiative overrides
- remain linked to the source combatant through `source_combatant_id`
- continue showing the source combatant's lair action cards

Legendary Actions live in boss/monster rows. Lair Actions live in synthetic Initiative 20 rows.

If multiple combatants have lair actions, the synthetic row can group content by source owner inside the row.

## How HP/Runtime State Works

Runtime state belongs on `encounter_combatants`, not on `creature_templates`.

Important runtime fields:

- `max_hp`
- `current_hp`
- `temporary_hp`
- `initiative_value`
- `initiative_manually_set`
- `conditions`
- `notes`
- `is_active`
- `combat_group_id`

This lets the Runner save and resume combat.

`initiative_entries` may also store row-level initiative state. For normal combatants, the app can mirror or derive the tracker row from `encounter_combatants`. For synthetic/custom rows, `initiative_entries` is the source of the row display name and initiative.

## How Conditions Work

For MVP, `conditions` is a JSONB field on `encounter_combatants`. It can store the current list of active condition keys and later grow into richer objects if the app adds duration, save DC, source, or reminder metadata.

A later normalized `combatant_conditions` table is possible, but JSONB keeps the first database pass simple and aligned with current local state.

## How Legendary Actions And Lair Actions Are Stored

Stat block sections use JSONB for MVP:

- `traits`
- `actions`
- `bonus_actions`
- `reactions`
- `legendary_actions`
- `lair_actions`

Each action object should support:

- `id` or `slug`
- `name`
- `description`
- `attack_bonus`
- `damage`
- `recharge`
- `uses`

JSONB is best for MVP flexibility, homebrew formats, and pasted stat blocks. Normalized action tables can come later if advanced search, action tracking, or analytics require them.

## What Is Reusable Creature Data vs. Encounter Runtime State

Reusable creature data:

- name
- type/role
- size
- AC
- HP
- speed
- initiative bonus
- challenge rating for monsters, bosses, NPCs, and neutral creatures where useful
- ability scores
- senses/languages
- traits/actions/reactions/legendary actions/lair actions
- tags
- source/import metadata

Encounter-specific runtime state:

- display name override
- current HP
- temporary HP
- conditions
- combat group assignment
- wave assignment
- initiative value
- manual initiative flag
- active turn
- selected row
- synthetic row overrides
- encounter notes

## How Pasted Stat Blocks Flow Into Review And Saved Creature Templates

The importer should save raw input first:

1. Create `stat_block_imports` with `raw_text`, `import_method = 'paste'`, and `status = 'draft'`.
2. Parser writes `parsed_result`, `parser_confidence`, and `parse_errors`.
3. User reviews and edits the parsed fields in a future review screen.
4. On approval, create `creature_templates` with `source_type = 'imported'`.
5. Copy useful source metadata to the template.
6. Update import status to `saved` and set `creature_template_id`.

This makes failed or messy imports recoverable without polluting the Creature Library.

## Future D&D Beyond/Homebrew Link Import Considerations

The schema includes `source_url` and `import_method` values such as `url` and `dndbeyond_homebrew` so future link-based workflows have a place to store metadata.

This does not implement scraping or integration.

Future link import must:

- use user-provided URLs
- respect access controls
- avoid private/protected content
- avoid bypassing website restrictions
- avoid bundling official copyrighted monster data
- require user review before saving

Source URLs can be stored as metadata even before the app knows how to parse them.

## Future Auth/User/Campaign Considerations

Most user-owned tables include nullable `owner_user_id`. That makes the database future-ready without adding auth now.

Later:

- RLS should ensure users only access their own creatures, imports, and encounters.
- Imported content should belong to the importing user unless intentionally shared.
- Campaign sharing could use `campaigns` and `campaign_members`.
- Public encounter or creature templates could be added separately.

RLS policies are not included in this pass because auth is not set up yet.

## MVP Database Scope vs. Later Features

MVP foundation in this pass:

- design document
- migration file
- TypeScript DB record types
- mapper scaffolding
- local sample seed plan and seed SQL

Later features:

- Supabase client setup
- actual local/remote migration application
- auth
- RLS policies
- Saved Encounters dashboard UI
- Builder database wiring
- Runner database wiring
- Stat Block Importer UI
- parser/review workflow
- combat log UI
- undo/history features
- campaign sharing

## What Is Intentionally Not Implemented Yet

This pass does not:

- wire the UI to a database
- add Supabase client setup
- add environment variables
- add auth
- add RLS policies
- start or apply a remote database
- replace local React state
- remove local sample data
- create the Saved Encounters dashboard UI
- create the Stat Block Importer UI
- add external APIs
- scrape D&D Beyond or any website
- bundle official copyrighted D&D monster data
- add payment, team, organization, or cloud sync features

## Schema Review Notes

This review tightened the schema around the current Runner behavior and the planned Dashboard/Builder/Importer flow.

Decisions made:

- Added `active_entry_id` to `encounters` so the active turn row can be tracked separately from the selected inspection row.
- Kept `selected_entry_id` on `encounters` for the clicked/inspected row.
- Added row-level `initiative_manually_set` to `initiative_entries` so synthetic and future custom rows can record typed initiative overrides.
- Kept synthetic Lair Action rows in `initiative_entries`, linked to owners through `source_combatant_id`.
- Added modest dashboard summary fields to `encounters`: `last_opened_mode`, `accent_color`, `combatant_count_snapshot`, `boss_count_snapshot`, and `has_lair_actions_snapshot`.
- Kept combat group counts computed from `encounter_combatants` rather than stored on `combat_groups`.
- Kept Ungrouped / No Group as `combat_group_id = null` rather than forcing a database row.
- Kept conditions as JSONB on `encounter_combatants` for MVP flexibility.

Intentionally deferred:

- No normalized action tables yet; stat block sections remain JSONB.
- No normalized condition duration/source table yet.
- No group template/default party model yet.
- No RLS/auth policies yet.
- No Supabase client setup.
- No UI database wiring yet.

Before connecting Supabase, the next pass should apply this migration to a local development database, generate or verify database types against the actual schema, and decide the first read/write boundary, likely Creature Library or Saved Encounters Dashboard before the live Runner.
