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
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'issued')),
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
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'issued')),
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

-- Public company logos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "own logo files" ON storage.objects;
CREATE POLICY "own logo files"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procedures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rams_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.templates TO authenticated;

-- ============================================================
-- Layer 2: Organisations, signatures, audit trail, versioning.
-- ============================================================

CREATE TABLE IF NOT EXISTS organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  invited_email  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','pending')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS org_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organisations(id) ON DELETE CASCADE NOT NULL,
  invited_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  token        TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE rams_documents
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES rams_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS org_members_org_id_idx ON org_members(org_id);
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON org_members(user_id);
CREATE INDEX IF NOT EXISTS org_invites_token_idx ON org_invites(token);
CREATE INDEX IF NOT EXISTS rams_documents_org_id_created_at_idx ON rams_documents(org_id, created_at);
CREATE INDEX IF NOT EXISTS procedures_org_id_created_at_idx ON procedures(org_id, created_at);
CREATE INDEX IF NOT EXISTS templates_org_id_idx ON templates(org_id);
CREATE INDEX IF NOT EXISTS company_profiles_org_id_idx ON company_profiles(org_id);

CREATE TABLE IF NOT EXISTS signatures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID REFERENCES rams_documents(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role         TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  signed_at    TIMESTAMPTZ DEFAULT NOW(),
  ip_address   TEXT,
  user_agent   TEXT,
  UNIQUE (document_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID REFERENCES rams_documents(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  detail       JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_diffs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID REFERENCES rams_documents(id) ON DELETE CASCADE,
  previous_id  UUID REFERENCES rams_documents(id) ON DELETE SET NULL,
  field        TEXT NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  changed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS signatures_document_id_idx ON signatures(document_id);
CREATE INDEX IF NOT EXISTS audit_log_document_id_created_at_idx ON audit_log(document_id, created_at);
CREATE INDEX IF NOT EXISTS document_diffs_document_id_idx ON document_diffs(document_id);

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_diffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orgs visible to members" ON organisations;
CREATE POLICY "orgs visible to members"
  ON organisations FOR SELECT
  USING (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = id AND m.user_id = auth.uid() AND m.status = 'active'));

DROP POLICY IF EXISTS "org creators can insert" ON organisations;
CREATE POLICY "org creators can insert"
  ON organisations FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "org owners admins can update" ON organisations;
CREATE POLICY "org owners admins can update"
  ON organisations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "members see same org" ON org_members;
CREATE POLICY "members see same org"
  ON org_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.status = 'active'));

DROP POLICY IF EXISTS "owners admins manage members" ON org_members;
CREATE POLICY "owners admins manage members"
  ON org_members FOR ALL
  USING (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = org_members.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "invites visible to org admins" ON org_invites;
CREATE POLICY "invites visible to org admins"
  ON org_invites FOR ALL
  USING (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = org_invites.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = org_invites.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

-- Replace broad owner-only policies with org-aware policies.
DROP POLICY IF EXISTS "own profile" ON company_profiles;
DROP POLICY IF EXISTS "profiles read own or org" ON company_profiles;
CREATE POLICY "profiles read own or org"
  ON company_profiles FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = company_profiles.org_id AND m.user_id = auth.uid() AND m.status = 'active'));
DROP POLICY IF EXISTS "profiles write own or org admin" ON company_profiles;
CREATE POLICY "profiles write own or org admin"
  ON company_profiles FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = company_profiles.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = company_profiles.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "own procedures" ON procedures;
DROP POLICY IF EXISTS "procedures read own or org" ON procedures;
CREATE POLICY "procedures read own or org"
  ON procedures FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = procedures.org_id AND m.user_id = auth.uid() AND m.status = 'active'));
DROP POLICY IF EXISTS "procedures write own or org admin" ON procedures;
CREATE POLICY "procedures write own or org admin"
  ON procedures FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = procedures.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = procedures.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "own documents" ON rams_documents;
DROP POLICY IF EXISTS "documents read own or org" ON rams_documents;
CREATE POLICY "documents read own or org"
  ON rams_documents FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = rams_documents.org_id AND m.user_id = auth.uid() AND m.status = 'active'));
DROP POLICY IF EXISTS "documents write own or org admin" ON rams_documents;
CREATE POLICY "documents write own or org admin"
  ON rams_documents FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = rams_documents.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = rams_documents.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "own templates" ON templates;
DROP POLICY IF EXISTS "templates read own or org" ON templates;
CREATE POLICY "templates read own or org"
  ON templates FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = templates.org_id AND m.user_id = auth.uid() AND m.status = 'active'));
DROP POLICY IF EXISTS "templates write own or org admin" ON templates;
CREATE POLICY "templates write own or org admin"
  ON templates FOR ALL
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = templates.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = templates.org_id AND m.user_id = auth.uid() AND m.status = 'active' AND m.role IN ('owner','admin')));

DROP POLICY IF EXISTS "signatures read same org" ON signatures;
CREATE POLICY "signatures read same org"
  ON signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rams_documents d
    LEFT JOIN org_members m ON m.org_id = d.org_id AND m.user_id = auth.uid() AND m.status = 'active'
    WHERE d.id = signatures.document_id AND (d.user_id = auth.uid() OR m.id IS NOT NULL)
  ));
DROP POLICY IF EXISTS "signatures insert own" ON signatures;
CREATE POLICY "signatures insert own"
  ON signatures FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "audit read same org" ON audit_log;
CREATE POLICY "audit read same org"
  ON audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rams_documents d
    LEFT JOIN org_members m ON m.org_id = d.org_id AND m.user_id = auth.uid() AND m.status = 'active'
    WHERE d.id = audit_log.document_id AND (d.user_id = auth.uid() OR m.id IS NOT NULL)
  ));
DROP POLICY IF EXISTS "audit insert own" ON audit_log;
CREATE POLICY "audit insert own"
  ON audit_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "diffs read same org" ON document_diffs;
CREATE POLICY "diffs read same org"
  ON document_diffs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rams_documents d
    LEFT JOIN org_members m ON m.org_id = d.org_id AND m.user_id = auth.uid() AND m.status = 'active'
    WHERE d.id = document_diffs.document_id AND (d.user_id = auth.uid() OR m.id IS NOT NULL)
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.organisations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.org_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.org_invites TO authenticated;
GRANT SELECT, INSERT ON TABLE public.signatures TO authenticated;
GRANT SELECT, INSERT ON TABLE public.audit_log TO authenticated;
GRANT SELECT, INSERT ON TABLE public.document_diffs TO authenticated;
