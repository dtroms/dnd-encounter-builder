# Sample Seed Plan

The current app should keep using local sample data for now. This document describes how those original/custom samples can later become seed data for local development or a test database.

## Seed Data Rules

- Use only original/custom creatures created for this app.
- Do not include official copyrighted D&D monster stat blocks.
- Do not scrape or import from D&D Beyond or any external source for seed data.
- Keep sample data clearly marked as `source_type = 'sample'`.
- Seed data should be safe to delete/recreate in local development, but migrations should not include destructive seed behavior.

## Creature Template Seeds

Seed creature templates should include:

- 3 player characters
- 4 goblin-style enemies
- 1 shadow-hound-style monster
- 1 boss monster
- 1 neutral NPC

Each creature should include:

- name
- combatant type
- size
- AC
- HP
- speed
- initiative bonus
- ability scores
- traits
- actions
- bonus actions where relevant
- reactions where relevant
- legendary actions where relevant
- lair actions where relevant
- notes
- tags
- source metadata set to sample/manual

## Encounter Seed

A useful seed encounter should include:

- Party combat group
- Red Warband combat group
- Blue Warband combat group
- Gold Warband combat group
- several live combatant snapshots
- a boss with legendary actions
- at least one combatant with lair actions
- a synthetic Lair Action initiative row at initiative 20
- one planned wave/reinforcement

## Runtime State Seed

The encounter seed can demonstrate:

- current round
- current turn index
- initiative values
- one manually entered PC initiative
- one auto-rolled enemy initiative
- one shared group initiative example
- current HP below max for one combatant
- one or two active conditions
- selected entry id
- active combatant id

## Import Seed

Optional later seed data can include a fake pasted stat block import attempt using original text only.

Example statuses:

- `draft`: raw text exists but has not been parsed
- `parsed`: parser created a draft structure
- `reviewed`: user confirmed edits
- `saved`: linked to a saved creature template
- `failed`: parser could not produce a useful result

No official monster text should be used in import seed data.

## Not In This Pass

This pass does not create executable seed scripts or insert sample rows into a database. It only defines how current local sample data should be represented when database seeding is added later.
