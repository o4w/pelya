-- Bulut kaydı: her kullanıcı yalnızca kendi satırını görür ve yazar.
create table public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint saves_state_size check (pg_column_size(state) < 200000)
);
alter table public.saves enable row level security;

create policy "saves_select_own" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves_insert_own" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves_update_own" on public.saves
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves_delete_own" on public.saves
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Liderlik tablosu: herkes okur, yalnızca sahibi yazar. E-posta bu tabloda yoktur.
create table public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cafe_name text not null check (char_length(cafe_name) between 1 and 14),
  city text not null check (char_length(city) between 1 and 24),
  net_worth numeric not null check (net_worth >= 0 and net_worth <= 1e15),
  customers integer not null check (customers >= 0),
  level integer not null check (level between 1 and 1000),
  updated_at timestamptz not null default now()
);
create index leaderboard_net_worth_idx on public.leaderboard (net_worth desc);
create index leaderboard_customers_idx on public.leaderboard (customers desc);
alter table public.leaderboard enable row level security;

create policy "leaderboard_select_all" on public.leaderboard
  for select to anon, authenticated using (true);
create policy "leaderboard_insert_own" on public.leaderboard
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "leaderboard_update_own" on public.leaderboard
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "leaderboard_delete_own" on public.leaderboard
  for delete to authenticated using ((select auth.uid()) = user_id);

-- updated_at sunucu saatiyle güncellenir (istemci saatine güvenilmez).
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

create trigger saves_touch before insert or update on public.saves
  for each row execute function public.touch_updated_at();
create trigger leaderboard_touch before insert or update on public.leaderboard
  for each row execute function public.touch_updated_at();
