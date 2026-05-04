import type { AbilityScores, CombatantCondition, CombatantType } from "./types";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SourceType = "sample" | "custom" | "imported" | "srd";

export type ImportMethod =
  | "manual"
  | "paste"
  | "url"
  | "srd-json-review"
  | "automated-srd-json"
  | "dndbeyond_homebrew";

export type ImportStatus = "draft" | "parsed" | "reviewed" | "saved" | "failed";

export type EncounterStatus = "draft" | "running" | "completed" | "archived";

export type LastOpenedMode = "builder" | "runner";

export type InitiativeEntryType = "combatant" | "lair_action" | "custom";

export type ProfileRole = "user" | "admin";

export type CampaignStatus = "active" | "archived";

export type ProfileRecord = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};

export type CampaignRecord = {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string | null;
  accent_color: string | null;
  status: CampaignStatus;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

export type StatBlockActionRecord = {
  id?: string;
  slug?: string;
  name: string;
  description: string;
  attack_bonus?: number | null;
  damage?: string | null;
  recharge?: string | null;
  uses?: string | null;
};

export type StatBlockTraitRecord = {
  id?: string;
  slug?: string;
  name: string;
  description: string;
};

export type CreatureTemplateRecord = {
  id: string;
  owner_user_id: string | null;
  name: string;
  creature_type: CombatantType;
  size: string | null;
  role: string | null;
  armor_class: number;
  hit_points: number;
  speed: string | null;
  initiative_bonus: number;
  challenge_rating: string | null;
  proficiency_bonus: number | null;
  ability_scores: AbilityScores;
  saving_throws: string[];
  skills: string[];
  senses: string | null;
  languages: string | null;
  resistances: JsonValue;
  immunities: JsonValue;
  vulnerabilities: JsonValue;
  traits: StatBlockTraitRecord[];
  actions: StatBlockActionRecord[];
  bonus_actions: StatBlockActionRecord[];
  reactions: StatBlockActionRecord[];
  legendary_actions: StatBlockActionRecord[];
  lair_actions: StatBlockActionRecord[];
  notes: string | null;
  tags: string[];
  source_type: SourceType;
  source_name: string | null;
  source_url: string | null;
  import_method: ImportMethod | null;
  imported_at: string | null;
  original_import_text: string | null;
  import_notes: string | null;
  parser_version: string | null;
  parser_confidence: number | null;
  import_metadata: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
};

export type StatBlockImportRecord = {
  id: string;
  owner_user_id: string | null;
  encounter_id: string | null;
  source_type: SourceType | null;
  source_name: string | null;
  source_url: string | null;
  import_method: ImportMethod;
  raw_text: string;
  parsed_result: Record<string, JsonValue> | null;
  parser_confidence: number | null;
  parse_errors: JsonValue[];
  status: ImportStatus;
  creature_template_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EncounterRecord = {
  id: string;
  owner_user_id: string | null;
  campaign_id: string | null;
  name: string;
  description: string | null;
  location: string | null;
  status: EncounterStatus;
  current_round: number;
  current_turn_index: number;
  active_entry_id: string | null;
  selected_entry_id: string | null;
  last_played_at: string | null;
  last_opened_mode: LastOpenedMode | null;
  accent_color: string | null;
  difficulty_label: string | null;
  party_level: number | null;
  party_size: number | null;
  estimated_difficulty: string | null;
  combatant_count_snapshot: number | null;
  boss_count_snapshot: number | null;
  has_lair_actions_snapshot: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CombatGroupRecord = {
  id: string;
  encounter_id: string;
  name: string;
  color_key: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type EncounterCombatantRecord = {
  id: string;
  encounter_id: string;
  creature_template_id: string | null;
  display_name: string;
  combatant_type: CombatantType;
  role: string | null;
  armor_class: number;
  max_hp: number;
  current_hp: number;
  temporary_hp: number | null;
  speed: string | null;
  initiative_bonus: number;
  initiative_value: number | null;
  initiative_manually_set: boolean;
  is_player_character: boolean;
  is_active: boolean;
  sort_order: number | null;
  combat_group_id: string | null;
  wave_id: string | null;
  conditions: CombatantCondition[];
  notes: string | null;
  ability_scores: AbilityScores;
  saving_throws: string[];
  skills: string[];
  senses: string | null;
  languages: string | null;
  traits: StatBlockTraitRecord[];
  actions: StatBlockActionRecord[];
  bonus_actions: StatBlockActionRecord[];
  reactions: StatBlockActionRecord[];
  legendary_actions: StatBlockActionRecord[];
  lair_actions: StatBlockActionRecord[];
  tags: string[];
  snapshot_metadata: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
};

export type EncounterWaveRecord = {
  id: string;
  encounter_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  deployed: boolean;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EncounterWaveMemberRecord = {
  id: string;
  wave_id: string;
  creature_template_id: string;
  quantity: number;
  default_combat_group_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InitiativeEntryRecord = {
  id: string;
  encounter_id: string;
  entry_type: InitiativeEntryType;
  combatant_id: string | null;
  display_name: string;
  initiative_value: number | null;
  initiative_manually_set: boolean;
  source_combatant_id: string | null;
  sort_order: number | null;
  is_synthetic: boolean;
  metadata: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
};

export type EncounterLogRecord = {
  id: string;
  encounter_id: string;
  combatant_id: string | null;
  event_type: string;
  description: string;
  metadata: Record<string, JsonValue>;
  created_at: string;
};

export type CreatureTemplateRecordInput = Omit<
  CreatureTemplateRecord,
  "id" | "created_at" | "updated_at"
>;

export type EncounterCombatantRecordInput = Omit<
  EncounterCombatantRecord,
  "id" | "created_at" | "updated_at"
>;
