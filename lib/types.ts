export interface ProfileInput {
  name: string;
  linkedinUrl: string;
  jobTitle: string;
  roleCategory: string;
  seniority: string;
  industry: string;
}

export interface DimensionScore {
  score: number;
  max: number;
  label: string;
  description: string;
}

export interface TaskItem {
  current_text: string;
  current_sub: string;
  superhuman_action: string;
  tools: string[];
  try_this: string;
}

export interface TaskTier {
  metric_value: string;
  metric_label: string;
  tasks: TaskItem[];
}

export interface ActionStep {
  step: number;
  time_frame: string;
  title: string;
  body: string;
  tools: string[];
}

export interface SuperhumanAnalysis {
  detected_name: string;
  detected_role: string;
  detected_industry: string;
  detected_seniority: string;
  overall_score: number;
  score_band: 'Foundation' | 'Emerging' | 'Advancing' | 'Superhuman';
  percentile_label: string;
  verdict: string;
  agentic_bonus_applied: boolean;
  builder_paradox_note: string | null;
  dimensions: {
    task_composition:     DimensionScore;  // D1 — max 25
    ai_signal_strength:   DimensionScore;  // D2 — max 25 (+5 agentic bonus possible)
    skill_transferability:DimensionScore;  // D3 — max 20
    seniority_leverage:   DimensionScore;  // D4 — max 15
    industry_velocity:    DimensionScore;  // D5 — max 10
    career_momentum:      DimensionScore;  // D6 — max 5
  };
  task_tiers: {
    mundane:  TaskTier;
    mediocre: TaskTier;
    core:     TaskTier;
  };
  action_plan: ActionStep[];
}
