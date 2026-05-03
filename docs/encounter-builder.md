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
- campaign assignment
- combatant count
- group count
- boss indicator
- lair action indicator
- Launch Runner action
- Save Draft later placeholder

The roster is grouped by combat group and uses the same group color concepts as the Runner. Each roster item shows display name, role/type, AC, HP, initiative bonus, group marker, duplicate, remove, and compact group/name editing.

Roster groups are collapsible. Each group header shows the group color marker, group name, combatant count, and an Expand/Collapse control. Collapsing a group hides its combatant rows while preserving the count.

## Builder Combat Groups

The Builder can create combat groups locally before launching the Runner.

The Combat Groups section supports:

- group name input
- bright color swatches using the same color options as the Runner
- Create Group button
- group rows with color marker, name, and current count
- Ungrouped / No Group count

Created groups become available in roster combatant group assignment controls. Assigning a combatant updates its `combatGroupLabel` and `combatGroupColor`, immediately regrouping the Builder roster. Because the Builder and Runner share local encounter state, these group assignments carry into the Runner when Launch Runner is clicked.

The assignment dropdown intentionally lists only Ungrouped / No Group and groups currently available in local Builder/Runner state. It does not show unused preset groups.

## Campaign Assignment

The Builder includes a compact Campaign selector in the current encounter setup panel.

Local mock campaign options are:

- The Lantern Road
- Moonwell Vale
- Ash Gate
- Violet Keg Cellars
- Unassigned / No Campaign

Selecting a campaign updates local app state and appears in the Builder summary. The Save Draft later button currently stages a local UI notice only; it does not write to Supabase or create a saved encounter record yet.

Future database work will need campaign persistence, likely either campaign fields on saved encounters or a dedicated `campaigns` table. That future wiring should allow the Saved Encounters dashboard campaign filters to use real saved encounter campaign assignments.

## Future Sections

Wave editing is intentionally light in this pass.

The Builder includes:

- `Waves / Reinforcements`
- `Add Wave later`

Future work can deepen waves, group rename/delete, and saved draft behavior without changing the basic browser-plus-roster workflow.
