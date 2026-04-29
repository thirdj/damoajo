-- ============================================
-- Damoajo - Neon DB 스키마
-- Neon 대시보드 → SQL Editor에서 실행하세요
-- ============================================

-- 1. links 테이블
CREATE TABLE IF NOT EXISTS links (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           text NOT NULL,
  url               text NOT NULL,
  title             text NOT NULL,
  description       text,
  thumbnail         text,
  site_name         text,
  favicon           text,
  price             text,
  last_price        text,
  price_updated_at  timestamptz,
  category          text NOT NULL DEFAULT '기타',
  is_favorite       boolean NOT NULL DEFAULT false,
  memo              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);

-- 2. categories 테이블
CREATE TABLE IF NOT EXISTS categories (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    text NOT NULL,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- 3. price_history 테이블
CREATE TABLE IF NOT EXISTS price_history (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id    uuid REFERENCES links(id) ON DELETE CASCADE NOT NULL,
  user_id    text NOT NULL,
  old_price  text,
  new_price  text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 4. price_alerts 테이블
CREATE TABLE IF NOT EXISTS price_alerts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    text NOT NULL,
  link_id    uuid REFERENCES links(id) ON DELETE CASCADE NOT NULL,
  link_title text NOT NULL,
  old_price  text,
  new_price  text,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS links_user_id_idx       ON links (user_id);
CREATE INDEX IF NOT EXISTS links_user_created_idx  ON links (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS links_user_fav_idx      ON links (user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS links_user_price_idx    ON links (user_id) WHERE price IS NOT NULL;
CREATE INDEX IF NOT EXISTS links_user_noprice_idx  ON links (user_id) WHERE price IS NULL;
CREATE INDEX IF NOT EXISTS categories_user_idx     ON categories (user_id);
CREATE INDEX IF NOT EXISTS price_history_link_idx  ON price_history (link_id);
CREATE INDEX IF NOT EXISTS price_alerts_user_idx   ON price_alerts (user_id, created_at DESC);
