-- ============================================
-- Damoajo 업데이트 스키마 3
-- ============================================

-- 가격 변동 알림 테이블 (일주일 지나면 자동 삭제)
create table if not exists public.price_alerts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  link_id    uuid references public.links(id) on delete cascade not null,
  link_title text not null,
  old_price  text,
  new_price  text,
  is_read    boolean default false,
  created_at timestamptz default now() not null
);

alter table public.price_alerts enable row level security;

create policy "price_alerts: 본인만 조회" on public.price_alerts
  for select using (auth.uid() = user_id);
create policy "price_alerts: 본인만 추가" on public.price_alerts
  for insert with check (auth.uid() = user_id);
create policy "price_alerts: 본인만 수정" on public.price_alerts
  for update using (auth.uid() = user_id);
create policy "price_alerts: 본인만 삭제" on public.price_alerts
  for delete using (auth.uid() = user_id);

-- 성능 인덱스 추가
create index if not exists links_user_favorite_idx on public.links (user_id, is_favorite) where is_favorite = true;
create index if not exists links_user_status_idx on public.links (user_id, status);
create index if not exists links_user_price_idx on public.links (user_id) where price is not null;
create index if not exists links_user_noprice_idx on public.links (user_id) where price is null;
create index if not exists price_alerts_user_idx on public.price_alerts (user_id, created_at desc);
create index if not exists price_alerts_cleanup_idx on public.price_alerts (created_at);

-- 일주일 지난 알림 자동 삭제 함수 (Supabase pg_cron 또는 앱에서 호출)
create or replace function public.cleanup_old_price_alerts()
returns void language plpgsql as $$
begin
  delete from public.price_alerts
  where created_at < now() - interval '7 days';
end;
$$;
