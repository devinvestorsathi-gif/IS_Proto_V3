-- ============================================================
-- INVESTOR SATHI CRM — FULL DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('sales_rep', 'team_lead', 'admin');

CREATE TYPE lead_source AS ENUM (
  'referral', 'social_media', 'website', 'cold_call', 'event', 'other'
);

CREATE TYPE lead_stage AS ENUM (
  'new_lead', 'contacted', 'interested', 'meeting_scheduled',
  'site_visit', 'negotiation', 'converted', 'lost'
);

CREATE TYPE lost_reason AS ENUM (
  'price_issue', 'trust_issue', 'not_interested', 'timing_issue',
  'competitor_chosen', 'no_response', 'other'
);

CREATE TYPE interest_level AS ENUM ('high', 'medium', 'low');

CREATE TYPE sentiment AS ENUM ('positive', 'neutral', 'negative');

CREATE TYPE objection_category AS ENUM (
  'trust', 'price', 'timing', 'competition', 'other'
);

CREATE TYPE interaction_type AS ENUM (
  'call', 'whatsapp', 'meeting', 'email', 'other'
);

CREATE TYPE interaction_outcome AS ENUM (
  'answered', 'no_answer', 'busy', 'callback_requested', 'meeting_set'
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue');

CREATE TYPE document_type AS ENUM ('kyc', 'payments', 'receipts', 'legal');

-- ============================================================
-- TABLE 1: profiles
-- Extends Supabase auth.users (auto-created on signup)
-- ============================================================

CREATE TABLE profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,
  role                  user_role NOT NULL DEFAULT 'sales_rep',
  team_id               UUID,  -- FK added after teams table
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: teams
-- Groups of sales reps under a team lead
-- ============================================================

CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  team_lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from profiles to teams (now that teams table exists)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_team
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================
-- TABLE 3: leads
-- Core CRM records
-- ============================================================

CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id               UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Basic Info
  full_name             TEXT NOT NULL,
  phone                 TEXT NOT NULL,
  email                 TEXT,
  city                  TEXT,
  source                lead_source NOT NULL DEFAULT 'other',

  -- Pipeline
  stage                 lead_stage NOT NULL DEFAULT 'new_lead',
  stage_updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_lost               BOOLEAN NOT NULL DEFAULT FALSE,
  lost_at_stage         TEXT,
  lost_reason           lost_reason,
  lost_reason_detail    TEXT,

  -- Scoring
  lead_score            INTEGER CHECK (lead_score >= 1 AND lead_score <= 10),
  interest_level        interest_level,
  sentiment             sentiment,
  objection_category    objection_category,

  -- Tracking
  next_step             TEXT,
  follow_up_date        DATE,
  last_contacted_at     TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_team_id ON leads(team_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_is_lost ON leads(is_lost);

-- ============================================================
-- TABLE 4: lead_stage_history
-- Full audit trail of every stage change
-- ============================================================

CREATE TABLE lead_stage_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage  TEXT NOT NULL,
  to_stage    TEXT NOT NULL,
  changed_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes       TEXT
);

CREATE INDEX idx_stage_history_lead_id ON lead_stage_history(lead_id);

-- ============================================================
-- TABLE 5: interactions
-- All outreach logs per lead
-- ============================================================

CREATE TABLE interactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  logged_by           UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  logged_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type                interaction_type NOT NULL,
  outcome             interaction_outcome,
  notes               TEXT,
  duration_minutes    INTEGER,
  follow_up_required  BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date      DATE
);

CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_logged_by ON interactions(logged_by);

-- ============================================================
-- TABLE 6: lead_notes
-- Structured sales notes per lead (one record per lead, upserted)
-- ============================================================

CREATE TABLE lead_notes (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                   UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  updated_by                UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  call_summary              TEXT,
  interest_level            interest_level,
  sentiment                 sentiment,
  buying_stage_self_reported TEXT,
  lead_score                INTEGER CHECK (lead_score >= 1 AND lead_score <= 10),
  objection_category        objection_category,
  objection_detail          TEXT,
  next_step                 TEXT,
  follow_up_date            DATE
);

CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);

-- ============================================================
-- TABLE 7: onboarding_tokens
-- Short tokens for compact magic link URLs
-- ============================================================

CREATE TABLE onboarding_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       TEXT NOT NULL UNIQUE,         -- 8-char alphanumeric
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMPTZ
);

CREATE INDEX idx_onboarding_tokens_token ON onboarding_tokens(token);
CREATE INDEX idx_onboarding_tokens_lead_id ON onboarding_tokens(lead_id);

-- ============================================================
-- TABLE 8: client_profiles
-- Extended data collected via onboarding form
-- ============================================================

CREATE TABLE client_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id             UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- for admin overrides

  -- Personal Details
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT NOT NULL,
  date_of_birth       DATE,
  age_range           TEXT,
  occupation          TEXT,
  city                TEXT,
  state               TEXT,

  -- KYC
  pan_number          TEXT,
  aadhaar_number      TEXT,
  pan_doc_path        TEXT,   -- Supabase Storage path
  aadhaar_doc_path    TEXT,   -- Supabase Storage path

  -- Investment Details
  investment_budget   TEXT,
  heard_about_us      TEXT,
  project_interest    TEXT,
  plot_unit_details   TEXT,

  -- Source & Feedback
  lead_source_confirmed TEXT,
  why_chose_us        TEXT
);

CREATE INDEX idx_client_profiles_lead_id ON client_profiles(lead_id);

-- ============================================================
-- TABLE 9: documents
-- Metadata for all stored files
-- ============================================================

CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  document_type     document_type NOT NULL,
  file_path         TEXT NOT NULL,   -- Supabase Storage path
  file_name         TEXT NOT NULL,
  uploaded_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_admin_override BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_documents_client_id ON documents(client_id);

-- ============================================================
-- TABLE 10: payment_milestones
-- Payment tracking per client
-- ============================================================

CREATE TABLE payment_milestones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  milestone_name    TEXT NOT NULL,
  amount            NUMERIC(12, 2) NOT NULL,
  due_date          DATE NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  paid_at           TIMESTAMPTZ,
  payment_proof_url TEXT,
  receipt_id        TEXT UNIQUE,    -- IS-YYYY-XXXXXX
  receipt_url       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_milestones_client_id ON payment_milestones(client_id);
CREATE INDEX idx_payment_milestones_status ON payment_milestones(status);
CREATE INDEX idx_payment_milestones_due_date ON payment_milestones(due_date);

-- ============================================================
-- TABLE 11: notifications
-- In-app notification log
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',  -- 'info', 'success', 'warning', 'error'
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,   -- optional deep link in the app
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================
-- TRIGGER: auto-update updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_payment_milestones_updated_at
  BEFORE UPDATE ON payment_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile when a user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales_rep')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: get current user's role
-- (used in RLS policies — avoids repeated subqueries)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

-- Anyone can read their own profile
CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Admin can read all profiles
CREATE POLICY "profiles: admin read all"
  ON profiles FOR SELECT
  USING (get_user_role() = 'admin');

-- Team lead can read profiles of their team members
CREATE POLICY "profiles: team_lead read team"
  ON profiles FOR SELECT
  USING (
    get_user_role() = 'team_lead'
    AND team_id = get_user_team_id()
  );

-- Only admin can insert/update/delete profiles
CREATE POLICY "profiles: admin write"
  ON profiles FOR ALL
  USING (get_user_role() = 'admin');

-- Users can update their own profile (limited fields via app logic)
CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- RLS POLICIES: teams
-- ============================================================

CREATE POLICY "teams: admin full access"
  ON teams FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "teams: team_lead read own team"
  ON teams FOR SELECT
  USING (
    get_user_role() = 'team_lead'
    AND team_lead_id = auth.uid()
  );

CREATE POLICY "teams: sales_rep read own team"
  ON teams FOR SELECT
  USING (
    get_user_role() = 'sales_rep'
    AND id = get_user_team_id()
  );

-- ============================================================
-- RLS POLICIES: leads
-- ============================================================

-- Sales rep sees only their assigned leads
CREATE POLICY "leads: sales_rep read own"
  ON leads FOR SELECT
  USING (
    get_user_role() = 'sales_rep'
    AND assigned_to = auth.uid()
  );

-- Team lead sees all leads in their team
CREATE POLICY "leads: team_lead read team"
  ON leads FOR SELECT
  USING (
    get_user_role() = 'team_lead'
    AND team_id = get_user_team_id()
  );

-- Admin sees everything
CREATE POLICY "leads: admin full access"
  ON leads FOR ALL
  USING (get_user_role() = 'admin');

-- Sales rep can create leads (assigned to themselves)
CREATE POLICY "leads: sales_rep create"
  ON leads FOR INSERT
  WITH CHECK (
    get_user_role() IN ('sales_rep', 'team_lead')
    AND assigned_to = auth.uid()
  );

-- Sales rep can update their own leads
CREATE POLICY "leads: sales_rep update own"
  ON leads FOR UPDATE
  USING (
    get_user_role() = 'sales_rep'
    AND assigned_to = auth.uid()
  );

-- Team lead can update leads in their team
CREATE POLICY "leads: team_lead update team"
  ON leads FOR UPDATE
  USING (
    get_user_role() = 'team_lead'
    AND team_id = get_user_team_id()
  );

-- ============================================================
-- RLS POLICIES: lead_stage_history
-- ============================================================

CREATE POLICY "stage_history: read if can read lead"
  ON lead_stage_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "stage_history: insert if can update lead"
  ON lead_stage_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- ============================================================
-- RLS POLICIES: interactions
-- ============================================================

CREATE POLICY "interactions: read if can read lead"
  ON interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "interactions: insert if can update lead"
  ON interactions FOR INSERT
  WITH CHECK (
    logged_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- ============================================================
-- RLS POLICIES: lead_notes
-- ============================================================

CREATE POLICY "lead_notes: read if can read lead"
  ON lead_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "lead_notes: write if can update lead"
  ON lead_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- ============================================================
-- RLS POLICIES: onboarding_tokens
-- ============================================================

-- Sales reps can create tokens for their own leads
CREATE POLICY "tokens: create for own lead"
  ON onboarding_tokens FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- Read own created tokens
CREATE POLICY "tokens: read own"
  ON onboarding_tokens FOR SELECT
  USING (
    created_by = auth.uid()
    OR get_user_role() = 'admin'
    OR (get_user_role() = 'team_lead' AND EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND l.team_id = get_user_team_id()
    ))
  );

-- Public read for token validation (needed for client-facing page)
-- We handle this via a service role API route instead of direct RLS

-- ============================================================
-- RLS POLICIES: client_profiles
-- ============================================================

CREATE POLICY "client_profiles: read if can read lead"
  ON client_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l WHERE l.id = lead_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- Admin and team lead can update (for KYC override)
CREATE POLICY "client_profiles: admin or tl update"
  ON client_profiles FOR UPDATE
  USING (get_user_role() IN ('admin', 'team_lead'));

-- Insert via service role only (from API route)
CREATE POLICY "client_profiles: service insert"
  ON client_profiles FOR INSERT
  WITH CHECK (TRUE);  -- controlled at API level

-- ============================================================
-- RLS POLICIES: documents
-- ============================================================

CREATE POLICY "documents: read if can read client"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles cp
      JOIN leads l ON l.id = cp.lead_id
      WHERE cp.id = client_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "documents: admin full"
  ON documents FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "documents: insert own clients"
  ON documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM client_profiles cp
      JOIN leads l ON l.id = cp.lead_id
      WHERE cp.id = client_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

-- ============================================================
-- RLS POLICIES: payment_milestones
-- ============================================================

CREATE POLICY "payments: read if can read client"
  ON payment_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles cp
      JOIN leads l ON l.id = cp.lead_id
      WHERE cp.id = client_id
      AND (
        l.assigned_to = auth.uid()
        OR (get_user_role() = 'team_lead' AND l.team_id = get_user_team_id())
        OR get_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "payments: admin or tl write"
  ON payment_milestones FOR ALL
  USING (get_user_role() IN ('admin', 'team_lead'));

CREATE POLICY "payments: sales_rep read own"
  ON payment_milestones FOR SELECT
  USING (
    get_user_role() = 'sales_rep'
    AND EXISTS (
      SELECT 1 FROM client_profiles cp
      JOIN leads l ON l.id = cp.lead_id
      WHERE cp.id = client_id AND l.assigned_to = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: notifications
-- ============================================================

-- Users only see their own notifications
CREATE POLICY "notifications: read own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: update own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System inserts (via service role API routes)
CREATE POLICY "notifications: service insert"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);