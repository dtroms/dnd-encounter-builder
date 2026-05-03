export type CombatantType =
  | "pc"
  | "ally"
  | "enemy"
  | "boss"
  | "summon"
  | "minion"
  | "neutral";

export type MonsterType =
  | "Aberration"
  | "Beast"
  | "Celestial"
  | "Construct"
  | "Dragon"
  | "Elemental"
  | "Fey"
  | "Fiend"
  | "Giant"
  | "Humanoid"
  | "Monstrosity"
  | "Ooze"
  | "Plant"
  | "Undead"
  | "Custom / Other"
  | "Unknown / Unset";

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

export type SpellEffect =
  | "bless"
  | "bane"
  | "hunters_mark"
  | "faerie_fire"
  | "hex"
  | "shield_of_faith"
  | "haste"
  | "slow"
  | "guiding_bolt"
  | "sanctuary"
  | "protection";

export type CombatGroup = {
  id: string;
  name: string;
  color: string;
};

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
  alignment?: string;
  armorClassNote?: string;
  monsterType?: MonsterType;
  monsterSubtype?: string;
  type: CombatantType;
  size: string;
  armorClass: number;
  maxHp: number;
  hitPointFormula?: string;
  speed: string;
  initiativeBonus: number;
  abilityScores: AbilityScores;
  savingThrows?: string[];
  skills?: string[];
  damageVulnerabilities?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  conditionImmunities?: string[];
  senses: string;
  languages: string;
  challengeRating?: string;
  challengeXp?: string;
  characterSheetUrl?: string;
  characterSheetTitle?: string;
  characterSheetEmbedEnabled?: boolean;
  externalSheetNotes?: string;
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
  normalizedRawImportText?: string;
  rawImportText?: string;
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
  spellEffects: SpellEffect[];
  waveId?: string;
  waveLabel?: string;
};

export type EncounterWave = {
  id: string;
  name: string;
  description?: string;
  deployed: boolean;
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
