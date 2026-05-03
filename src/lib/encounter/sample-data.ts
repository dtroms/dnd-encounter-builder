import type { CreatureTemplate, EncounterCombatant } from "./types";

const commonScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

export const sampleCreatureTemplates: CreatureTemplate[] = [
  {
    id: "pc-aria",
    name: "Aria Vale",
    type: "pc",
    size: "Medium",
    armorClass: 17,
    maxHp: 42,
    speed: "30 ft.",
    initiativeBonus: 2,
    abilityScores: { ...commonScores, str: 15, con: 14, cha: 13 },
    savingThrows: ["Str +5", "Con +4"],
    skills: ["Athletics +5", "Insight +3"],
    senses: "passive Perception 11",
    languages: "Common, Dwarvish",
    traits: [
      {
        name: "Shield Line",
        description: "Adjacent allies gain light cover while Aria is standing.",
      },
    ],
    actions: [
      {
        name: "Longblade",
        description: "+5 to hit, reach 5 ft., 1d8+3 slashing damage.",
      },
    ],
    reactions: [
      {
        name: "Guarded Intercept",
        description: "Reduce damage to an adjacent ally by 1d8 once per round.",
      },
    ],
    notes: "Front-line defender. Player initiative should be typed manually.",
    tags: ["player", "defender", "frontline"],
    accentColor: "Blue",
    groupLabel: "Party",
    combatGroupLabel: "Party",
    combatGroupColor: "Blue",
    autoRollEligible: false,
  },
  {
    id: "pc-mira",
    name: "Mira Quill",
    type: "pc",
    size: "Medium",
    armorClass: 14,
    maxHp: 31,
    speed: "30 ft.",
    initiativeBonus: 3,
    abilityScores: { ...commonScores, dex: 16, int: 15 },
    savingThrows: ["Dex +5", "Int +4"],
    skills: ["Arcana +4", "Investigation +4"],
    senses: "passive Perception 12",
    languages: "Common, Elvish",
    traits: [
      {
        name: "Prepared Spark",
        description: "After casting, mark one visible creature until her next turn.",
      },
    ],
    actions: [
      {
        name: "Bright Bolt",
        description: "+5 to hit, range 60 ft., 1d10 radiant damage.",
      },
    ],
    bonusActions: [
      {
        name: "Arcane Step",
        description: "Move 10 ft. without provoking from one marked creature.",
      },
    ],
    notes: "Mobile caster. Good candidate for concentration tracking.",
    tags: ["player", "caster", "ranged"],
    accentColor: "Cyan",
    groupLabel: "Party",
    combatGroupLabel: "Party",
    combatGroupColor: "Blue",
    autoRollEligible: false,
  },
  {
    id: "pc-tovin",
    name: "Tovin Bramble",
    type: "pc",
    size: "Small",
    armorClass: 15,
    maxHp: 36,
    speed: "25 ft.",
    initiativeBonus: 4,
    abilityScores: { ...commonScores, dex: 18, wis: 14 },
    savingThrows: ["Dex +6", "Wis +4"],
    skills: ["Stealth +8", "Perception +6"],
    senses: "passive Perception 16",
    languages: "Common, Halfling",
    traits: [
      {
        name: "Low Profile",
        description: "Can hide behind Medium or larger allies when chaos is high.",
      },
    ],
    actions: [
      {
        name: "Twin Knives",
        description: "+6 to hit, 1d4+4 piercing damage twice.",
      },
    ],
    reactions: [
      {
        name: "Slip Aside",
        description: "Reduce one melee hit by 1d6 and move 5 ft.",
      },
    ],
    notes: "Skirmisher with strong initiative. Player controls their roll.",
    tags: ["player", "scout", "skirmisher"],
    accentColor: "Green",
    characterSheetTitle: "Tovin Bramble Sheet",
    characterSheetUrl: "https://example.com/tovin-bramble-character-sheet",
    externalSheetNotes: "Mock external sheet link for Runner integration testing.",
    groupLabel: "Party",
    combatGroupLabel: "Party",
    combatGroupColor: "Blue",
    autoRollEligible: false,
  },
  {
    id: "goblin-cinder",
    name: "Cindercap Sneak",
    type: "enemy",
    size: "Small",
    armorClass: 14,
    maxHp: 11,
    speed: "30 ft.",
    initiativeBonus: 3,
    abilityScores: { ...commonScores, str: 8, dex: 16, cha: 8 },
    skills: ["Stealth +5", "Acrobatics +5"],
    senses: "darkvision 60 ft., passive Perception 10",
    languages: "Common, gutter cant",
    challengeRating: "1/4",
    traits: [
      {
        name: "Smoke Duck",
        description: "After missing an attack, move 10 ft. without provoking.",
      },
    ],
    actions: [
      {
        name: "Notched Dagger",
        description: "+5 to hit, 1d4+3 piercing damage.",
      },
    ],
    bonusActions: [
      {
        name: "Skitter",
        description: "Dash or hide if in dim light, smoke, or clutter.",
      },
    ],
    notes: "Use in pairs to pressure back-line characters.",
    tags: ["goblin-style", "ambusher", "melee"],
    accentColor: "Red",
    groupLabel: "Cindercaps",
    combatGroupLabel: "Red Warband",
    combatGroupColor: "Red",
    autoRollEligible: true,
  },
  {
    id: "goblin-rattle",
    name: "Rattlebone Slinger",
    type: "enemy",
    size: "Small",
    armorClass: 13,
    maxHp: 9,
    speed: "30 ft.",
    initiativeBonus: 2,
    abilityScores: { ...commonScores, dex: 15, wis: 8 },
    skills: ["Sleight of Hand +4"],
    senses: "darkvision 60 ft., passive Perception 9",
    languages: "Common, gutter cant",
    challengeRating: "1/4",
    traits: [
      {
        name: "Pack Nerve",
        description: "Gains +1 to attacks while two allies are within 30 ft.",
      },
    ],
    actions: [
      {
        name: "Clatter Sling",
        description: "+4 to hit, range 40 ft., 1d6+2 bludgeoning damage.",
      },
    ],
    bonusActions: [
      {
        name: "Scatter",
        description: "Disengage after making a ranged attack.",
      },
    ],
    notes: "Simple ranged enemy for cluttered fights.",
    tags: ["goblin-style", "ranged", "minion"],
    accentColor: "Red",
    groupLabel: "Cindercaps",
    combatGroupLabel: "Red Warband",
    combatGroupColor: "Red",
    autoRollEligible: true,
  },
  {
    id: "goblin-murk",
    name: "Murkpot Hexer",
    type: "enemy",
    size: "Small",
    armorClass: 12,
    maxHp: 16,
    speed: "30 ft.",
    initiativeBonus: 1,
    abilityScores: { ...commonScores, int: 12, wis: 13, cha: 14 },
    savingThrows: ["Wis +3"],
    skills: ["Deception +4"],
    senses: "darkvision 60 ft., passive Perception 11",
    languages: "Common, gutter cant",
    challengeRating: "1/2",
    traits: [
      {
        name: "Bad Luck Brew",
        description: "A damaged target subtracts 1d4 from its next attack roll.",
      },
    ],
    actions: [
      {
        name: "Murk Bolt",
        description: "+4 to hit, range 60 ft., 1d8+2 necrotic damage.",
      },
    ],
    reactions: [
      {
        name: "Spiteful Pop",
        description: "When hit, deal 2 poison damage to the attacker.",
      },
    ],
    notes: "Control piece. Mark priority targets in notes during play.",
    tags: ["goblin-style", "caster", "control"],
    accentColor: "Purple",
    groupLabel: "Cindercaps",
    combatGroupLabel: "Red Warband",
    combatGroupColor: "Red",
    autoRollEligible: true,
  },
  {
    id: "goblin-bristle",
    name: "Bristlejaw Guard",
    type: "enemy",
    size: "Small",
    armorClass: 16,
    maxHp: 18,
    speed: "25 ft.",
    initiativeBonus: 0,
    abilityScores: { ...commonScores, str: 14, con: 13 },
    skills: ["Athletics +4"],
    senses: "darkvision 60 ft., passive Perception 10",
    languages: "Common, gutter cant",
    challengeRating: "1/2",
    traits: [
      {
        name: "Lock Shields",
        description: "Gains +1 AC while adjacent to another guard.",
      },
    ],
    actions: [
      {
        name: "Hooked Spear",
        description: "+4 to hit, reach 10 ft., 1d6+2 piercing and pull 5 ft.",
      },
    ],
    notes: "Good blocker for protecting fragile enemies.",
    tags: ["goblin-style", "guard", "frontline"],
    accentColor: "Red",
    groupLabel: "Cindercaps",
    combatGroupLabel: "Red Warband",
    combatGroupColor: "Red",
    autoRollEligible: true,
  },
  {
    id: "shadow-hound",
    name: "Duskmaw Hound",
    type: "enemy",
    size: "Medium",
    armorClass: 14,
    maxHp: 37,
    speed: "40 ft.",
    initiativeBonus: 3,
    abilityScores: { ...commonScores, str: 15, dex: 16, con: 14, wis: 12 },
    skills: ["Perception +5", "Stealth +5"],
    senses: "darkvision 90 ft., passive Perception 15",
    languages: "understands Shadow cant",
    challengeRating: "2",
    traits: [
      {
        name: "Dim Pounce",
        description: "Deals +1d6 damage after moving from dim light or darkness.",
      },
    ],
    actions: [
      {
        name: "Umbral Bite",
        description: "+5 to hit, 2d6+3 piercing damage.",
      },
    ],
    bonusActions: [
      {
        name: "Fade Low",
        description: "Hide while in dim light or darkness.",
      },
    ],
    notes: "Fast pressure monster. Works well as a second wave.",
    tags: ["shadow", "beast", "hunter"],
    accentColor: "Magenta",
    groupLabel: "Shadow",
    combatGroupLabel: "Blue Warband",
    combatGroupColor: "Blue",
    autoRollEligible: true,
  },
  {
    id: "boss-velkora",
    name: "Velkora, Lantern Tyrant",
    type: "boss",
    size: "Medium",
    armorClass: 18,
    maxHp: 126,
    speed: "30 ft., hover 20 ft.",
    initiativeBonus: 4,
    abilityScores: { str: 14, dex: 18, con: 16, int: 15, wis: 13, cha: 17 },
    savingThrows: ["Dex +7", "Con +6", "Cha +6"],
    skills: ["Intimidation +6", "Perception +4"],
    senses: "darkvision 120 ft., passive Perception 14",
    languages: "Common, Infernal, gutter cant",
    challengeRating: "6",
    traits: [
      {
        name: "Lantern Aura",
        description: "Enemies starting their turn within 10 ft. cannot hide.",
      },
      {
        name: "Commanding Glare",
        description: "Once per round, a nearby ally may move 10 ft. after Velkora acts.",
      },
    ],
    actions: [
      {
        name: "Iron Lantern",
        description: "+7 to hit, 1d10+4 bludgeoning plus 1d8 fire damage.",
      },
      {
        name: "Flare Order",
        description: "Two allies make one weapon attack against marked targets.",
      },
    ],
    reactions: [
      {
        name: "No, You Stay",
        description: "A creature leaving reach must pass a Dex save or stop moving.",
      },
    ],
    legendaryActions: [
      {
        name: "Burning Step",
        description: "Move up to half speed and leave a 5 ft. burning mark.",
      },
      {
        name: "Hard Stare",
        description: "One visible creature has disadvantage on its next save.",
      },
    ],
    lairActions: [
      {
        name: "Lanterns Flare",
        description: "On initiative 20, two lantern marks ignite. Creatures within 5 ft. take 1d6 fire damage.",
      },
      {
        name: "Alleys Shift",
        description: "On initiative 20, choose a 15 ft. lane. It becomes difficult terrain until the next round.",
      },
    ],
    notes: "Boss pressure piece. Bring reinforcements when she drops below half HP.",
    tags: ["boss", "commander", "fire"],
    accentColor: "Gold",
    groupLabel: "Boss",
    combatGroupLabel: "Gold Warband",
    combatGroupColor: "Gold",
    autoRollEligible: true,
  },
  {
    id: "neutral-sable",
    name: "Sable Market Guide",
    type: "neutral",
    size: "Medium",
    armorClass: 12,
    maxHp: 22,
    speed: "30 ft.",
    initiativeBonus: 1,
    abilityScores: { ...commonScores, dex: 12, int: 13, cha: 15 },
    skills: ["Persuasion +4", "Insight +3"],
    senses: "passive Perception 11",
    languages: "Common, trade cant",
    traits: [
      {
        name: "Knows the Alleys",
        description: "Can point out one shortcut or hiding spot in an urban scene.",
      },
    ],
    actions: [
      {
        name: "Walking Cane",
        description: "+3 to hit, 1d6+1 bludgeoning damage.",
      },
    ],
    reactions: [
      {
        name: "Duck Behind Cover",
        description: "Gain +2 AC against one ranged attack if cover is nearby.",
      },
    ],
    notes: "Neutral NPC who might flee, bargain, or become collateral risk.",
    tags: ["neutral", "npc", "social"],
    accentColor: "Gray",
    groupLabel: "Bystanders",
    combatGroupLabel: "No Group",
    combatGroupColor: "None",
    autoRollEligible: true,
  },
];

export function createCombatant(
  template: CreatureTemplate,
  copyNumber = 1,
): EncounterCombatant {
  const suffix =
    template.type === "pc" || template.type === "neutral" ? "" : ` ${copyNumber}`;

  return {
    ...template,
    combatantId: `${template.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    templateId: template.id,
    displayName: `${template.name}${suffix}`,
    currentHp: template.maxHp,
    initiative: null,
    manualInitiative: template.type === "pc",
    conditions: [],
    waveLabel: template.groupLabel,
    combatGroupLabel: template.combatGroupLabel ?? template.groupLabel,
    combatGroupColor: template.combatGroupColor ?? template.accentColor,
  };
}
