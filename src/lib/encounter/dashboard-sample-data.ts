import type { EncounterStatus } from "./db-types";
import type { CombatantType } from "./types";

export type DashboardCombatantPreview = {
  id: string;
  name: string;
  combatant_type: CombatantType;
  group_name: string;
  group_color_key: "Blue" | "Green" | "Red" | "Gold" | "Purple" | "Gray" | "Cyan" | "Magenta" | "None";
};

export type SavedCampaignSummary = {
  id: string;
  name: string;
  description?: string;
  accent_color?: SavedEncounterSummary["accent_color"];
  status?: "active" | "archived";
};

export type SavedEncounterSummary = {
  campaign_id: string | null;
  campaign_name: string;
  id: string;
  name: string;
  description: string;
  location: string;
  status: EncounterStatus;
  current_round: number;
  current_turn_index: number;
  last_played_at: string | null;
  updated_at: string;
  party_level: number;
  party_size: number;
  difficulty_label: string;
  estimated_difficulty: string;
  accent_color: "Blue" | "Green" | "Red" | "Gold" | "Purple" | "Gray" | "Cyan" | "Magenta";
  combatant_count_snapshot: number;
  boss_count_snapshot: number;
  has_lair_actions_snapshot: boolean;
  group_count: number;
  combatants_preview: DashboardCombatantPreview[];
  notes?: string;
  reminders?: string[];
};

export const savedCampaignSamples: SavedCampaignSummary[] = [
  {
    accent_color: "Gold",
    description: "Road trouble, market fights, and lantern-lit schemes.",
    id: "lantern-road",
    name: "The Lantern Road",
    status: "active",
  },
  {
    accent_color: "Green",
    description: "Woodland travel, moonlit shrines, and uneasy allies.",
    id: "moonwell-vale",
    name: "Moonwell Vale",
    status: "active",
  },
  {
    accent_color: "Red",
    description: "Old checkpoints, barricades, and ash-choked roads.",
    id: "ash-gate",
    name: "Ash Gate",
    status: "active",
  },
  {
    accent_color: "Purple",
    description: "Cellar brawls and violet-lit trouble beneath the tavern.",
    id: "violet-keg-cellars",
    name: "Violet Keg Cellars",
    status: "active",
  },
];

export const savedEncounterSamples: SavedEncounterSummary[] = [
  {
    campaign_id: "lantern-road",
    campaign_name: "The Lantern Road",
    id: "10000000-0000-4000-8000-000000000001",
    name: "Lantern Alley Ambush",
    description:
      "A table-ready alley fight with a commander boss, mixed warband, neutral guide, and a visible lair action row.",
    location: "Lantern Alley market cut-through",
    status: "running",
    current_round: 1,
    current_turn_index: 0,
    last_played_at: "2026-05-02T21:15:00.000Z",
    updated_at: "2026-05-02T21:20:00.000Z",
    party_level: 4,
    party_size: 3,
    difficulty_label: "Hard",
    estimated_difficulty: "Hard",
    accent_color: "Gold",
    combatant_count_snapshot: 10,
    boss_count_snapshot: 1,
    has_lair_actions_snapshot: true,
    group_count: 3,
    combatants_preview: [
      { id: "lantern-aria", name: "Aria Vale", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "lantern-mira", name: "Mira Quill", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "lantern-tovin", name: "Tovin Bramble", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "lantern-cinder", name: "Cindercap Sneak 1", combatant_type: "enemy", group_name: "Red Warband", group_color_key: "Red" },
      { id: "lantern-rattle", name: "Rattlebone Slinger 1", combatant_type: "enemy", group_name: "Red Warband", group_color_key: "Red" },
      { id: "lantern-murk", name: "Murkpot Hexer 1", combatant_type: "enemy", group_name: "Red Warband", group_color_key: "Red" },
      { id: "lantern-bristle", name: "Bristlejaw Guard 1", combatant_type: "enemy", group_name: "Red Warband", group_color_key: "Red" },
      { id: "lantern-hound", name: "Duskmaw Hound", combatant_type: "enemy", group_name: "Red Warband", group_color_key: "Red" },
      { id: "lantern-velkora", name: "Velkora, Lantern Tyrant", combatant_type: "boss", group_name: "Gold Vanguard", group_color_key: "Gold" },
      { id: "lantern-sable", name: "Sable Market Guide", combatant_type: "neutral", group_name: "Ungrouped", group_color_key: "None" },
    ],
    notes:
      "Start with the market stalls as cover. Keep the neutral guide close to the party unless the boss calls for a retreat.",
    reminders: [
      "Lair action occurs on initiative 20.",
      "A second alarm bell rings if the boss survives past round 3.",
      "The boss tries to flee once badly wounded.",
    ],
  },
  {
    campaign_id: "moonwell-vale",
    campaign_name: "Moonwell Vale",
    id: "10000000-0000-4000-8000-000000000002",
    name: "Moonwell Watch Draft",
    description:
      "A quiet woodland setup with scouts, a nervous ally, and space for one more patrol before the table starts.",
    location: "Old Moonwell road shrine",
    status: "draft",
    current_round: 1,
    current_turn_index: 0,
    last_played_at: null,
    updated_at: "2026-04-30T18:40:00.000Z",
    party_level: 3,
    party_size: 4,
    difficulty_label: "Medium",
    estimated_difficulty: "Medium",
    accent_color: "Green",
    combatant_count_snapshot: 6,
    boss_count_snapshot: 0,
    has_lair_actions_snapshot: false,
    group_count: 2,
    combatants_preview: [
      { id: "moonwell-aria", name: "Aria Vale", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "moonwell-mira", name: "Mira Quill", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "moonwell-tovin", name: "Tovin Bramble", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "moonwell-sable", name: "Sable Market Guide", combatant_type: "neutral", group_name: "Roadside", group_color_key: "Gray" },
      { id: "moonwell-cinder", name: "Cindercap Lookout", combatant_type: "enemy", group_name: "Thicket Crew", group_color_key: "Green" },
      { id: "moonwell-rattle", name: "Rattlebone Pebbler", combatant_type: "enemy", group_name: "Thicket Crew", group_color_key: "Green" },
    ],
    notes:
      "Use this as a flexible draft. The shrine can become either a tense negotiation or a quick roadside fight.",
    reminders: [
      "Add one more patrol if the party arrives loudly.",
      "The nervous ally should warn the party before blades come out.",
    ],
  },
  {
    campaign_id: "lantern-road",
    campaign_name: "The Lantern Road",
    id: "10000000-0000-4000-8000-000000000003",
    name: "Glassworks Rooftop Chase",
    description:
      "Completed rooftop pursuit with fragile walkways, thrown lanterns, and a final duel above the furnace vents.",
    location: "Rillford glassworks district",
    status: "completed",
    current_round: 5,
    current_turn_index: 2,
    last_played_at: "2026-04-26T02:10:00.000Z",
    updated_at: "2026-04-26T02:18:00.000Z",
    party_level: 5,
    party_size: 4,
    difficulty_label: "Deadly",
    estimated_difficulty: "Deadly",
    accent_color: "Cyan",
    combatant_count_snapshot: 12,
    boss_count_snapshot: 1,
    has_lair_actions_snapshot: false,
    group_count: 4,
    combatants_preview: [
      { id: "glass-aria", name: "Aria Vale", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "glass-mira", name: "Mira Quill", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "glass-tovin", name: "Tovin Bramble", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "glass-cinder-1", name: "Cindercap Rafter Runner", combatant_type: "enemy", group_name: "Roof Crew", group_color_key: "Red" },
      { id: "glass-cinder-2", name: "Cindercap Hookhand", combatant_type: "enemy", group_name: "Roof Crew", group_color_key: "Red" },
      { id: "glass-rattle", name: "Rattlebone Shard Slinger", combatant_type: "enemy", group_name: "Roof Crew", group_color_key: "Red" },
      { id: "glass-hound", name: "Duskmaw Glass Hound", combatant_type: "enemy", group_name: "Shadow Lane", group_color_key: "Purple" },
      { id: "glass-velkora", name: "Velkora's Ember Captain", combatant_type: "boss", group_name: "Furnace Guard", group_color_key: "Gold" },
      { id: "glass-guide", name: "Sable Market Guide", combatant_type: "neutral", group_name: "Bystanders", group_color_key: "Gray" },
      { id: "glass-bristle", name: "Bristlejaw Door Guard", combatant_type: "enemy", group_name: "Furnace Guard", group_color_key: "Gold" },
      { id: "glass-murk", name: "Murkpot Smoke Hexer", combatant_type: "enemy", group_name: "Shadow Lane", group_color_key: "Purple" },
      { id: "glass-rattle-2", name: "Rattlebone Bottle Tosser", combatant_type: "enemy", group_name: "Roof Crew", group_color_key: "Red" },
    ],
    notes:
      "Finished encounter record. Keep this around as a reference for future rooftop hazards and chase pacing.",
    reminders: [
      "Fragile walkways break after a heavy hit.",
      "Furnace vents create cover but punish anyone who stays too long.",
    ],
  },
  {
    campaign_id: "ash-gate",
    campaign_name: "Ash Gate",
    id: "10000000-0000-4000-8000-000000000004",
    name: "Ash Gate Tollhouse",
    description:
      "Archived checkpoint encounter with a barricade crew, two wave notes, and a possible surrender path.",
    location: "Ash Gate northern tollhouse",
    status: "archived",
    current_round: 1,
    current_turn_index: 0,
    last_played_at: "2026-03-18T00:35:00.000Z",
    updated_at: "2026-03-19T14:05:00.000Z",
    party_level: 2,
    party_size: 5,
    difficulty_label: "Easy",
    estimated_difficulty: "Easy",
    accent_color: "Red",
    combatant_count_snapshot: 8,
    boss_count_snapshot: 0,
    has_lair_actions_snapshot: false,
    group_count: 3,
    combatants_preview: [
      { id: "ash-aria", name: "Aria Vale", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "ash-mira", name: "Mira Quill", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "ash-tovin", name: "Tovin Bramble", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "ash-bristle-1", name: "Bristlejaw Toll Guard", combatant_type: "enemy", group_name: "Gate Crew", group_color_key: "Red" },
      { id: "ash-bristle-2", name: "Bristlejaw Chain Guard", combatant_type: "enemy", group_name: "Gate Crew", group_color_key: "Red" },
      { id: "ash-rattle", name: "Rattlebone Bell Ringer", combatant_type: "enemy", group_name: "Signal Crew", group_color_key: "Gold" },
      { id: "ash-cinder", name: "Cindercap Fuse Sneak", combatant_type: "enemy", group_name: "Signal Crew", group_color_key: "Gold" },
      { id: "ash-sable", name: "Sable Market Guide", combatant_type: "neutral", group_name: "Ungrouped", group_color_key: "None" },
    ],
    notes:
      "Archived checkpoint fight with a possible surrender route. Useful template for guarded roadblocks.",
    reminders: [
      "Signal crew can call reinforcements after round 2.",
      "Gate crew may surrender if both guards are bloodied.",
    ],
  },
  {
    campaign_id: "violet-keg-cellars",
    campaign_name: "Violet Keg Cellars",
    id: "10000000-0000-4000-8000-000000000005",
    name: "Violet Cellar Breakout",
    description:
      "A running cellar brawl with cramped sight lines, summoned help, and one unstable ritual hazard.",
    location: "Violet Keg cellar rooms",
    status: "running",
    current_round: 3,
    current_turn_index: 4,
    last_played_at: "2026-05-01T23:55:00.000Z",
    updated_at: "2026-05-02T00:12:00.000Z",
    party_level: 4,
    party_size: 3,
    difficulty_label: "Hard",
    estimated_difficulty: "Hard",
    accent_color: "Purple",
    combatant_count_snapshot: 9,
    boss_count_snapshot: 1,
    has_lair_actions_snapshot: true,
    group_count: 3,
    combatants_preview: [
      { id: "violet-aria", name: "Aria Vale", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "violet-mira", name: "Mira Quill", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "violet-tovin", name: "Tovin Bramble", combatant_type: "pc", group_name: "Party", group_color_key: "Blue" },
      { id: "violet-murk", name: "Murkpot Cellar Hexer", combatant_type: "enemy", group_name: "Violet Crew", group_color_key: "Purple" },
      { id: "violet-cinder-1", name: "Cindercap Barrel Sneak", combatant_type: "enemy", group_name: "Violet Crew", group_color_key: "Purple" },
      { id: "violet-cinder-2", name: "Cindercap Taproom Sneak", combatant_type: "enemy", group_name: "Violet Crew", group_color_key: "Purple" },
      { id: "violet-hound", name: "Duskmaw Cellar Hound", combatant_type: "enemy", group_name: "Shadow Spill", group_color_key: "Red" },
      { id: "violet-velkora", name: "Velkora's Lantern Shade", combatant_type: "boss", group_name: "Shadow Spill", group_color_key: "Gold" },
      { id: "violet-sable", name: "Sable Market Guide", combatant_type: "neutral", group_name: "Ungrouped", group_color_key: "None" },
    ],
    notes:
      "Cramped cellar fight. Keep movement tight and make the ritual hazard feel unstable without turning it into bookkeeping.",
    reminders: [
      "Lair action occurs on initiative 20.",
      "Ritual flare-up at the end of round 2.",
      "Summoned help should enter near the back stairs.",
    ],
  },
];
