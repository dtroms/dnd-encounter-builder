# Sample Seed Plan

The app should keep using local sample data for now. This document describes how the current original/custom samples can later become database seed data for development or testing.

## Seed Data Rules

- Use only original/custom creatures created for this app.
- Do not include official copyrighted D&D monster stat blocks.
- Do not scrape or import seed data from D&D Beyond or any external source.
- Mark local sample creatures with `source_type = 'sample'`.
- Keep seed scripts separate from destructive migrations.
- Seed data should be easy to recreate in local development later, but this pass does not insert rows.

## Creature Template Seeds

Seed `creature_templates` from current local sample data.

Include:

- player characters
- original goblin-style enemies
- shadow-hound-style monster
- neutral NPC
- boss with Legendary Actions
- boss/monster with Lair Actions

Each creature template should include:

- name
- combatant type
- size
- AC
- HP
- speed
- initiative bonus
- ability scores
- saving throws and skills where present
- senses and languages
- traits
- actions
- bonus actions where relevant
- reactions where relevant
- legendary actions where relevant
- lair actions where relevant
- notes
- tags
- source metadata set to sample/manual

## Saved Encounter Seed

A useful development encounter should include:

- `encounters` row with `status = 'running'`
- Party combat group
- Red Warband combat group
- Blue Warband combat group
- Gold Warband combat group
- several `encounter_combatants` created as snapshots from templates
- a boss with Legendary Actions
- at least one combatant with Lair Actions
- an `initiative_entries` synthetic Lair Action row
- one planned wave/reinforcement

## Runtime State Seed

The saved encounter seed can demonstrate:

- current round
- current turn index
- active entry id
- selected entry id
- initiative values
- one manually entered PC initiative
- one auto-rolled enemy initiative
- one shared group initiative example
- current HP below max for one combatant
- one or two active conditions
- active combatant state
- combat group assignments
- dashboard snapshots such as combatant count, boss count, and whether lair actions are present

## Combat Group Seed

Seed groups should be encounter-specific:

- Party
- Red Warband
- Blue Warband
- Gold Warband
- Skullfang Pack, if useful for a second example

Each group should have:

- name
- color key
- sort order

Counts should be derived from `encounter_combatants`, not stored directly.

## Wave Seed

Seed one reinforcement wave with:

- wave name
- description
- sort order
- `deployed = false`
- planned `encounter_wave_members`
- default combat group assignment where useful

When deployed later, these wave members should become live `encounter_combatants`.

## Synthetic Lair Action Seed

The sample encounter should include one synthetic Lair Action initiative row:

- `entry_type = 'lair_action'`
- `is_synthetic = true`
- `initiative_value = 20`
- `source_combatant_id` pointing to the boss/monster with lair actions
- display name such as `Lair Actions`

This demonstrates that Lair Actions are timing rows, not normal creature rows.

## Import Seed

Optional later seed data can include fake pasted stat block import attempts using original text only.

Example statuses:

- `draft`: raw text exists but has not been parsed
- `parsed`: parser created a draft structure
- `reviewed`: user confirmed edits
- `saved`: linked to a saved creature template
- `failed`: parser could not produce a useful result

No official monster text should be used in import seed data.

## Not In This Pass

This pass does not create executable seed scripts or insert sample rows into a database. It only defines how current local sample data should be represented when database seeding is added later.
