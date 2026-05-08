-- ============================================================
-- SafeFlow RAMS Builder — Supabase Schema
-- Run this in your Supabase SQL editor (Database > SQL Editor)
-- ============================================================

-- Company profiles (one per user)
CREATE TABLE IF NOT EXISTS company_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data        JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Procedure library
CREATE TABLE IF NOT EXISTS procedures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  code        TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  text        TEXT NOT NULL,
  char_count  INTEGER,
  file_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RAMS document history
CREATE TABLE IF NOT EXISTS rams_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data        JSONB NOT NULL,
  task_type   TEXT,
  location    TEXT,
  ref_number  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE company_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rams_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates         ENABLE ROW LEVEL SECURITY;

-- RLS policies — users can only access their own data
CREATE POLICY "own profile"    ON company_profiles  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own procedures" ON procedures        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own documents"  ON rams_documents    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own templates"  ON templates         FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Storage bucket
-- In Supabase dashboard: Storage > New bucket
--   Name: templates
--   Public: NO (private)
-- Then add this storage policy:
-- ============================================================

-- Storage RLS (run after creating the bucket in the dashboard)
CREATE POLICY "own template files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);
