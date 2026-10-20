-- Kayıt geçmişi: bir kayıt üzerine yazılırsa eski hâli kurtarılabilir.
-- Eski durum, (a) ilerleme (life) düşüyorsa ya da (b) son geçmiş kaydından 6 saat geçtiyse saklanır.
create table public.saves_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  state jsonb not null,
  life numeric,
  saved_at timestamptz not null default now(),
  constraint saves_history_state_size check (pg_column_size(state) < 200000)
);
create index saves_history_user_idx on public.saves_history (user_id, saved_at desc);
alter table public.saves_history enable row level security;
create policy "saves_history_select_own" on public.saves_history
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.saves_keep_history() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  old_life numeric := coalesce((old.state ->> 'life')::numeric, 0);
  new_life numeric := coalesce((new.state ->> 'life')::numeric, 0);
  last_at timestamptz;
begin
  select max(saved_at) into last_at from public.saves_history where user_id = old.user_id;
  if new_life < old_life or last_at is null or last_at < now() - interval '6 hours' then
    insert into public.saves_history (user_id, state, life) values (old.user_id, old.state, old_life);
    -- kullanıcı başına son 20 kaydı tut
    delete from public.saves_history h where h.user_id = old.user_id and h.id not in (
      select id from public.saves_history where user_id = old.user_id order by saved_at desc limit 20);
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger saves_keep_history_trg before update on public.saves
  for each row execute function public.saves_keep_history();
