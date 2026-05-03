# Encounter Builder

The Encounter Builder now uses a creature browser plus encounter roster model.

This pass uses local sample data only. It does not wire the Builder to Supabase, add auth, add RLS, connect to a remote database, implement the SRD importer, or scrape any website.

## Creature Browser

The main Builder area is a compact creature browser for the shared local
Creature Library templates.

It includes:

- quick role filters such as All, PC, Enemy, Boss, NPC, Ally, Summon, Minion, and Neutral
- search by name, tag, monster type, combat role, size, or challenge rating text
- a Monster Type filter for taxonomy such as Humanoid, Beast, Monstrosity, or Custom / Other
- a Combat Role filter for PC, Enemy, Boss, NPC, Ally, Summon, Minion, or Neutral
- basic filters for size, CR min, and CR max
- compact creature result rows
- expandable inline creature previews

The interaction model is browse, inspect, then add. It borrows general list/browser interaction principles without copying any external visual design or content.

The Builder no longer has its own diverging hardcoded creature list. It receives
the same local creature templates used by the Creature Library. New, edited, and
duplicated Library creatures become available in Builder during the same session.
No Supabase persistence is involved yet.

## Current Encounter Header

The Current Encounter panel now spans the full Builder page above the work area.
It acts as the Builder control header.

The header includes:

- Current Encounter label
- encounter name
- campaign name
- compact summary pills for combatants, groups, bosses, and lair readiness
- campaign selector
- Save Draft later placeholder
- Launch Runner action

Below the header, the Builder work area contains the Creature Browser on the
left and the tabbed Encounter Roster plus Combat Groups on the right.

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

Existing encounter combatants are snapshots of the creature template at the time
they are added. Editing a Library template does not retroactively rewrite roster
combatants already in the encounter.

No database writes happen in this pass.

## Encounter Roster

The Encounter Roster uses wave tabs:

- Wave 1 is the default starting encounter.
- The `+` tab creates the next wave, such as Wave 2 or Wave 3.
- The active wave tab controls which wave the roster displays.
- The active wave tab also controls where newly added creatures go.
- Each wave tab has a compact three-dot menu for Rename Wave and Delete Wave.

If Wave 2 is active, Add and Add Multiple from the creature browser add those
new combatants to Wave 2. No separate wave assignment selector is needed for the
normal add flow.

Deleting a wave is protected by a confirmation step. The only remaining wave
cannot be deleted. When a wave is deleted, its combatants move to the first
remaining wave instead of being removed.

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

## Waves / Reinforcements

The Builder now uses the Encounter Roster wave tabs as the local-only wave setup
for reinforcements.

The basic workflow is:

- Use Wave 1 for the starting encounter.
- Click `+` to create Wave 2, Wave 3, and later waves.
- Select the wave tab you want to build.
- Add creatures from the browser; they are added to the active wave.
- Use the three-dot menu to rename or delete a wave.
- Launch Runner and deploy undeployed waves from the Runner when needed.

Wave 1 is deployed by default and represents the starting encounter. Later waves
are held out of the live Runner initiative list until they are deployed.

Wave data is local React state only. It does not write to Supabase yet.

Future work can deepen saved draft behavior and database persistence without
changing the basic browser-plus-roster workflow.
