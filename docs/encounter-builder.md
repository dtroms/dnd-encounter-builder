# Encounter Builder

The Encounter Builder now uses a creature browser plus encounter roster model.

This pass uses local sample data only. It does not wire the Builder to Supabase, add auth, add RLS, connect to a remote database, implement the SRD importer, or scrape any website.

## Creature Browser

The main Builder area is a compact creature browser for local sample templates.

It includes:

- quick role filters such as All, PC, Enemy, Boss, NPC, Ally, Summon, and Neutral
- a future `More Types later` taxonomy placeholder
- search by name, tag, role/type, size, or challenge rating text
- basic filters for role/type, size, CR min, and CR max
- compact creature result rows
- expandable inline creature previews

The interaction model is browse, inspect, then add. It borrows general list/browser interaction principles without copying any external visual design or content.

## Expandable Creature Preview

Expanded creature rows show combat-relevant sample data:

- name
- role/type
- size
- CR
- AC
- HP
- speed
- initiative bonus
- ability scores
- traits
- actions
- bonus actions, reactions, legendary actions, and lair actions when present
- notes and tags

Preview actions include Add Once, quantity-based Add Multiple, and a disabled View Full later placeholder.

## Add To Encounter

The row Add button adds one copy immediately.

The expanded preview can add one copy or multiple copies. The current local add behavior remains responsible for unique display names such as `Cindercap Sneak 1` and `Cindercap Sneak 2`.

No database writes happen in this pass.

## Encounter Roster

The right column shows the current encounter setup:

- encounter name
- combatant count
- group count
- boss indicator
- lair action indicator
- Launch Runner action
- Save Draft later placeholder

The roster is grouped by combat group and uses the same group color concepts as the Runner. Each roster item shows display name, role/type, AC, HP, initiative bonus, group marker, duplicate, remove, and compact group/name editing.

## Future Sections

Combat group creation and wave editing are intentionally light in this pass.

The Builder includes:

- compact current group summary
- `Group editing expands later`
- `Waves / Reinforcements`
- `Add Wave later`

Future work can deepen these sections without changing the basic browser-plus-roster workflow.
