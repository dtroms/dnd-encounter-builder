# Waves and Reinforcements

Waves let the DM prepare combatants in the Builder and deploy them later during
the Runner. This is useful for reinforcements, second phases, ambushes, delayed
summons, or enemies that enter after a trigger.

This feature is local-only for now. It does not persist to Supabase yet.

## Builder Setup

In the Builder, the Waves / Reinforcements section supports:

- creating a wave with a name and optional description
- editing the wave name and description
- seeing whether the wave is deployed or not deployed
- seeing which combatants are assigned to each wave
- removing a combatant from a wave
- deleting a wave

Roster combatants have a compact Wave assignment field. The options are:

- Active at start
- each created wave

Assigning a combatant to a wave keeps it visible in Builder for planning, but it
holds that combatant out of the live Runner initiative list until the wave is
deployed.

## Runner Deployment

The Runner shows a compact Waves / Reinforcements panel above the initiative
list when waves exist.

Each undeployed wave shows:

- wave name
- description, if present
- count of held combatants
- Deploy button

Deploying a wave marks it as deployed and makes its assigned combatants appear
in the live initiative tracker.

## Initiative Behavior

When a wave is deployed:

- eligible non-PC combatants in that wave receive initiative if they do not
  already have one
- PCs are not auto-rolled by default
- manual initiative values are preserved
- combat groups and colors are preserved

After deployment, normal Runner controls still apply: group Roll Init, Shared
Init, manual initiative editing, sorting, HP controls, conditions, lair actions,
and stat block selection.

If a deployed wave includes a creature with lair actions, the synthetic Lair
Actions row can appear because the deployed creature is now part of the live
initiative set.

## Future Database Notes

Future database work should persist waves separately from combatants, likely
using encounter wave records and wave-member relationships. The current local
shape prepares for:

- wave id
- wave name
- wave description
- deployed state
- combatants assigned to a wave
- combat group/color preservation

No auth, RLS, Supabase wiring, importer logic, or external data fetching is
included in this pass.
