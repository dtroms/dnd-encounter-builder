-- Profiles and beta Row Level Security foundation.
-- This migration prepares user data isolation before UI persistence is wired.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  email text null,
  avatar_url text null,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_display_name text;
  fallback_display_name text;
begin
  metadata_display_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');
  fallback_display_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');

  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(metadata_display_name, fallback_display_name, 'New user')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.creature_templates enable row level security;
alter table public.stat_block_imports enable row level security;
alter table public.encounters enable row level security;
alter table public.combat_groups enable row level security;
alter table public.encounter_combatants enable row level security;
alter table public.encounter_waves enable row level security;
alter table public.encounter_wave_members enable row level security;
alter table public.initiative_entries enable row level security;
alter table public.encounter_log enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.creature_templates to authenticated;
grant select, insert, update, delete on public.stat_block_imports to authenticated;
grant select, insert, update, delete on public.encounters to authenticated;
grant select, insert, update, delete on public.combat_groups to authenticated;
grant select, insert, update, delete on public.encounter_combatants to authenticated;
grant select, insert, update, delete on public.encounter_waves to authenticated;
grant select, insert, update, delete on public.encounter_wave_members to authenticated;
grant select, insert, update, delete on public.initiative_entries to authenticated;
grant select, insert, update, delete on public.encounter_log to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "creature_templates_select_own" on public.creature_templates;
create policy "creature_templates_select_own"
on public.creature_templates
for select
using (owner_user_id = auth.uid());

drop policy if exists "creature_templates_insert_own" on public.creature_templates;
create policy "creature_templates_insert_own"
on public.creature_templates
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "creature_templates_update_own" on public.creature_templates;
create policy "creature_templates_update_own"
on public.creature_templates
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "creature_templates_delete_own" on public.creature_templates;
create policy "creature_templates_delete_own"
on public.creature_templates
for delete
using (owner_user_id = auth.uid());

drop policy if exists "stat_block_imports_select_own" on public.stat_block_imports;
create policy "stat_block_imports_select_own"
on public.stat_block_imports
for select
using (owner_user_id = auth.uid());

drop policy if exists "stat_block_imports_insert_own" on public.stat_block_imports;
create policy "stat_block_imports_insert_own"
on public.stat_block_imports
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "stat_block_imports_update_own" on public.stat_block_imports;
create policy "stat_block_imports_update_own"
on public.stat_block_imports
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "stat_block_imports_delete_own" on public.stat_block_imports;
create policy "stat_block_imports_delete_own"
on public.stat_block_imports
for delete
using (owner_user_id = auth.uid());

drop policy if exists "encounters_select_own" on public.encounters;
create policy "encounters_select_own"
on public.encounters
for select
using (owner_user_id = auth.uid());

drop policy if exists "encounters_insert_own" on public.encounters;
create policy "encounters_insert_own"
on public.encounters
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "encounters_update_own" on public.encounters;
create policy "encounters_update_own"
on public.encounters
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "encounters_delete_own" on public.encounters;
create policy "encounters_delete_own"
on public.encounters
for delete
using (owner_user_id = auth.uid());

drop policy if exists "combat_groups_select_by_encounter_owner" on public.combat_groups;
create policy "combat_groups_select_by_encounter_owner"
on public.combat_groups
for select
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = combat_groups.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "combat_groups_insert_by_encounter_owner" on public.combat_groups;
create policy "combat_groups_insert_by_encounter_owner"
on public.combat_groups
for insert
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = combat_groups.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "combat_groups_update_by_encounter_owner" on public.combat_groups;
create policy "combat_groups_update_by_encounter_owner"
on public.combat_groups
for update
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = combat_groups.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = combat_groups.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "combat_groups_delete_by_encounter_owner" on public.combat_groups;
create policy "combat_groups_delete_by_encounter_owner"
on public.combat_groups
for delete
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = combat_groups.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_combatants_select_by_encounter_owner" on public.encounter_combatants;
create policy "encounter_combatants_select_by_encounter_owner"
on public.encounter_combatants
for select
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_combatants.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_combatants_insert_by_encounter_owner" on public.encounter_combatants;
create policy "encounter_combatants_insert_by_encounter_owner"
on public.encounter_combatants
for insert
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_combatants.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_combatants_update_by_encounter_owner" on public.encounter_combatants;
create policy "encounter_combatants_update_by_encounter_owner"
on public.encounter_combatants
for update
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_combatants.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_combatants.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_combatants_delete_by_encounter_owner" on public.encounter_combatants;
create policy "encounter_combatants_delete_by_encounter_owner"
on public.encounter_combatants
for delete
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_combatants.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_waves_select_by_encounter_owner" on public.encounter_waves;
create policy "encounter_waves_select_by_encounter_owner"
on public.encounter_waves
for select
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_waves.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_waves_insert_by_encounter_owner" on public.encounter_waves;
create policy "encounter_waves_insert_by_encounter_owner"
on public.encounter_waves
for insert
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_waves.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_waves_update_by_encounter_owner" on public.encounter_waves;
create policy "encounter_waves_update_by_encounter_owner"
on public.encounter_waves
for update
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_waves.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_waves.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_waves_delete_by_encounter_owner" on public.encounter_waves;
create policy "encounter_waves_delete_by_encounter_owner"
on public.encounter_waves
for delete
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_waves.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_wave_members_select_by_encounter_owner" on public.encounter_wave_members;
create policy "encounter_wave_members_select_by_encounter_owner"
on public.encounter_wave_members
for select
using (
  exists (
    select 1
    from public.encounter_waves
    join public.encounters on encounters.id = encounter_waves.encounter_id
    where encounter_waves.id = encounter_wave_members.wave_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_wave_members_insert_by_encounter_owner" on public.encounter_wave_members;
create policy "encounter_wave_members_insert_by_encounter_owner"
on public.encounter_wave_members
for insert
with check (
  exists (
    select 1
    from public.encounter_waves
    join public.encounters on encounters.id = encounter_waves.encounter_id
    where encounter_waves.id = encounter_wave_members.wave_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_wave_members_update_by_encounter_owner" on public.encounter_wave_members;
create policy "encounter_wave_members_update_by_encounter_owner"
on public.encounter_wave_members
for update
using (
  exists (
    select 1
    from public.encounter_waves
    join public.encounters on encounters.id = encounter_waves.encounter_id
    where encounter_waves.id = encounter_wave_members.wave_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounter_waves
    join public.encounters on encounters.id = encounter_waves.encounter_id
    where encounter_waves.id = encounter_wave_members.wave_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_wave_members_delete_by_encounter_owner" on public.encounter_wave_members;
create policy "encounter_wave_members_delete_by_encounter_owner"
on public.encounter_wave_members
for delete
using (
  exists (
    select 1
    from public.encounter_waves
    join public.encounters on encounters.id = encounter_waves.encounter_id
    where encounter_waves.id = encounter_wave_members.wave_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "initiative_entries_select_by_encounter_owner" on public.initiative_entries;
create policy "initiative_entries_select_by_encounter_owner"
on public.initiative_entries
for select
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = initiative_entries.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "initiative_entries_insert_by_encounter_owner" on public.initiative_entries;
create policy "initiative_entries_insert_by_encounter_owner"
on public.initiative_entries
for insert
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = initiative_entries.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "initiative_entries_update_by_encounter_owner" on public.initiative_entries;
create policy "initiative_entries_update_by_encounter_owner"
on public.initiative_entries
for update
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = initiative_entries.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = initiative_entries.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "initiative_entries_delete_by_encounter_owner" on public.initiative_entries;
create policy "initiative_entries_delete_by_encounter_owner"
on public.initiative_entries
for delete
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = initiative_entries.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_log_select_by_encounter_owner" on public.encounter_log;
create policy "encounter_log_select_by_encounter_owner"
on public.encounter_log
for select
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_log.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_log_insert_by_encounter_owner" on public.encounter_log;
create policy "encounter_log_insert_by_encounter_owner"
on public.encounter_log
for insert
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_log.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_log_update_by_encounter_owner" on public.encounter_log;
create policy "encounter_log_update_by_encounter_owner"
on public.encounter_log
for update
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_log.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_log.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);

drop policy if exists "encounter_log_delete_by_encounter_owner" on public.encounter_log;
create policy "encounter_log_delete_by_encounter_owner"
on public.encounter_log
for delete
using (
  exists (
    select 1
    from public.encounters
    where encounters.id = encounter_log.encounter_id
      and encounters.owner_user_id = auth.uid()
  )
);
