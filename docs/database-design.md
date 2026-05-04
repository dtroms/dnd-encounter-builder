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
- `campaigns`: user-owned campaign folders for organizing saved encounters.
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
- `campaigns`
- `encounters`
- `encounter_combatants`
- `combat_groups`
- `encounter_waves`
- `encounter_wave_members`
- `initiative_entries`
- `encounter_log`
- `profiles`

`profiles` is the app-facing user profile table for beta auth. Its `id` matches
`auth.users(id)`, and it stores display-friendly metadata such as email,
display name, avatar URL, and role. Sensitive auth data stays in Supabase Auth.

## Saved Encounters Dashboard

The dashboard should start from `encounters`, with optional organization through
`campaigns`.

The current UI includes a local mock Saved Encounters Dashboard shell as the app's starting view. It is not wired to Supabase yet.

Dashboard-friendly fields include:

- `campaign_id`
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

## Campaigns

Campaigns are user-owned folders for encounters. The `campaigns` table stores:

- `owner_user_id`
- `name`
- `description`
- `accent_color`
- `status`
- `sort_order`
- timestamps

`encounters.campaign_id` links an encounter to a campaign. `All Campaigns` is a
UI filter and is not a database row. `Unassigned` means
`encounters.campaign_id` is null.

Archiving a campaign should not delete encounters. The beta-safe behavior is to
archive the campaign and set affected encounter `campaign_id` values to null so
those encounters remain visible under Unassigned.

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
- `snapshot_metadata.spellEffects` for the current beta pass

This lets the Runner save and resume combat.

`initiative_entries` may also store row-level initiative state. For normal combatants, the app can mirror or derive the tracker row from `encounter_combatants`. For synthetic/custom rows, `initiative_entries` is the source of the row display name and initiative.

The first Runner persistence pass stores spell effects in `snapshot_metadata`
instead of mixing them into standard conditions. A future migration can add a
dedicated `spell_effects` JSONB column or child table if custom durations,
concentration links, or reminders become important.

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

## Creative Commons SRD Monster Library Imports

SRD monster imports should be planned as a separate Creature Library workflow from pasted stat block imports.

Pasted stat block import is for messy, individual, user-provided content. Creative Commons SRD import is for a structured bulk source that can populate reusable `creature_templates` with source, license, and attribution metadata.

Imported SRD creatures should remain distinguishable from original/custom sample creatures and user-provided pasted imports. Useful metadata on imported `creature_templates` should include:

- `source_type = 'srd'`
- `source_name`
- `source_document_version`
- `license_name`
- `source_url`
- attribution text or attribution metadata
- import batch metadata where useful

### Planned Source: Tabyltop CC-SRD

Planned source metadata:

- `source_name`: `Tabyltop CC-SRD`
- `source_type`: `srd`
- `source_document_version`: `SRD 5.1`
- `license_name`: `CC-BY-4.0`
- `source_url`: `https://github.com/Tabyltop/CC-SRD`

Creature templates imported from this source should preserve attribution/source metadata so the app can display or export proper SRD/Creative Commons attribution later.

The Tabyltop CC-SRD repository contains SRD 5.1 Creative Commons content converted into machine-friendly formats. Because it is converted from PDF/data formats, it may contain formatting or JSON conversion errors. The import workflow should include validation and normalization, and the app should not blindly trust imported JSON.

SRD import review should happen before records become official `creature_templates`. The future workflow should validate required creature fields, normalize data shape, surface warnings, and let the user review the import preview before saving all or selected SRD monsters into the Creature Library.

Runtime fetching from GitHub should be avoided for early beta unless caching, version pinning, outage handling, and error handling are designed. The preferred beta path is a local adapter script or curated import file, reviewed output, and then a deliberate database import.

## Future D&D Beyond/Homebrew Link Import Considerations

The schema includes `source_url` and `import_method` values such as `url` and `dndbeyond_homebrew` so future link-based workflows have a place to store metadata.

## Future External Character Sheet Links

The local Creature Library UI can now store optional external character sheet
links for player characters and other creature records. This is local/session
state only for now.

Future database planning may need nullable fields on `creature_templates` or a
related table:

- `character_sheet_url`
- `character_sheet_title`
- `character_sheet_embed_enabled`
- `external_sheet_notes`

These links should be treated as user-provided references. The app should not
scrape external character sheets, store credentials, or attempt to bypass iframe
blocking headers. If an external site blocks embedding, the UI should provide an
Open in New Tab fallback.

This does not implement scraping or integration.

Future link import must:

- use user-provided URLs
- respect access controls
- avoid private/protected content
- avoid bypassing website restrictions
- avoid bundling official copyrighted monster data
- require user review before saving

Source URLs can be stored as metadata even before the app knows how to parse them.

## Auth, Profiles, And RLS Foundation

The app now has a Supabase Auth shell and a database security foundation. The UI
still uses local/session state for encounters, creatures, imports, builder state,
and runner state.

`profiles` is created by a Supabase Auth trigger:

- new auth user row inserted
- `public.handle_new_user()` creates `public.profiles`
- email is copied for display convenience
- display name comes from metadata or the email prefix

RLS is enabled for `profiles` and user-owned app tables. Root tables use
`owner_user_id = auth.uid()`:

- `creature_templates`
- `stat_block_imports`
- `campaigns`
- `encounters`

Encounter child tables are protected through parent encounter ownership:

- `combat_groups`
- `encounter_combatants`
- `encounter_waves`
- `encounter_wave_members`
- `initiative_entries`
- `encounter_log`

Ungrouped combatants remain represented by `combat_group_id = null`. Group and
wave rows are not public; they are accessible only when the parent encounter
belongs to the signed-in user.

The beta security stance is private-by-default. There are no public shared
creature libraries yet. SRD imports should later become user-owned
`creature_templates` unless a separate shared SRD catalog is deliberately added.

Local demo mode remains separate from signed-in persistence and should not be
treated as production user data.

## Future User Accounts And Support/Subscription Model

The app should eventually support persisted saved data after RLS is tested.

Future user accounts should unlock:

- saved encounters
- private creature libraries
- stat block imports
- cloud sync
- user settings
- support/subscription status

Most user-owned tables include nullable `owner_user_id` fields. When persistence
is wired later, client writes should set `owner_user_id` to the authenticated
user id for root records. Child rows should rely on parent encounter ownership.

Future account-related tables could include:

- `user_settings`: per-user app preferences. Possible fields include `user_id`, `default_runner_view`, `manual_pc_initiative_default`, `compact_mode`, `theme_preference`, `dice_roll_preference`, and `updated_at`.
- `user_support_status` or `billing_status`: future support, donation, or subscription state. Possible fields include `user_id`, `support_tier`, `support_status`, `provider_customer_id`, `provider_subscription_id`, `current_period_end`, and `updated_at`.

If subscriptions are added later, the support/billing table can store subscription provider customer ID fields such as `provider_customer_id`, `provider_subscription_id`, `provider_price_id`, and `provider_status`. These fields should identify the billing provider records without making the database depend on one provider before payments are actually implemented.

If donations or voluntary support are used instead, the same table can track non-subscription support state with fields such as `support_status`, `support_tier`, `last_supported_at`, `lifetime_support_amount_cents`, and `support_provider_customer_id`.

Later:

- RLS should be tested to ensure users only access their own creatures, imports, settings, support status, and encounters.
- Imported content should belong to the importing user unless intentionally shared.
- Campaign sharing could use a future `campaign_members` table.
- Public encounter or creature templates could be added separately.

No payment or subscription logic is included in the auth/RLS foundation.

### Monetization And Licensing Caution

Donations or voluntary support are likely safer than gating Wizards-related fan content. Monthly subscriptions should only be considered if they charge for tool features, storage, cloud sync, convenience, or other app functionality.

See `docs/product-boundaries.md` for the broader product/legal boundary plan before implementing auth, imports, donations, subscriptions, or paid plans.

The project should not:

- charge for access to official D&D/Wizards content
- bundle official monster stat blocks
- treat official non-SRD material as app-owned content
- add donation links, Stripe, subscriptions, or payment logic before a dedicated implementation pass

Imported stat blocks should be treated as user-provided content. The app can store user-provided imports for that user's own library later, but it should not package, redistribute, or sell official monster data.

D&D Beyond link import should remain future-only and must be legally and technically reviewed before any implementation. It should not scrape D&D Beyond or any other website, bypass access controls, or copy protected content.

SRD/Creative Commons content may be usable commercially with proper attribution, depending on the exact source and license terms. That should be handled carefully and separately from official non-SRD content.

Before launching subscriptions publicly, the project should get legal review or at least a dedicated licensing review focused on Wizards/D&D content, SRD/Creative Commons attribution, user-provided imports, and what paid features are actually being sold.

## Database Foundation Scope vs. Later Features

Foundation now in place:

- design document
- migration file
- TypeScript DB record types
- mapper scaffolding
- local sample seed plan and seed SQL
- Supabase client setup
- auth shell
- profiles table
- RLS policies

Later features:

- actual local/remote migration application
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
- No UI database wiring yet.
- No public/shared library policy yet.

Before connecting app data to Supabase, the next pass should apply these
migrations to a local development database, run RLS tests with at least two
users, generate or verify database types against the actual schema, and decide
the first read/write boundary, likely Creature Library or Saved Encounters
Dashboard before the live Runner.
