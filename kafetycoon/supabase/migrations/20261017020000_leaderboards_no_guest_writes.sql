-- Misafir (anonim) hesaplar herkese açık sıralamalara yazamaz. Kendi bulut kaydını (saves) yine saklayabilir.
create policy "leaderboard_no_guest_insert" on public.leaderboard
  as restrictive for insert to authenticated
  with check ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true');
create policy "leaderboard_no_guest_update" on public.leaderboard
  as restrictive for update to authenticated
  using ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true')
  with check ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true');

create policy "season_no_guest_insert" on public.season_scores
  as restrictive for insert to authenticated
  with check ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true');
create policy "season_no_guest_update" on public.season_scores
  as restrictive for update to authenticated
  using ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true')
  with check ((select auth.jwt() ->> 'is_anonymous') is distinct from 'true');
