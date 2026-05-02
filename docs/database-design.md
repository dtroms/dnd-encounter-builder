# Database Design

## Database Goals

The database should support a local-first D&D Encounter Builder and Initiative Tracker that can later grow into saved libraries, saved encounters, pasted stat block imports, custom monsters, combat groups, waves, and persistent combat state.

This pass creates the foundation only. The current UI still uses local React state and local sample data.

The design must support:
- reusable creature records
- encounter-specific combatant snapshots
- combat groups and waves
- initiative state, including synthetic rows such as Lair Actions
- HP, conditions, and runtime edits
- imported stat blocks as user-provided content
- future auth and campaigns without requiring auth now

## Core Entities

The core model separates reusable library data from live encounter data:

- `creature_templates`: reusable creature, monster, NPC, summon, boss, or player character templates.
- `stat_block_imports`: raw pasted/imported stat block attempts before they become saved creatures.
- `encounters`: saved encounter containers.
- `encounter_combatants`: live copies/snapshots of templates in one encounter.
- `combat_groups`: encounter-specific groups like Party, Red Warband, or Gold Vanguard.
- `encounter_waves`: planned waves/reinforcements.
- `encounter_wave_members`: planned template quantities inside a wave.
- `initiative_entries`: tracker rows, including real combatants and synthetic entries.
- `encounter_log`: optional future combat history/undo trail.

## Table List

MVP schema tables:

- `creature_templates`
- `stat_block_imports`
- `encounters`
- `combat_groups`
- `encounter_combatants`
- `encounter_waves`
- `encounter_wave_members`
- `initiative_entries`
- `encounter_log`

## Templates vs. Encounter Combatants

Creature templates are reusable library records. Encounter combatants are live copies used inside one encounter.

This matters because a reusable creature can change later. For example, if a DM edits the template for a custom monster, that should not automatically rewrite a combatant already running in a saved encounter unless the DM intentionally refreshes that combatant.

`encounter_combatants` therefore stores snapshot fields such as AC, max HP, current HP, speed, actions, traits, legendary actions, and lair actions. The combatant can still point back to `creature_templates.creature_template_id`, but the encounter does not depend on the current template value during play.

## Combat Groups

Combat groups are encounter-specific. They are not global library categories.

Examples:
- Party
- Red Warband
- Blue Warband
- Skullfang Pack
- Gold Vanguard

`combat_groups` stores the group name and color key. `encounter_combatants.combat_group_id` links each live combatant to one group. Group initiative tools, shared initiative, row tinting, and far-right color end-caps should use this encounter-level group.

## Waves

Waves are planned reinforcements. `encounter_waves` stores the wave name, description, deployment state, and sort order.

`encounter_wave_members` stores planned creature template quantities for each wave, with an optional default combat group. When a wave is deployed later, the app can create `encounter_combatants` snapshots from those planned templates.

## Initiative State

`encounters` stores high-level tracker state such as `current_round`, `current_turn_index`, and `selected_entry_id`.

`initiative_entries` stores row-level tracker entries. This is useful because the current Runner already supports rows that are not normal creatures.

Entry types:
- `combatant`: points to an `encounter_combatant`
- `lair_action`: synthetic row tied to a source combatant
- `custom`: future reminder/timer row

## Synthetic Initiative Entries

Synthetic entries are tracker rows that are not normal combatants. They can still be clicked, renamed cosmetically, and assigned an initiative value.

`initiative_entries` supports:
- `is_synthetic`
- `source_combatant_id`
- custom `display_name`
- custom `initiative_value`

This preserves the link to the source monster while allowing the row label and initiative to be customized.

## Synthetic Lair Action Rows

Lair Actions should live in a synthetic initiative row. The default initiative is 20, but the user can override it cosmetically.

The synthetic row should:
- appear only when a tracked combatant has lair actions
- use `entry_type = 'lair_action'`
- point `source_combatant_id` to the boss/monster
- store custom display names like "Alley Lair Actions"
- store custom initiative values if the DM overrides the default

Legendary Actions stay inside the boss combatant row. Lair Actions live in the synthetic initiative row.

## Conditions

For MVP, conditions can be stored as a `text[]` column on `encounter_combatants`.

This is simple and matches the current local state. If durations, sources, save ends, concentration links, or reminders become important later, conditions can be normalized into a separate `combatant_conditions` table.

## HP And Runtime State

Runtime HP belongs on `encounter_combatants`, not on `creature_templates`.

Important fields:
- `max_hp`
- `current_hp`
- `temporary_hp`
- `initiative_value`
- `initiative_manually_set`
- `conditions`
- `notes`
- `is_active`

This lets a saved encounter resume exactly where it left off.

## Legendary Actions And Lair Actions

For MVP, stat block sections should be JSONB:
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

JSONB is flexible for homebrew, pasted stat blocks, and odd creature formatting. Normalized action tables can come later if searching, analytics, or advanced action tracking require it.

## Reusable Data vs. Encounter Runtime Data

Reusable creature data:
- name
- type/role
- size
- AC
- max HP
- speed
- initiative bonus
- ability scores
- senses/languages
- traits/actions/reactions/legendary/lair actions
- tags
- import/source metadata

Encounter-specific runtime data:
- display name override
- current HP
- temporary HP
- conditions
- combat group assignment
- wave assignment
- initiative value
- manual initiative flag
- selected row
- active turn
- synthetic row overrides
- encounter notes

## Stat Block Importing And Source Metadata

The app should eventually support copy/paste stat block import as a user-provided content workflow.

Flow:
1. User pastes raw stat block text.
2. The app creates a `stat_block_imports` record with `status = 'draft'` or `status = 'parsed'`.
3. A parser attempts to create a structured `parsed_result`.
4. The user reviews and edits the parsed fields.
5. Only after confirmation does the app create a `creature_templates` record.
6. The import record can then store `status = 'saved'` and point to the saved template.

Imported creature templates should use `source_type = 'imported'` or `source_type = 'custom'`. Useful import/source fields are stored directly on `creature_templates` for filtering:
- `source_name`
- `source_url`
- `import_method`
- `imported_at`
- `original_import_text`
- `parser_version`
- `parser_confidence`

`import_metadata` JSONB can store flexible extra details.

The original pasted/imported text may be stored for troubleshooting and re-parsing. Parser confidence and parse errors can be stored later. A future import review screen should show parsed fields before saving.

Link-based import is a future feature. It must respect access controls and legal constraints. Do not bypass protected content, do not scrape private content, and do not add D&D Beyond integration in this pass. D&D Beyond or homebrew source URLs can be stored as metadata if the user provides them.

## Future D&D Beyond/Homebrew Link Considerations

The schema allows source URLs and import methods such as `dndbeyond_homebrew`, but this does not mean the app currently imports from those links.

Future link import rules:
- user-provided URLs only
- no scraping protected/private pages
- no bypassing access controls
- user review before saving
- imported content belongs to the importing user unless explicitly shared
- no bundled official copyrighted monster data

## Future Auth, User, And Campaign Notes

Most tables include nullable `owner_user_id`. This is intentionally auth-ready but not auth-dependent.

Later, when auth exists:
- RLS should ensure users only access their own creature templates, imports, and encounters.
- Imported content should belong to the importing user.
- Campaign sharing can be added with tables like `campaigns` and `campaign_members`.
- Public/shared encounter templates can be added separately.

RLS is not implemented in this pass because the project does not have a configured auth/Supabase runtime yet.

## MVP Scope vs. Later Features

MVP database foundation:
- schema files
- database design docs
- TypeScript record types
- mapper helpers
- seed plan

Later:
- Supabase client setup
- auth
- RLS policies
- UI database wiring
- import parser
- import review screen
- campaign sharing
- combat log UI
- sync/offline strategy

## Intentionally Not Implemented Yet

This pass does not:
- connect the UI to Supabase
- add auth
- add RLS policies
- apply migrations to any database
- replace local React state
- remove sample data
- add official D&D monster data
- scrape D&D Beyond or external websites
- add external APIs
- add payment, teams, organizations, or cloud sync UI
