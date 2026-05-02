import type { EncounterCombatant } from "./types";

export function rollInitiative(initiativeBonus: number): number {
  return Math.floor(Math.random() * 20) + 1 + initiativeBonus;
}

export function rollEligibleInitiatives(
  combatants: EncounterCombatant[],
): EncounterCombatant[] {
  return combatants.map((combatant) => {
    if (!combatant.autoRollEligible || combatant.type === "pc") {
      return combatant;
    }

    return {
      ...combatant,
      initiative: rollInitiative(combatant.initiativeBonus),
      manualInitiative: false,
    };
  });
}

export function sortCombatantsByInitiative(
  combatants: EncounterCombatant[],
): EncounterCombatant[] {
  return [...combatants].sort((a, b) => {
    const aInitiative = a.initiative ?? -999;
    const bInitiative = b.initiative ?? -999;

    if (bInitiative !== aInitiative) {
      return bInitiative - aInitiative;
    }

    if (b.initiativeBonus !== a.initiativeBonus) {
      return b.initiativeBonus - a.initiativeBonus;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}

export function advanceTurn(
  combatants: EncounterCombatant[],
  activeCombatantId: string | null,
  round: number,
  turnNumber = 0,
): { activeCombatantId: string | null; round: number; turnNumber: number } {
  if (combatants.length === 0) {
    return { activeCombatantId: null, round, turnNumber: 0 };
  }

  const ordered = sortCombatantsByInitiative(combatants);
  const currentIndex = ordered.findIndex(
    (combatant) => combatant.combatantId === activeCombatantId,
  );
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % ordered.length;
  const nextRound =
    currentIndex >= 0 && nextIndex === 0 ? Math.max(1, round + 1) : round;

  return {
    activeCombatantId: ordered[nextIndex].combatantId,
    round: nextRound,
    turnNumber: turnNumber + 1,
  };
}

export function previousTurn(
  combatants: EncounterCombatant[],
  activeCombatantId: string | null,
  round: number,
  turnNumber = 0,
): { activeCombatantId: string | null; round: number; turnNumber: number } {
  if (combatants.length === 0) {
    return { activeCombatantId: null, round, turnNumber: 0 };
  }

  const ordered = sortCombatantsByInitiative(combatants);
  const currentIndex = ordered.findIndex(
    (combatant) => combatant.combatantId === activeCombatantId,
  );
  const previousIndex =
    currentIndex < 0
      ? ordered.length - 1
      : (currentIndex - 1 + ordered.length) % ordered.length;
  const previousRound =
    currentIndex === 0 ? Math.max(1, round - 1) : Math.max(1, round);

  return {
    activeCombatantId: ordered[previousIndex].combatantId,
    round: previousRound,
    turnNumber: Math.max(0, turnNumber - 1),
  };
}
