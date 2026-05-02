import type { EncounterCombatant } from "./types";

export type SyntheticInitiativeOverrides = Record<
  string,
  {
    displayName?: string;
    initiative?: number | null;
  }
>;

export type InitiativeEntry =
  | {
      id: string;
      kind: "combatant";
      initiative: number | null;
      initiativeBonus: number;
      displayName: string;
      combatant: EncounterCombatant;
    }
  | {
      id: "lair-actions";
      kind: "lair";
      initiative: number;
      initiativeBonus: 0;
      displayName: string;
      combatants: EncounterCombatant[];
    };

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

export function rollEligibleInitiativesForGroup(
  combatants: EncounterCombatant[],
  group: { label: string; color?: string },
): EncounterCombatant[] {
  return combatants.map((combatant) => {
    const combatantLabel =
      combatant.combatGroupLabel ||
      combatant.combatGroupColor ||
      "Ungrouped";
    const matchesGroup =
      combatantLabel === group.label &&
      (combatant.combatGroupColor || "None") === (group.color || "None");

    if (
      !matchesGroup ||
      !combatant.autoRollEligible ||
      combatant.type === "pc"
    ) {
      return combatant;
    }

    return {
      ...combatant,
      initiative: rollInitiative(combatant.initiativeBonus),
      manualInitiative: false,
    };
  });
}

function combatantMatchesGroup(
  combatant: EncounterCombatant,
  group: { label: string; color?: string },
): boolean {
  const combatantLabel =
    combatant.combatGroupLabel ||
    combatant.combatGroupColor ||
    "Ungrouped";

  return (
    combatantLabel === group.label &&
    (combatant.combatGroupColor || "None") === (group.color || "None")
  );
}

function canAutoRollInitiative(combatant: EncounterCombatant): boolean {
  return combatant.autoRollEligible && combatant.type !== "pc";
}

export function rollSharedInitiativeForGroup(
  combatants: EncounterCombatant[],
  group: { label: string; color?: string },
): EncounterCombatant[] {
  const rolledValues = combatants
    .filter(
      (combatant) =>
        combatantMatchesGroup(combatant, group) &&
        canAutoRollInitiative(combatant),
    )
    .map((combatant) => rollInitiative(combatant.initiativeBonus));

  if (rolledValues.length === 0) {
    return combatants;
  }

  const sharedInitiative = Math.round(
    rolledValues.reduce((total, value) => total + value, 0) /
      rolledValues.length,
  );

  return combatants.map((combatant) => {
    if (
      !combatantMatchesGroup(combatant, group) ||
      !canAutoRollInitiative(combatant)
    ) {
      return combatant;
    }

    return {
      ...combatant,
      initiative: sharedInitiative,
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

export function getInitiativeEntries(
  combatants: EncounterCombatant[],
  syntheticOverrides: SyntheticInitiativeOverrides = {},
): InitiativeEntry[] {
  const combatantEntries: InitiativeEntry[] = combatants.map((combatant) => ({
    id: combatant.combatantId,
    kind: "combatant",
    initiative: combatant.initiative,
    initiativeBonus: combatant.initiativeBonus,
    displayName: combatant.displayName,
    combatant,
  }));

  const lairCombatants = combatants.filter(
    (combatant) => combatant.lairActions && combatant.lairActions.length > 0,
  );

  if (lairCombatants.length === 0) {
    return combatantEntries;
  }

  return [
    ...combatantEntries,
    {
      id: "lair-actions",
      kind: "lair",
      initiative: syntheticOverrides["lair-actions"]?.initiative ?? 20,
      initiativeBonus: 0,
      displayName:
        syntheticOverrides["lair-actions"]?.displayName ?? "Lair Actions",
      combatants: lairCombatants,
    },
  ];
}

export function sortInitiativeEntries(
  entries: InitiativeEntry[],
): InitiativeEntry[] {
  return [...entries].sort((a, b) => {
    const aInitiative = a.initiative ?? -999;
    const bInitiative = b.initiative ?? -999;

    if (bInitiative !== aInitiative) {
      return bInitiative - aInitiative;
    }

    if (a.kind !== b.kind) {
      return a.kind === "lair" ? -1 : 1;
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
  syntheticOverrides: SyntheticInitiativeOverrides = {},
): { activeCombatantId: string | null; round: number; turnNumber: number } {
  if (combatants.length === 0) {
    return { activeCombatantId: null, round, turnNumber: 0 };
  }

  const ordered = sortInitiativeEntries(
    getInitiativeEntries(combatants, syntheticOverrides),
  );
  const currentIndex = ordered.findIndex((entry) => entry.id === activeCombatantId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % ordered.length;
  const nextRound =
    currentIndex >= 0 && nextIndex === 0 ? Math.max(1, round + 1) : round;

  return {
    activeCombatantId: ordered[nextIndex].id,
    round: nextRound,
    turnNumber: turnNumber + 1,
  };
}

export function previousTurn(
  combatants: EncounterCombatant[],
  activeCombatantId: string | null,
  round: number,
  turnNumber = 0,
  syntheticOverrides: SyntheticInitiativeOverrides = {},
): { activeCombatantId: string | null; round: number; turnNumber: number } {
  if (combatants.length === 0) {
    return { activeCombatantId: null, round, turnNumber: 0 };
  }

  const ordered = sortInitiativeEntries(
    getInitiativeEntries(combatants, syntheticOverrides),
  );
  const currentIndex = ordered.findIndex((entry) => entry.id === activeCombatantId);
  const previousIndex =
    currentIndex < 0
      ? ordered.length - 1
      : (currentIndex - 1 + ordered.length) % ordered.length;
  const previousRound =
    currentIndex === 0 ? Math.max(1, round - 1) : Math.max(1, round);

  return {
    activeCombatantId: ordered[previousIndex].id,
    round: previousRound,
    turnNumber: Math.max(0, turnNumber - 1),
  };
}
