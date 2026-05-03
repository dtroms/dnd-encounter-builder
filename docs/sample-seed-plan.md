# Sample Seed Plan

The app still uses local React state for the UI. The seed file added in this pass is only for local Supabase development and schema validation.

Executable seed file:

- `supabase/seed.sql`

## Seed Data Rules

- Use only original/custom creatures created for this app.
- Do not include official copyrighted D&D monster stat blocks.
- Do not scrape or import seed data from D&D Beyond or any external source.
- Mark local sample creatures with `source_type = 'sample'`.
- Keep seed scripts separate from destructive migrations.
- Seed data is local/dev sample content only.
- Do not connect this seed file to a remote Supabase project unless the data and deployment workflow are reviewed first.
- Do not wire the UI to these tables in this seed-only pass.

## Creature Template Seeds

`supabase/seed.sql` seeds `creature_templates` from the current original/custom app sample data in `src/lib/encounter/sample-data.ts`.

Seeded player characters:

- Aria Vale
- Mira Quill
- Tovin Bramble

Seeded original enemies and NPCs:

- Cindercap Sneak
- Rattlebone Slinger
- Murkpot Hexer
- Bristlejaw Guard
- Duskmaw Hound
- Velkora, Lantern Tyrant
- Sable Market Guide

The seeded template rows include name, creature type, size, role, AC, HP, speed, initiative bonus, challenge rating, ability scores, saving throws, skills, senses, languages, traits, actions, bonus actions, reactions, Legendary Actions, Lair Actions, notes, tags, and source metadata.

Challenge ratings are local sample/testing values only:

- Player characters use `challenge_rating = null`.
- Cindercap Sneak and Rattlebone Slinger preserve the current sample value `1/4`.
- Murkpot Hexer and Bristlejaw Guard preserve the current sample value `1/2`.
- Duskmaw Hound preserves the current sample value `2`.
- Velkora, Lantern Tyrant preserves the current sample value `6`.
- Sable Market Guide uses placeholder `0` because the current sample data does not define a CR for this neutral NPC.

These CR values are present so later difficulty tools can test encounter math against saved sample data. They should be treated as simple custom sample values, not official monster balance data. Future difficulty calculations can read `creature_templates.challenge_rating` for reusable library creatures and pair that with `encounter_combatants` counts when estimating a saved encounter.

Velkora is the sample boss and includes both Legendary Actions and Lair Actions. This avoids adding an extra non-sample boss just to test lair action behavior.

## Saved Encounter Seed

The seed creates one saved encounter:

- Name: `Goblin Ambush at the Lantern Alley`
- Status: `running`
- Current round: `1`
- Current turn index: `0`
- Location: `Lantern Alley market cut-through`
- Party level: `4`
- Party size: `3`
- Difficulty label: `Hard`
- Accent color: `Gold`

## Runtime State Seed

The saved encounter demonstrates:

- current round and current turn index
- active and selected initiative entry IDs
- manually entered PC initiative values
- non-PC initiative values
- current HP below max for Mira Quill and Bristlejaw Guard
- JSONB condition examples
- combat group assignments
- dashboard snapshots for combatant count, boss count, and lair action presence

## Combat Group Seed

The seed creates encounter-specific combat groups:

- Party
- Red Warband
- Gold Vanguard

Each group has a deterministic UUID, a color key, and a sort order. Ungrouped or neutral combatants use `combat_group_id = null`.

Counts should still be derived from `encounter_combatants`, not stored directly.

## Wave Seed

The seed creates one planned reinforcement wave:

- Wave name: `Wave 2: Reinforcements`
- Deployed: `false`
- Members: two Cindercap Sneaks and one Duskmaw Hound
- Default combat group: Red Warband

When deployed later, these wave members should become live `encounter_combatants`.

## Synthetic Lair Action Seed

The sample encounter includes one synthetic Lair Action initiative row:

- `entry_type = 'lair_action'`
- `is_synthetic = true`
- `initiative_value = 20`
- `combatant_id = null`
- `source_combatant_id` points to Velkora's encounter combatant snapshot
- display name: `Lantern Alley Lair Actions`

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

This pass does not:

- wire Builder, Runner, or Library UI to Supabase
- add auth
- add RLS
- add importer UI
- connect to a remote Supabase project
- add external monster data

## How To Apply Locally

From the project root, after local Supabase is available:

```bash
npx supabase db reset
```

`db reset` reapplies local migrations and then runs `supabase/seed.sql`.

After reset, validate the schema has no unexpected drift:

```bash
npx supabase db diff --local
```

Expected result after a clean local reset is:

```text
No schema changes found
```

Optional local row checks can be run in Supabase Studio or with a local SQL client:

```sql
select count(*) from public.creature_templates where source_type = 'sample';
select count(*) from public.encounters where name = 'Goblin Ambush at the Lantern Alley';
select entry_type, display_name, is_synthetic
from public.initiative_entries
where encounter_id = '10000000-0000-4000-8000-000000000001'
order by sort_order;
```

## Seed Safety

The seed uses deterministic UUIDs. Before inserting, it clears only the known deterministic sample encounter and sample creature template rows. It does not truncate whole tables and does not assume production data.
