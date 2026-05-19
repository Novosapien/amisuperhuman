-- Migration: v2_algorithm_schema
-- Project: amisuperhuman (Supabase ID: ulmkluljrtjqmfnsrcvd)
-- Purpose: Upgrade scores table for 6-dimension algorithm + add role reference tables
-- Applied: 2026-05-19

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Update scores table — add D1-D6 per-dimension columns
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS d1_task_composition      SMALLINT CHECK (d1_task_composition      BETWEEN 0 AND 25),
  ADD COLUMN IF NOT EXISTS d2_ai_signal_strength     SMALLINT CHECK (d2_ai_signal_strength     BETWEEN 0 AND 30), -- 25 + 5 agentic bonus
  ADD COLUMN IF NOT EXISTS d3_skill_transferability  SMALLINT CHECK (d3_skill_transferability  BETWEEN 0 AND 20),
  ADD COLUMN IF NOT EXISTS d4_seniority_leverage     SMALLINT CHECK (d4_seniority_leverage     BETWEEN 0 AND 15),
  ADD COLUMN IF NOT EXISTS d5_industry_velocity      SMALLINT CHECK (d5_industry_velocity      BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS d6_career_momentum        SMALLINT CHECK (d6_career_momentum        BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS agentic_bonus_applied     BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS score_band                TEXT     CHECK (score_band IN ('Foundation','Emerging','Advancing','Superhuman'));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. role_archetypes — pre-seeded baseline scores for common role titles
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_archetypes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title       TEXT NOT NULL UNIQUE,
  function_category     TEXT NOT NULL,   -- Engineering, Sales, Marketing, Finance, HR, Ops, Design, Executive, Legal, CS
  seniority_tier        SMALLINT NOT NULL CHECK (seniority_tier BETWEEN 1 AND 6),  -- 1=Junior, 6=C-Suite
  -- Baseline scores (prior — blended 40% archetype + 60% individual signal)
  baseline_d1           SMALLINT NOT NULL DEFAULT 12 CHECK (baseline_d1 BETWEEN 0 AND 25),
  baseline_d5           SMALLINT NOT NULL DEFAULT 7  CHECK (baseline_d5 BETWEEN 0 AND 10),
  -- Task tier allocation (%)
  pct_tier_a            SMALLINT DEFAULT 30,  -- Mundane
  pct_tier_b            SMALLINT DEFAULT 40,  -- Analytical
  pct_tier_c            SMALLINT DEFAULT 20,  -- Relational
  pct_tier_d            SMALLINT DEFAULT 10,  -- Strategic
  -- Typical AI tools for this role
  typical_ai_tools      JSONB DEFAULT '[]',
  -- Running stats from submissions
  observed_avg_score    NUMERIC(5,2),
  submission_count      INTEGER DEFAULT 0,
  -- Metadata
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Seed core archetypes (function × seniority)
INSERT INTO role_archetypes (canonical_title, function_category, seniority_tier, baseline_d1, baseline_d5, pct_tier_a, pct_tier_b, pct_tier_c, pct_tier_d, typical_ai_tools) VALUES
-- ── Engineering ──────────────────────────────────────────────────────────────
('Junior Software Engineer',       'Engineering', 1, 10, 10, 30, 50, 10, 10, '["Claude Code","Cursor","GitHub Copilot"]'),
('Software Engineer',              'Engineering', 2, 12, 10, 20, 55, 15, 10, '["Claude Code","Cursor","GitHub Copilot"]'),
('Senior Software Engineer',       'Engineering', 3, 14, 10, 15, 50, 20, 15, '["Claude Code","Cursor","Windsurf"]'),
('Staff Software Engineer',        'Engineering', 4, 16, 10, 10, 40, 25, 25, '["Claude Code","Cursor","Devin"]'),
('Engineering Manager',            'Engineering', 4, 14, 10, 20, 35, 30, 15, '["Claude Code","Granola","Linear"]'),
('VP Engineering',                 'Engineering', 5, 16, 10, 10, 30, 35, 25, '["Claude Cowork","Granola","Linear"]'),
('CTO',                            'Engineering', 6, 18, 10,  5, 20, 35, 40, '["Claude Cowork","Claude Code","Granola"]'),
-- ── Sales ─────────────────────────────────────────────────────────────────────
('Sales Development Representative','Sales',       1,  8,  9, 50, 30, 15,  5, '["Claude Cowork","Apollo.io","Instantly"]'),
('Account Executive',              'Sales',        2, 11,  9, 35, 30, 25, 10, '["Claude Cowork","Fireflies.ai","Attio"]'),
('Senior Account Executive',       'Sales',        3, 13,  9, 25, 25, 35, 15, '["Claude Cowork","Fireflies.ai","Clay"]'),
('Sales Manager',                  'Sales',        4, 13,  9, 20, 25, 35, 20, '["Claude Cowork","Fireflies.ai","Attio"]'),
('Head of Sales',                  'Sales',        5, 15,  9, 15, 20, 35, 30, '["Claude Cowork","Granola","Attio"]'),
('VP Sales',                       'Sales',        5, 16,  9, 10, 20, 35, 35, '["Claude Cowork","Granola","Perplexity AI"]'),
('Chief Revenue Officer',          'Sales',        6, 18,  9,  5, 15, 35, 45, '["Claude Cowork","Granola","Perplexity AI"]'),
-- ── Marketing ─────────────────────────────────────────────────────────────────
('Marketing Coordinator',          'Marketing',    1,  9,  9, 45, 30, 15, 10, '["Claude Cowork","Canva AI","NovaSapien Content WorkForce"]'),
('Marketing Manager',              'Marketing',    3, 12,  9, 25, 35, 25, 15, '["Claude Cowork","NovaSapien Content WorkForce","Klaviyo AI"]'),
('Content Marketing Manager',      'Marketing',    3, 11,  9, 30, 40, 15, 15, '["Claude Cowork","NovaSapien Content WorkForce","Perplexity AI"]'),
('Head of Marketing',              'Marketing',    5, 14,  9, 15, 30, 30, 25, '["Claude Cowork","NovaSapien Content WorkForce","Perplexity AI"]'),
('CMO',                            'Marketing',    6, 17,  9,  5, 20, 35, 40, '["Claude Cowork","NovaSapien Content WorkForce","Perplexity AI"]'),
-- ── Finance ──────────────────────────────────────────────────────────────────
('Financial Analyst',              'Finance',      2,  9,  8, 40, 45, 10,  5, '["Claude Cowork","ThoughtSpot","Vena"]'),
('Finance Manager',                'Finance',      3, 11,  8, 30, 45, 15, 10, '["Claude Cowork","Vena","Pigment"]'),
('Senior Finance Manager',         'Finance',      4, 13,  8, 20, 40, 20, 20, '["Claude Cowork","Pigment","ThoughtSpot"]'),
('Head of Finance',                'Finance',      5, 15,  8, 15, 35, 25, 25, '["Claude Cowork","Pigment","Notion AI"]'),
('CFO',                            'Finance',      6, 17,  8,  5, 25, 35, 35, '["Claude Cowork","Pigment","Perplexity AI"]'),
-- ── HR / People Ops ────────────────────────────────────────────────────────────
('HR Coordinator',                 'HR',           1,  8,  7, 50, 25, 20,  5, '["Claude Cowork","Paradox","Leapsome"]'),
('HR Business Partner',            'HR',           3, 11,  7, 25, 30, 35, 10, '["Claude Cowork","Lattice","Leapsome"]'),
('Head of People',                 'HR',           5, 14,  7, 15, 25, 40, 20, '["Claude Cowork","Lattice","Eightfold AI"]'),
('Chief People Officer',           'HR',           6, 16,  7,  5, 20, 45, 30, '["Claude Cowork","Eightfold AI","Lattice"]'),
-- ── Operations ──────────────────────────────────────────────────────────────────
('Operations Manager',             'Operations',   3, 11,  7, 35, 35, 20, 10, '["Claude Cowork","Asana AI","Notion AI"]'),
('Head of Operations',             'Operations',   5, 14,  7, 20, 30, 25, 25, '["Claude Cowork","Notion AI","Loom AI"]'),
('COO',                            'Operations',   6, 17,  7,  5, 25, 35, 35, '["Claude Cowork","Granola","Notion AI"]'),
-- ── Design ──────────────────────────────────────────────────────────────────────
('UI Designer',                    'Design',       2, 10,  9, 30, 40, 15, 15, '["Claude Cowork","Figma AI","Canva AI"]'),
('UX Designer',                    'Design',       2, 11,  9, 20, 45, 20, 15, '["Claude Cowork","Figma AI","Nano Banana Pro 2 by Google"]'),
('Senior UX Designer',             'Design',       3, 13,  9, 15, 40, 25, 20, '["Claude Cowork","Figma AI","Veo 2"]'),
('Design Lead',                    'Design',       4, 15,  9, 10, 30, 30, 30, '["Claude Cowork","Figma AI","Nano Banana Pro 2 by Google"]'),
('Head of Design',                 'Design',       5, 16,  9,  5, 25, 35, 35, '["Claude Cowork","Figma AI","Notion AI"]'),
-- ── Executive ──────────────────────────────────────────────────────────────────
('CEO',                            'Executive',    6, 18,  8,  5, 20, 35, 40, '["Claude Cowork","Perplexity AI","Granola"]'),
('Founder',                        'Executive',    6, 17,  8,  5, 25, 30, 40, '["Claude Cowork","Claude Code","Notion AI"]'),
('Managing Director',              'Executive',    6, 16,  7, 10, 25, 35, 30, '["Claude Cowork","Granola","Perplexity AI"]'),
-- ── Legal ──────────────────────────────────────────────────────────────────────
('Legal Counsel',                  'Legal',        3, 12,  7, 25, 45, 20, 10, '["Claude Cowork","Notion AI","Perplexity AI"]'),
('Senior Legal Counsel',           'Legal',        4, 13,  7, 15, 45, 25, 15, '["Claude Cowork","Notion AI","Perplexity AI"]'),
('General Counsel',                'Legal',        6, 15,  7,  5, 35, 35, 25, '["Claude Cowork","Notion AI","Granola"]'),
-- ── Customer Success ───────────────────────────────────────────────────────────
('Customer Success Manager',       'Customer Success', 2, 10, 7, 30, 30, 35,  5, '["Claude Cowork","Fireflies.ai","Granola"]'),
('Senior CSM',                     'Customer Success', 3, 12, 7, 20, 30, 40, 10, '["Claude Cowork","Fireflies.ai","Attio"]'),
('Head of Customer Success',       'Customer Success', 5, 14, 7, 10, 25, 45, 20, '["Claude Cowork","Granola","Attio"]'),
-- ── Product Management ──────────────────────────────────────────────────────────
('Product Manager',                'Product',      3, 13,  9, 20, 40, 25, 15, '["Claude Cowork","Notion AI","Granola"]'),
('Senior Product Manager',         'Product',      4, 15,  9, 15, 35, 25, 25, '["Claude Cowork","Notion AI","Perplexity AI"]'),
('Head of Product',                'Product',      5, 16,  9, 10, 30, 30, 30, '["Claude Cowork","Notion AI","Granola"]'),
('VP Product',                     'Product',      5, 17,  9,  5, 25, 35, 35, '["Claude Cowork","Notion AI","Perplexity AI"]')
ON CONFLICT (canonical_title) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. role_title_aliases — maps raw submitted titles to canonical archetypes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS role_title_aliases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_title             TEXT NOT NULL,
  canonical_archetype_id UUID REFERENCES role_archetypes(id),
  match_confidence      NUMERIC(3,2) DEFAULT 1.0 CHECK (match_confidence BETWEEN 0 AND 1),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_title_aliases_raw ON role_title_aliases(LOWER(raw_title));

-- ────────────────────────────────────────────────────────────────────────────
-- 4. skill_ai_impact — maps skills to displacement risk and augmentation potential
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_ai_impact (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name                TEXT NOT NULL UNIQUE,
  ai_exposure_level         TEXT NOT NULL CHECK (ai_exposure_level IN ('Very High','High','Medium','Low','Very Low')),
  ai_augmentation_potential TEXT NOT NULL CHECK (ai_augmentation_potential IN ('Very High','High','Medium','Low')),
  displacement_risk         TEXT NOT NULL CHECK (displacement_risk IN ('Very High','High','Medium','Low','Protected')),
  replacement_skill         TEXT,  -- The skill that protects or replaces this one
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Seed core skills
INSERT INTO skill_ai_impact (skill_name, ai_exposure_level, ai_augmentation_potential, displacement_risk, replacement_skill) VALUES
('Data Entry',               'Very High', 'Very High', 'Very High', 'AI workflow design'),
('Report Writing',           'Very High', 'Very High', 'High',      'Data interpretation'),
('Spreadsheet Analysis',     'High',      'Very High', 'High',      'AI-powered BI prompting'),
('Cold Email Outreach',      'Very High', 'Very High', 'High',      'AI sequence management'),
('CRM Data Management',      'Very High', 'High',      'High',      'AI-native CRM operation'),
('Content Writing',          'Very High', 'Very High', 'High',      'AI content direction'),
('Social Media Management',  'Very High', 'Very High', 'High',      'AI content strategy'),
('Meeting Note-Taking',      'Very High', 'Very High', 'Very High', 'Meeting intelligence tools'),
('Code Review',              'High',      'Very High', 'Medium',    'AI-assisted architecture'),
('UX Research',              'Medium',    'High',      'Low',       'AI synthesis + human empathy'),
('Strategic Planning',       'Low',       'Medium',    'Low',       'Protected - judgment required'),
('Team Leadership',          'Very Low',  'Low',       'Protected', 'Protected - human relationship'),
('Client Relationship Mgmt', 'Very Low',  'Low',       'Protected', 'Protected - trust and empathy'),
('System Architecture',      'Medium',    'High',      'Low',       'AI-augmented design'),
('Product Strategy',         'Low',       'Medium',    'Low',       'Protected - vision and judgment'),
('Financial Modelling',      'High',      'Very High', 'High',      'AI-powered scenario analysis'),
('Legal Research',           'High',      'Very High', 'Medium',    'AI-augmented legal analysis'),
('Recruitment Screening',    'Very High', 'Very High', 'Very High', 'AI talent intelligence tools'),
('Performance Management',   'Medium',    'Medium',    'Low',       'Protected - coaching judgment'),
('Market Research',          'High',      'Very High', 'High',      'Perplexity AI + AI synthesis')
ON CONFLICT (skill_name) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Indexes for analytics performance
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_scores_score_band ON scores(score_band);
CREATE INDEX IF NOT EXISTS idx_scores_d1 ON scores(d1_task_composition);
CREATE INDEX IF NOT EXISTS idx_scores_d2 ON scores(d2_ai_signal_strength);
CREATE INDEX IF NOT EXISTS idx_scores_agentic ON scores(agentic_bonus_applied);
CREATE INDEX IF NOT EXISTS idx_profiles_submitted_at ON profiles(submitted_at);
CREATE INDEX IF NOT EXISTS idx_archetypes_function ON role_archetypes(function_category);
