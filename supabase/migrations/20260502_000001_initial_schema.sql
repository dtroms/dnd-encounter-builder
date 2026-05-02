-- Initial schema plan for the D&D Encounter Builder and Initiative Tracker.
-- This migration is intentionally not applied in this pass.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.creature_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null,
  name text not null,
  creature_type text not null,
  size text null,
  role text null,
  armor_class integer not null default 10,
  hit_points integer not null default 1,
  speed text null,
  initiative_bonus integer not null default 0,
  challenge_rating text null,
  proficiency_bonus integer null,
  ability_scores jsonb not null default '{}'::jsonb,
  saving_throws jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  senses text null,
  languages text null,
  resistances jsonb not null default '[]'::jsonb,
  immunities jsonb not null default '[]'::jsonb,
  vulnerabilities jsonb not null default '[]'::jsonb,
  traits jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  bonus_actions jsonb not null default '[]'::jsonb,
  reactions jsonb not null default '[]'::jsonb,
  legendary_actions jsonb not null default '[]'::jsonb,
  lair_actions jsonb not null default '[]'::jsonb,
  notes text null,
  tags text[] not null default '{}'::text[],
  source_type text not null default 'custom',
  source_name text null,
  source_url text null,
  import_method text null,
  imported_at timestamptz null,
  original_import_text text null,
  import_notes text null,
  parser_version text null,
  parser_confidence numeric null,
  import_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stat_block_imports (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null,
  encounter_id uuid null,
  source_type text null,
  source_name text null,
  source_url text null,
  import_method text not null default 'paste',
  raw_text text not null,
  parsed_result jsonb null,
  parser_confidence numeric null,
  parse_errors jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  creature_template_id uuid null references public.creature_templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null,
  name text not null,
  description text null,
  location text null,
  status text not null default 'draft',
  current_round integer not null default 1,
  current_turn_index integer not null default 0,
  selected_entry_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stat_block_imports
  add constraint stat_block_imports_encounter_id_fkey
  foreign key (encounter_id)
  references public.encounters(id)
  on delete set null;

create table if not exists public.combat_groups (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  name text not null,
  color_key text not null default 'Gray',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.encounter_combatants (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  creature_template_id uuid null references public.creature_templates(id) on delete set null,
  display_name text not null,
  combatant_type text not null,
  role text null,
  armor_class integer not null default 10,
  max_hp integer not null default 1,
  current_hp integer not null default 1,
  temporary_hp integer null,
  speed text null,
  initiative_bonus integer not null default 0,
  initiative_value integer null,
  initiative_manually_set boolean not null default false,
  is_player_character boolean not null default false,
  is_active boolean not null default false,
  sort_order integer null,
  combat_group_id uuid null references public.combat_groups(id) on delete set null,
  wave_id uuid null,
  conditions text[] not null default '{}'::text[],
  notes text null,
  ability_scores jsonb not null default '{}'::jsonb,
  saving_throws jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  senses text null,
  languages text null,
  traits jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  bonus_actions jsonb not null default '[]'::jsonb,
  reactions jsonb not null default '[]'::jsonb,
  legendary_actions jsonb not null default '[]'::jsonb,
  lair_actions jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  snapshot_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.encounter_waves (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  name text not null,
  description text null,
  sort_order integer not null default 0,
  deployed boolean not null default false,
  deployed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.encounter_combatants
  add constraint encounter_combatants_wave_id_fkey
  foreign key (wave_id)
  references public.encounter_waves(id)
  on delete set null;

create table if not exists public.encounter_wave_members (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid not null references public.encounter_waves(id) on delete cascade,
  creature_template_id uuid not null references public.creature_templates(id) on delete restrict,
  quantity integer not null default 1,
  default_combat_group_id uuid null references public.combat_groups(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.initiative_entries (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  entry_type text not null default 'combatant',
  combatant_id uuid null references public.encounter_combatants(id) on delete cascade,
  display_name text not null,
  initiative_value integer null,
  source_combatant_id uuid null references public.encounter_combatants(id) on delete cascade,
  sort_order integer null,
  is_synthetic boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.encounters
  add constraint encounters_selected_entry_id_fkey
  foreign key (selected_entry_id)
  references public.initiative_entries(id)
  on delete set null;

create table if not exists public.encounter_log (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  combatant_id uuid null references public.encounter_combatants(id) on delete set null,
  event_type text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists creature_templates_owner_user_id_idx on public.creature_templates(owner_user_id);
create index if not exists creature_templates_source_type_idx on public.creature_templates(source_type);
create index if not exists creature_templates_import_method_idx on public.creature_templates(import_method);
create index if not exists creature_templates_tags_idx on public.creature_templates using gin(tags);

create index if not exists stat_block_imports_owner_user_id_idx on public.stat_block_imports(owner_user_id);
create index if not exists stat_block_imports_encounter_id_idx on public.stat_block_imports(encounter_id);
create index if not exists stat_block_imports_creature_template_id_idx on public.stat_block_imports(creature_template_id);
create index if not exists stat_block_imports_source_type_idx on public.stat_block_imports(source_type);
create index if not exists stat_block_imports_import_method_idx on public.stat_block_imports(import_method);
create index if not exists stat_block_imports_status_idx on public.stat_block_imports(status);

create index if not exists encounters_owner_user_id_idx on public.encounters(owner_user_id);
create index if not exists encounters_status_idx on public.encounters(status);

create index if not exists combat_groups_encounter_id_idx on public.combat_groups(encounter_id);

create index if not exists encounter_combatants_encounter_id_idx on public.encounter_combatants(encounter_id);
create index if not exists encounter_combatants_creature_template_id_idx on public.encounter_combatants(creature_template_id);
create index if not exists encounter_combatants_combat_group_id_idx on public.encounter_combatants(combat_group_id);
create index if not exists encounter_combatants_wave_id_idx on public.encounter_combatants(wave_id);

create index if not exists encounter_waves_encounter_id_idx on public.encounter_waves(encounter_id);

create index if not exists encounter_wave_members_wave_id_idx on public.encounter_wave_members(wave_id);
create index if not exists encounter_wave_members_creature_template_id_idx on public.encounter_wave_members(creature_template_id);
create index if not exists encounter_wave_members_default_combat_group_id_idx on public.encounter_wave_members(default_combat_group_id);

create index if not exists initiative_entries_encounter_id_idx on public.initiative_entries(encounter_id);
create index if not exists initiative_entries_combatant_id_idx on public.initiative_entries(combatant_id);
create index if not exists initiative_entries_source_combatant_id_idx on public.initiative_entries(source_combatant_id);
create index if not exists initiative_entries_entry_type_idx on public.initiative_entries(entry_type);

create index if not exists encounter_log_encounter_id_idx on public.encounter_log(encounter_id);
create index if not exists encounter_log_combatant_id_idx on public.encounter_log(combatant_id);

create trigger set_creature_templates_updated_at
before update on public.creature_templates
for each row execute function public.set_updated_at();

create trigger set_stat_block_imports_updated_at
before update on public.stat_block_imports
for each row execute function public.set_updated_at();

create trigger set_encounters_updated_at
before update on public.encounters
for each row execute function public.set_updated_at();

create trigger set_combat_groups_updated_at
before update on public.combat_groups
for each row execute function public.set_updated_at();

create trigger set_encounter_combatants_updated_at
before update on public.encounter_combatants
for each row execute function public.set_updated_at();

create trigger set_encounter_waves_updated_at
before update on public.encounter_waves
for each row execute function public.set_updated_at();

create trigger set_encounter_wave_members_updated_at
before update on public.encounter_wave_members
for each row execute function public.set_updated_at();

create trigger set_initiative_entries_updated_at
before update on public.initiative_entries
for each row execute function public.set_updated_at();
