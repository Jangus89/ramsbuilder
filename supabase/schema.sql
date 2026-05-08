-- ============================================================
-- SafeFlow RAMS Builder - Supabase Schema
-- Safe to rerun in Supabase SQL Editor.
-- ============================================================

-- UUID generation for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  tagged_fields INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Additive migrations for existing installs.
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS char_count INTEGER,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rams_documents
  ADD COLUMN IF NOT EXISTS task_type TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS ref_number TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tagged_fields INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Helpful indexes. CREATE INDEX IF NOT EXISTS is rerunnable.
CREATE INDEX IF NOT EXISTS procedures_user_id_created_at_idx
  ON procedures (user_id, created_at);

CREATE INDEX IF NOT EXISTS rams_documents_user_id_created_at_idx
  ON rams_documents (user_id, created_at);

CREATE INDEX IF NOT EXISTS templates_user_id_is_active_idx
  ON templates (user_id, is_active);

-- Enable Row Level Security.
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rams_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own rows.
-- DROP first so this script can be rerun after policy edits.
DROP POLICY IF EXISTS "own profile" ON company_profiles;
CREATE POLICY "own profile"
  ON company_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own procedures" ON procedures;
CREATE POLICY "own procedures"
  ON procedures
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own documents" ON rams_documents;
CREATE POLICY "own documents"
  ON rams_documents
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own templates" ON templates;
CREATE POLICY "own templates"
  ON templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket
-- Creates/updates a private bucket named "templates".
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

DROP POLICY IF EXISTS "own template files" ON storage.objects;
CREATE POLICY "own template files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'templates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'templates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
