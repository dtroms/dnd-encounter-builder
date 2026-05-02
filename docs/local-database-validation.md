# Local Database Validation

## Purpose

This document records the first local-only validation pass for the initial database migration.

The goal was to verify whether the schema can be applied to a local database before creating seed data or wiring the UI.

## Files Checked

- `supabase/migrations/20260502_000001_initial_schema.sql`
- `docs/database-design.md`
- `src/lib/encounter/db-types.ts`
- `package.json`
- `supabase/`

## Local Tooling Check

The repository currently has:

- a `supabase/migrations/` folder
- no `supabase/config.toml`
- no package scripts for Supabase
- no committed Docker Compose setup

The local environment check found:

- Supabase CLI was not available
- `psql` was not available
- Docker CLI was not available

Because those tools were not available, the migration was not executed against a live local database in this pass.

## Commands Run

Repository/tooling inspection:

```powershell
Get-ChildItem -Force
Get-ChildItem supabase -Force
Get-Content package.json
Get-Command supabase -ErrorAction SilentlyContinue
Get-Command psql -ErrorAction SilentlyContinue
Get-Command docker -ErrorAction SilentlyContinue
```

Validation checks:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Static SQL Review Result

The migration was reviewed statically for:

- table creation order
- UUID primary keys
- foreign keys
- nullable `owner_user_id` fields
- JSONB defaults
- timestamp defaults
- updated_at trigger function and triggers
- indexes
- no destructive statements
- no auth dependency
- no remote database dependency
- no official D&D data inserts

Static review result: no blocking SQL design issues were found.

## Migration Structure Notes

The table order is designed to avoid missing references:

- `creature_templates` is created before import/template references.
- `stat_block_imports` is created before its optional `encounter_id` foreign key is attached.
- `encounters` is created before encounter-owned tables.
- `combat_groups` is created before combatant group references.
- `encounter_combatants` is created before initiative row references.
- `encounter_waves` is created before the `wave_id` foreign key is attached.
- `initiative_entries` is created before `encounters.active_entry_id` and `encounters.selected_entry_id` are attached.

The migration includes a generic `public.set_updated_at()` trigger helper and updated_at triggers for tables that have an `updated_at` column.

## Smoke Test Status

A database smoke test was not run because no local database runner was available.

When local database tooling is available, a safe smoke test should:

1. Apply the migration to a local-only database.
2. Open a transaction.
3. Insert one fake/original creature template.
4. Insert one encounter.
5. Insert one combat group.
6. Insert one encounter combatant linked to the encounter/template/group.
7. Insert one normal initiative entry linked to the combatant.
8. Insert one synthetic `lair_action` initiative entry linked through `source_combatant_id`.
9. Select the rows back.
10. Roll the transaction back.

No permanent seed data should be created during that smoke test.

## How To Run Local Validation Later

If Supabase CLI and Docker are installed later, initialize local Supabase config if needed:

```powershell
supabase init
```

Then run local-only validation:

```powershell
supabase start
supabase db reset
supabase migration list
supabase status
```

If using plain Postgres instead of Supabase, run the migration against a throwaway local database:

```powershell
psql -d dnd_encounter_builder_local -f supabase/migrations/20260502_000001_initial_schema.sql
```

Do not run these commands against a remote Supabase project for this validation step.

## What Was Intentionally Not Done

This pass did not:

- connect to a remote Supabase project
- start a remote database
- add Supabase client setup
- add environment variables
- add auth
- add RLS policies
- wire the UI to database calls
- create seed data
- scrape or import from external websites
- add official copyrighted D&D monster data

## Current Readiness

The migration is ready for the next local validation attempt once Supabase CLI/Docker or another local Postgres workflow is available.

The project is not ready for seed data until the migration has been executed successfully against a local database.
