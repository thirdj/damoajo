-- ============================================
-- Damoajo - Supabase DB 스키마
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요
-- ============================================

-- 1. links 테이블
create table if not exists public.links (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  url         text not null,
  title       text not null,
  description text,
  thumbnail   text,
  site_name   text,
  favicon     text,
  price       text,
  category    text not null default '기타',
  status      text not null default 'wish' check (status in ('wish', 'bought', 'archived')),
  memo        text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,

  -- 같은 유저가 동일 URL 중복 저장 방지
  unique (user_id, url)
);

-- 2. categories 테이블
create table if not exists public.categories (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  color      text not null default '#3b82f6',
  created_at timestamptz default now() not null,

  unique (user_id, name)
);

-- 3. RLS (Row Level Security) 활성화
alter table public.links     enable row level security;
alter table public.categories enable row level security;

-- 4. links 정책: 본인 데이터만 접근
create policy "links: 본인만 조회" on public.links
  for select using (auth.uid() = user_id);

create policy "links: 본인만 추가" on public.links
  for insert with check (auth.uid() = user_id);

create policy "links: 본인만 수정" on public.links
  for update using (auth.uid() = user_id);

create policy "links: 본인만 삭제" on public.links
  for delete using (auth.uid() = user_id);

-- 5. categories 정책
create policy "categories: 본인만 조회" on public.categories
  for select using (auth.uid() = user_id);

create policy "categories: 본인만 추가" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories: 본인만 삭제" on public.categories
  for delete using (auth.uid() = user_id);

-- 6. updated_at 자동 갱신 함수
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger links_updated_at
  before update on public.links
  for each row execute function public.handle_updated_at();

-- 7. 성능 인덱스
create index if not exists links_user_id_idx      on public.links (user_id);
create index if not exists links_status_idx        on public.links (user_id, status);
create index if not exists links_category_idx      on public.links (user_id, category);
create index if not exists links_created_at_idx    on public.links (created_at desc);
create index if not exists categories_user_id_idx  on public.categories (user_id);
