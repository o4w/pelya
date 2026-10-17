-- Haftalık (sezonluk) sıralama: herkes okur, yalnızca sahibi yazar.
create table public.season_scores (
  season text not null check (season ~ '^[0-9]{4}-W[0-9]{2}$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  cafe_name text not null check (char_length(cafe_name) between 1 and 14),
  city text not null check (char_length(city) between 1 and 24),
  score numeric not null check (score >= 0 and score <= 1e15),
  level integer not null check (level between 1 and 1000),
  updated_at timestamptz not null default now(),
  primary key (season, user_id)
);
create index season_scores_rank_idx on public.season_scores (season, score desc);
alter table public.season_scores enable row level security;

create policy "season_select_all" on public.season_scores
  for select to anon, authenticated using (true);
create policy "season_insert_own" on public.season_scores
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "season_update_own" on public.season_scores
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "season_delete_own" on public.season_scores
  for delete to authenticated using ((select auth.uid()) = user_id);

create trigger season_scores_touch before insert or update on public.season_scores
  for each row execute function public.touch_updated_at();

-- Anonim kullanım ölçümü: istemci yalnızca yazabilir, hiç kimse (anon/authenticated) okuyamaz.
-- Kimlik içermez; anon_id cihazda üretilen rastgele bir değerdir.
create table public.app_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  anon_id uuid not null,
  name text not null check (name ~ '^[a-z0-9_]{1,40}$'),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2000),
  app_version text not null default '' check (char_length(app_version) <= 20)
);
create index app_events_name_time_idx on public.app_events (name, created_at desc);
create index app_events_anon_idx on public.app_events (anon_id, created_at);
alter table public.app_events enable row level security;

create policy "app_events_insert" on public.app_events
  for insert to anon, authenticated with check (anon_id is not null);
