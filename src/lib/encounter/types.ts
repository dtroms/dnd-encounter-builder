export type CombatantType =
  | "pc"
  | "ally"
  | "enemy"
  | "boss"
  | "summon"
  | "neutral";

export type CombatantCondition =
  | "blinded"
  | "charmed"
  | "deafened"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious"
  | "concentrating"
  | "hidden";

export type AbilityScores = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type StatBlockTrait = {
  name: string;
  description: string;
};

export type StatBlockAction = {
  name: string;
  description: string;
};

export type CreatureTemplate = {
  id: string;
  name: string;
  type: CombatantType;
  size: string;
  armorClass: number;
  maxHp: number;
  speed: string;
  initiativeBonus: number;
  abilityScores: AbilityScores;
  savingThrows?: string[];
  skills?: string[];
  senses: string;
  languages: string;
  challengeRating?: string;
  traits: StatBlockTrait[];
  actions: StatBlockAction[];
  bonusActions?: StatBlockAction[];
  reactions?: StatBlockAction[];
  legendaryActions?: StatBlockAction[];
  lairActions?: StatBlockAction[];
  notes?: string;
  tags: string[];
  accentColor: string;
  groupLabel?: string;
  combatGroupLabel?: string;
  combatGroupColor?: string;
  autoRollEligible: boolean;
};

export type EncounterCombatant = CreatureTemplate & {
  combatantId: string;
  templateId: string;
  displayName: string;
  currentHp: number;
  initiative: number | null;
  manualInitiative: boolean;
  conditions: CombatantCondition[];
  waveId?: string;
  waveLabel?: string;
};

export type EncounterWave = {
  id: string;
  name: string;
  notes?: string;
};

export type Encounter = {
  id: string;
  name: string;
  combatants: EncounterCombatant[];
  waves: EncounterWave[];
  round: number;
  activeCombatantId: string | null;
  turnNumber: number;
};
