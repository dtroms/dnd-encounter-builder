create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid null references auth.users(id) on delete cascade,
  name text not null,
  description text null,
  accent_color text null,
  status text not null default 'active',
  sort_order integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.encounters
  add column if not exists campaign_id uuid null references public.campaigns(id) on delete set null;

create index if not exists campaigns_owner_user_id_idx on public.campaigns(owner_user_id);
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists encounters_campaign_id_idx on public.encounters(campaign_id);

drop trigger if exists set_campaigns_updated_at on public.campaigns;
create trigger set_campaigns_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "campaigns_select_own" on public.campaigns;
create policy "campaigns_select_own"
on public.campaigns
for select
using (owner_user_id = auth.uid());

drop policy if exists "campaigns_insert_own" on public.campaigns;
create policy "campaigns_insert_own"
on public.campaigns
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own"
on public.campaigns
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "campaigns_delete_own" on public.campaigns;
create policy "campaigns_delete_own"
on public.campaigns
for delete
using (owner_user_id = auth.uid());
