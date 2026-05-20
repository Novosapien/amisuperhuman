-- Migration: initial_schema
-- Project: amisuperhuman (Supabase ID: ulmkluljrtjqmfnsrcvd)
-- Applied: 2026-05-17

CREATE TABLE profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_url     TEXT,
  raw_text         TEXT NOT NULL,
  role_category    TEXT,
  seniority_level  TEXT,
  industry         TEXT,
  skills_json      JSONB    DEFAULT '[]',
  submitted_name   TEXT,
  submitted_email  TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scores (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  automation_risk_score        SMALLINT CHECK (automation_risk_score  BETWEEN 0 AND 20),
  superhuman_readiness_score   SMALLINT CHECK (superhuman_readiness_score BETWEEN 0 AND 100),
  top_recommended_tools_json   JSONB    DEFAULT '[]',
  action_plan_text             TEXT,
  full_analysis_json           JSONB,
  created_at                   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE monthly_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month         DATE NOT NULL,
  role_category        TEXT,
  avg_risk_score       NUMERIC(5,2),
  avg_readiness_score  NUMERIC(5,2),
  top_tools_json       JSONB DEFAULT '[]',
  key_insight_text     TEXT,
  total_profiles       INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
