# AGENTS.md

## Project Identity

This repository is for a D&D Encounter Builder and Initiative Tracker web app.

Do not reference, modify, import from, or copy assumptions from ShowOps, Kordant, Clean Signal, or any unrelated dashboard app.

## Product Goal

Build a clean, table-friendly web app that helps a Dungeon Master:
- build an encounter
- add monsters, NPCs, player characters, summons, and bosses
- run initiative
- track AC and HP
- apply damage and healing quickly
- view a clicked combatant's stat block
- add monsters during combat for waves or reinforcements

## Tech Direction

- Next.js App Router
- TypeScript
- Tailwind CSS
- Local React state first
- No auth yet
- No database yet
- No Supabase yet
- No external APIs yet
- No payment/billing/team/organization logic yet

## UX Rules

- The Encounter Builder and Encounter Runner should be separate tabs/views.
- The live Encounter Runner must be cleaner and less cluttered than the builder.
- HP must be tracked directly in the initiative tracker.
- AC must always be visible in the initiative tracker.
- Double-digit initiative numbers must be easy to read.
- Player character initiative should be manually entered by default.
- The monster/NPC initiative roll button must not roll player character initiative.
- Manual initiative values should not be overwritten unexpectedly.
- The stat block panel should populate when a combatant is clicked.
- Every combatant should be removable.
- Adding monsters during combat should be fast and obvious.
- Use color, labels, and badges to differentiate PCs, allies, enemies, bosses, summons, and neutral combatants.
- Do not rely on color alone.

## Validation

After making code changes:
- Run npm run lint
- Run npm run build
- Fix all TypeScript, lint, and build errors
- Summarize changed files
