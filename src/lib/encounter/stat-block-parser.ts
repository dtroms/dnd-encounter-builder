import type {
  AbilityScores,
  CombatantType,
  MonsterType,
  StatBlockAction,
  StatBlockTrait,
} from "./types";

export type ParserConfidence = "low" | "medium" | "high";

export type ParsedCreatureDraft = {
  abilityScores: AbilityScores;
  actions: StatBlockAction[];
  armorClass: number | null;
  bonusActions: StatBlockAction[];
  challengeRating: string;
  initiativeBonus: number | null;
  languages: string;
  lairActions: StatBlockAction[];
  legendaryActions: StatBlockAction[];
  maxHp: number | null;
  monsterType: MonsterType;
  name: string;
  notes: string;
  reactions: StatBlockAction[];
  savingThrows: string[];
  senses: string;
  size: string;
  skills: string[];
  speed: string;
  tags: string[];
  traits: StatBlockTrait[];
  type: CombatantType;
};

export type StatBlockParseResult = {
  confidence: ParserConfidence;
  draft: ParsedCreatureDraft;
  missingRequiredFields: string[];
  warnings: string[];
};

const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
const monsterTypes: MonsterType[] = [
  "Aberration",
  "Beast",
  "Celestial",
  "Construct",
  "Dragon",
  "Elemental",
  "Fey",
  "Fiend",
  "Giant",
  "Humanoid",
  "Monstrosity",
  "Ooze",
  "Plant",
  "Undead",
  "Custom / Other",
  "Unknown / Unset",
];

export function parseStatBlock(rawText: string): StatBlockParseResult {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const name = parseName(lines);
  const identity = parseIdentityLine(lines);
  const armorClass = parseNumberAfterLabel(text, /armor class|ac/i);
  const maxHp = parseNumberAfterLabel(text, /hit points|hp/i);
  const speed = parseTextAfterLabel(text, /speed/i) || "";
  const challengeRating =
    parseTextAfterLabel(text, /challenge|challenge rating|cr/i)?.split(/\s+/)[0] ??
    "";
  const abilityScores = parseAbilityScores(text);
  const initiativeBonus =
    parseSignedNumberAfterLabel(text, /initiative|init/i) ??
    abilityModifier(abilityScores.dex);
  const savingThrows = splitList(parseTextAfterLabel(text, /saving throws/i));
  const skills = splitList(parseTextAfterLabel(text, /skills/i));
  const senses = parseTextAfterLabel(text, /senses/i) || "";
  const languages = parseTextAfterLabel(text, /languages/i) || "";
  const traits = parseNamedEntries(extractSection(lines, "traits"));
  const actions = parseNamedEntries(extractSection(lines, "actions"));
  const bonusActions = parseNamedEntries(extractSection(lines, "bonus actions"));
  const reactions = parseNamedEntries(extractSection(lines, "reactions"));
  const legendaryActions = parseNamedEntries(
    extractSection(lines, "legendary actions"),
  );
  const lairActions = parseNamedEntries(extractSection(lines, "lair actions"));

  if (!name) {
    warnings.push("Could not confidently detect a creature name.");
  }

  if (!identity.monsterType || identity.monsterType === "Unknown / Unset") {
    warnings.push("Creature type was not detected. Review the type before saving.");
  }

  if (!actions.length) {
    warnings.push("No actions were detected. Add or review actions before saving.");
  }

  const missingRequiredFields = [
    !name ? "name" : null,
    armorClass === null ? "armor class" : null,
    maxHp === null ? "hit points" : null,
    !challengeRating ? "challenge rating" : null,
    !identity.monsterType || identity.monsterType === "Unknown / Unset"
      ? "creature type"
      : null,
  ].filter(Boolean) as string[];

  const detectedFields = [
    name,
    armorClass,
    maxHp,
    speed,
    challengeRating,
    senses,
    languages,
    traits.length,
    actions.length,
  ].filter(Boolean).length;

  const confidence: ParserConfidence =
    missingRequiredFields.length >= 3
      ? "low"
      : detectedFields >= 7
        ? "high"
        : "medium";

  return {
    confidence,
    draft: {
      abilityScores,
      actions,
      armorClass,
      bonusActions,
      challengeRating,
      initiativeBonus,
      languages,
      lairActions,
      legendaryActions,
      maxHp,
      monsterType: identity.monsterType,
      name,
      notes: text ? "Imported from pasted stat block. Review before saving." : "",
      reactions,
      savingThrows,
      senses,
      size: identity.size,
      skills,
      speed,
      tags: ["imported", "paste-review"],
      traits,
      type: identity.role,
    },
    missingRequiredFields,
    warnings,
  };
}

function parseName(lines: string[]) {
  const firstNonHeading = lines.find(
    (line) =>
      !/^(armor class|hit points|speed|str\s+dex|actions|traits)$/i.test(line),
  );

  return firstNonHeading ?? "";
}

function parseIdentityLine(lines: string[]) {
  const identityLine = lines.find(
    (line, index) =>
      index > 0 &&
      /tiny|small|medium|large|huge|gargantuan/i.test(line) &&
      monsterTypes.some((type) => line.toLowerCase().includes(type.toLowerCase())),
  );
  const size =
    identityLine?.match(/\b(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/i)?.[1] ??
    "Medium";
  const monsterType =
    monsterTypes.find((type) =>
      identityLine?.toLowerCase().includes(type.toLowerCase()),
    ) ?? "Unknown / Unset";
  const role: CombatantType =
    /boss|legendary|lair/i.test(lines.join("\n")) ? "boss" : "enemy";

  return { monsterType, role, size };
}

function parseNumberAfterLabel(text: string, label: RegExp) {
  const match = text.match(new RegExp(`${label.source}\\s*[:]?\\s*(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
}

function parseSignedNumberAfterLabel(text: string, label: RegExp) {
  const match = text.match(new RegExp(`${label.source}\\s*[:]?\\s*([+-]?\\d+)`, "i"));
  return match ? Number(match[1]) : null;
}

function parseTextAfterLabel(text: string, label: RegExp) {
  const match = text.match(new RegExp(`^\\s*${label.source}\\s*[:]?\\s*(.+)$`, "im"));
  return match?.[1]?.trim();
}

function parseAbilityScores(text: string): AbilityScores {
  const defaults: AbilityScores = {
    cha: 10,
    con: 10,
    dex: 10,
    int: 10,
    str: 10,
    wis: 10,
  };
  const compact = text.match(
    /STR\s+DEX\s+CON\s+INT\s+WIS\s+CHA\s+([\s\S]{0,120})/i,
  );

  if (!compact) {
    return defaults;
  }

  const values = compact[1].match(/\b\d{1,2}\b/g)?.slice(0, 6);
  if (!values || values.length < 6) {
    return defaults;
  }

  return abilityKeys.reduce(
    (scores, key, index) => ({
      ...scores,
      [key]: Number(values[index]),
    }),
    defaults,
  );
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function extractSection(lines: string[], heading: string) {
  const headings = [
    "traits",
    "actions",
    "bonus actions",
    "reactions",
    "legendary actions",
    "lair actions",
  ];
  const start = lines.findIndex(
    (line) => line.toLowerCase() === heading.toLowerCase(),
  );

  if (start === -1) {
    return [];
  }

  const end = lines.findIndex(
    (line, index) =>
      index > start &&
      headings.some((item) => item.toLowerCase() === line.toLowerCase()),
  );

  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function parseNamedEntries(lines: string[]): StatBlockAction[] {
  return lines
    .map((line) => {
      const match = line.match(/^([^.:]+)[.:]\s*(.+)$/);
      return match
        ? { name: match[1].trim(), description: match[2].trim() }
        : { name: "Imported Entry", description: line };
    })
    .filter((entry) => entry.description);
}

function splitList(value?: string) {
  if (!value || /^none$/i.test(value)) {
    return [];
  }

  return value
    .split(/,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}
