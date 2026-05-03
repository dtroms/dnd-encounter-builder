# Local Supabase Setup Guide

This guide explains how to validate this app's database migration on your own computer without connecting to a remote Supabase project.

## What Local Supabase Is

Supabase local development runs a small local version of Supabase on your machine. It includes a local Postgres database and the services Supabase normally uses.

For this project, the main thing we need is the local Postgres database so we can prove the migration file works before creating seed data or wiring the UI.

## Why Docker Is Required

Supabase local development runs through Docker. Docker Desktop creates the local containers that hold the database and related services.

No Docker means `supabase start` and `supabase db reset` will not work.

## Local-Only Safety

The commands in this guide are intended for local development only.

They do not push code to GitHub. They do not connect this app to a remote Supabase project. They do not add auth. They do not wire the app UI to the database.

Avoid remote commands such as:

```powershell
supabase db push
supabase link
```

Those are not needed for this validation step.

## Tools Needed

You need:

- Docker Desktop
- Supabase CLI
- Node/npm, which this project already uses

## Confirm The Tools Are Installed

Open PowerShell in the project folder and run:

```powershell
docker --version
supabase --version
npm --version
```

Good signs:

- `docker --version` prints a Docker version.
- `supabase --version` prints a Supabase CLI version.
- `npm --version` prints an npm version.

If Docker is installed but the command fails, open Docker Desktop and wait until it says the engine is running.

## Initialize Local Supabase Config If Needed

This repo currently has migration files in `supabase/migrations/`, but it may not have `supabase/config.toml` yet.

Check with:

```powershell
dir supabase
```

If there is no `config.toml`, run:

```powershell
supabase init
```

This creates local Supabase configuration files. It should not connect to a remote project.

## Start Local Supabase

Run:

```powershell
supabase start
```

This may take a while the first time because Docker may need to download local images.

Good signs:

- The command finishes without an error.
- It prints local URLs and connection information.
- Docker Desktop shows Supabase containers running.

## Apply Or Reset Local Migrations

Run:

```powershell
supabase db reset
```

This resets the local database and applies the migration files in `supabase/migrations/`.

Important: this is safe for a local development database, but it destroys and recreates local database contents. Do not run it against a remote or production database.

Good signs:

- The command says migrations are being applied.
- The initial schema migration completes.
- No SQL error appears.

## Check Migration Status

Run:

```powershell
supabase migration list
supabase status
```

Good signs:

- The migration list shows `20260502_000001_initial_schema`.
- `supabase status` shows local services running.

## Stop Local Supabase

When finished, run:

```powershell
supabase stop
```

This stops the local Docker containers.

## Optional npm Shortcuts

This project includes local-only npm scripts for convenience:

```powershell
npm run db:start
npm run db:reset
npm run db:migrations
npm run db:status
npm run db:stop
```

These scripts are wrappers around local Supabase CLI commands. They do not push migrations to a remote database.

## Common Issues

### Docker command not found

Docker Desktop is not installed, or PowerShell cannot see it yet. Install Docker Desktop, restart PowerShell, and try again.

### Docker is installed but Supabase says Docker is not running

Open Docker Desktop and wait for it to fully start. Then rerun:

```powershell
supabase start
```

### Supabase command not found

Supabase CLI is not installed or is not on your PATH. Install the Supabase CLI, restart PowerShell, and try:

```powershell
supabase --version
```

### supabase db reset shows a SQL error

Copy the full error output and paste it back into ChatGPT. Include the few lines above and below the error.

Useful details to paste:

- the command you ran
- the migration file name
- the exact SQL error
- whether Docker Desktop was running

### Port already in use

Another local service may already be using one of Supabase's ports. Run:

```powershell
supabase stop
supabase start
```

If it still fails, paste the error output back into ChatGPT.

## What This Does Not Do

This setup does not:

- connect to a remote Supabase project
- add auth
- add RLS policies
- wire the app UI to the database
- create seed data
- import official monster data
- scrape any website

It only helps validate the migration locally.
