-- Local RLS smoke test for D&D Encounter Builder beta data isolation.
--
-- Run only against a local/dev Supabase database after:
--   npx supabase db reset
--
-- Example with local Supabase:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_smoke_test.sql
--
-- This script uses fake local users and simulates Supabase Auth by switching to
-- the authenticated role and setting request.jwt.claim.sub. It should never be
-- run against production data.

\set ON_ERROR_STOP on

reset role;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a1';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b2';
begin
  delete from public.encounters where owner_user_id in (user_a, user_b);
  delete from public.stat_block_imports where owner_user_id in (user_a, user_b);
  delete from public.creature_templates where owner_user_id in (user_a, user_b);
  delete from auth.users where id in (user_a, user_b);
end;
$$;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-0000000000a1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rls-user-a@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS User A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-0000000000b2',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rls-user-b@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS User B"}'::jsonb,
    now(),
    now()
  );

insert into public.creature_templates (
  id,
  owner_user_id,
  name,
  creature_type,
  armor_class,
  hit_points
)
values
  ('10000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'User A Test Creature', 'enemy', 12, 8),
  ('10000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', 'User B Test Creature', 'enemy', 13, 9);

insert into public.stat_block_imports (
  id,
  owner_user_id,
  source_type,
  import_method,
  raw_text
)
values
  ('20000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'custom', 'paste', 'User A import'),
  ('20000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', 'custom', 'paste', 'User B import');

insert into public.encounters (
  id,
  owner_user_id,
  name
)
values
  ('30000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'User A Test Encounter'),
  ('30000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000b2', 'User B Test Encounter');

insert into public.combat_groups (
  id,
  encounter_id,
  name,
  color_key
)
values
  ('40000000-0000-4000-8000-0000000000a1', '30000000-0000-4000-8000-0000000000a1', 'User A Group', 'Green'),
  ('40000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b2', 'User B Group', 'Red');

insert into public.encounter_waves (
  id,
  encounter_id,
  name
)
values
  ('50000000-0000-4000-8000-0000000000a1', '30000000-0000-4000-8000-0000000000a1', 'User A Wave'),
  ('50000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b2', 'User B Wave');

insert into public.encounter_combatants (
  id,
  encounter_id,
  creature_template_id,
  display_name,
  combatant_type,
  armor_class,
  max_hp,
  current_hp,
  combat_group_id,
  wave_id
)
values
  (
    '60000000-0000-4000-8000-0000000000a1',
    '30000000-0000-4000-8000-0000000000a1',
    '10000000-0000-4000-8000-0000000000a1',
    'User A Combatant',
    'enemy',
    12,
    8,
    8,
    '40000000-0000-4000-8000-0000000000a1',
    '50000000-0000-4000-8000-0000000000a1'
  ),
  (
    '60000000-0000-4000-8000-0000000000b2',
    '30000000-0000-4000-8000-0000000000b2',
    '10000000-0000-4000-8000-0000000000b2',
    'User B Combatant',
    'enemy',
    13,
    9,
    9,
    '40000000-0000-4000-8000-0000000000b2',
    '50000000-0000-4000-8000-0000000000b2'
  );

insert into public.encounter_wave_members (
  id,
  wave_id,
  creature_template_id,
  quantity,
  default_combat_group_id
)
values
  ('70000000-0000-4000-8000-0000000000a1', '50000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', 1, '40000000-0000-4000-8000-0000000000a1'),
  ('70000000-0000-4000-8000-0000000000b2', '50000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b2', 1, '40000000-0000-4000-8000-0000000000b2');

insert into public.initiative_entries (
  id,
  encounter_id,
  combatant_id,
  display_name,
  initiative_value
)
values
  ('80000000-0000-4000-8000-0000000000a1', '30000000-0000-4000-8000-0000000000a1', '60000000-0000-4000-8000-0000000000a1', 'User A Initiative', 14),
  ('80000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b2', '60000000-0000-4000-8000-0000000000b2', 'User B Initiative', 15);

insert into public.encounter_log (
  id,
  encounter_id,
  combatant_id,
  event_type,
  description
)
values
  ('90000000-0000-4000-8000-0000000000a1', '30000000-0000-4000-8000-0000000000a1', '60000000-0000-4000-8000-0000000000a1', 'test', 'User A log'),
  ('90000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b2', '60000000-0000-4000-8000-0000000000b2', 'test', 'User B log');

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';

do $$
declare
  visible_count integer;
  changed_count integer;
begin
  select count(*) into visible_count from public.profiles;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own profile, saw %', visible_count;
  end if;

  update public.profiles
  set display_name = 'User A Updated'
  where id = '00000000-0000-4000-8000-0000000000a1';
  get diagnostics changed_count = row_count;
  if changed_count <> 1 then
    raise exception 'Expected User A to update own profile, updated % rows', changed_count;
  end if;

  update public.profiles
  set display_name = 'User B Should Not Update'
  where id = '00000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A updated User B profile';
  end if;

  select count(*) into visible_count from public.creature_templates;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own creature, saw %', visible_count;
  end if;

  insert into public.creature_templates (
    owner_user_id,
    name,
    creature_type,
    armor_class,
    hit_points
  )
  values (
    '00000000-0000-4000-8000-0000000000a1',
    'User A Inserted Creature',
    'enemy',
    11,
    5
  );

  begin
    insert into public.creature_templates (
      owner_user_id,
      name,
      creature_type,
      armor_class,
      hit_points
    )
    values (
      '00000000-0000-4000-8000-0000000000b2',
      'Forbidden User B Creature',
      'enemy',
      11,
      5
    );
    raise exception 'User A inserted a creature owned by User B';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  update public.creature_templates
  set name = 'User B Creature Should Not Update'
  where id = '10000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A updated User B creature';
  end if;

  delete from public.creature_templates
  where id = '10000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A deleted User B creature';
  end if;

  select count(*) into visible_count from public.stat_block_imports;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own stat block import, saw %', visible_count;
  end if;

  begin
    insert into public.stat_block_imports (
      owner_user_id,
      import_method,
      raw_text
    )
    values (
      '00000000-0000-4000-8000-0000000000b2',
      'paste',
      'Forbidden User B import'
    );
    raise exception 'User A inserted an import owned by User B';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  update public.stat_block_imports
  set status = 'reviewed'
  where id = '20000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A updated User B import';
  end if;

  select count(*) into visible_count from public.encounters;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own encounter, saw %', visible_count;
  end if;

  insert into public.encounters (owner_user_id, name)
  values ('00000000-0000-4000-8000-0000000000a1', 'User A Inserted Encounter');

  begin
    insert into public.encounters (owner_user_id, name)
    values ('00000000-0000-4000-8000-0000000000b2', 'Forbidden User B Encounter');
    raise exception 'User A inserted an encounter owned by User B';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  update public.encounters
  set name = 'User B Encounter Should Not Update'
  where id = '30000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A updated User B encounter';
  end if;

  delete from public.encounters
  where id = '30000000-0000-4000-8000-0000000000b2';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'User A deleted User B encounter';
  end if;

  select count(*) into visible_count from public.combat_groups;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own combat group, saw %', visible_count;
  end if;

  select count(*) into visible_count from public.encounter_combatants;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own combatant, saw %', visible_count;
  end if;

  select count(*) into visible_count from public.encounter_waves;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own wave, saw %', visible_count;
  end if;

  select count(*) into visible_count from public.encounter_wave_members;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own wave member, saw %', visible_count;
  end if;

  select count(*) into visible_count from public.initiative_entries;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own initiative entry, saw %', visible_count;
  end if;

  select count(*) into visible_count from public.encounter_log;
  if visible_count <> 1 then
    raise exception 'Expected User A to see only own encounter log row, saw %', visible_count;
  end if;

  begin
    insert into public.combat_groups (encounter_id, name, color_key)
    values ('30000000-0000-4000-8000-0000000000b2', 'Forbidden User B Group', 'Gray');
    raise exception 'User A inserted a combat group into User B encounter';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.encounter_combatants (
      encounter_id,
      display_name,
      combatant_type,
      armor_class,
      max_hp,
      current_hp
    )
    values (
      '30000000-0000-4000-8000-0000000000b2',
      'Forbidden User B Combatant',
      'enemy',
      10,
      1,
      1
    );
    raise exception 'User A inserted a combatant into User B encounter';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.encounter_waves (encounter_id, name)
    values ('30000000-0000-4000-8000-0000000000b2', 'Forbidden User B Wave');
    raise exception 'User A inserted a wave into User B encounter';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.encounter_wave_members (
      wave_id,
      creature_template_id,
      quantity
    )
    values (
      '50000000-0000-4000-8000-0000000000b2',
      '10000000-0000-4000-8000-0000000000a1',
      1
    );
    raise exception 'User A inserted a wave member into User B wave';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.initiative_entries (
      encounter_id,
      display_name,
      initiative_value
    )
    values (
      '30000000-0000-4000-8000-0000000000b2',
      'Forbidden User B Initiative',
      10
    );
    raise exception 'User A inserted an initiative entry into User B encounter';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.encounter_log (
      encounter_id,
      event_type,
      description
    )
    values (
      '30000000-0000-4000-8000-0000000000b2',
      'test',
      'Forbidden User B log'
    );
    raise exception 'User A inserted an encounter log row into User B encounter';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;
end;
$$;

reset role;

do $$
declare
  user_a constant uuid := '00000000-0000-4000-8000-0000000000a1';
  user_b constant uuid := '00000000-0000-4000-8000-0000000000b2';
begin
  delete from public.encounters where owner_user_id in (user_a, user_b);
  delete from public.stat_block_imports where owner_user_id in (user_a, user_b);
  delete from public.creature_templates where owner_user_id in (user_a, user_b);
  delete from auth.users where id in (user_a, user_b);
end;
$$;

select 'RLS smoke test passed' as result;
