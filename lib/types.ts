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
  percentile_label: string;
  verdict: string;
  builder_paradox_note: string | null;
  dimensions: {
    automation_risk: DimensionScore;
    ai_awareness: DimensionScore;
    skill_transferability: DimensionScore;
    seniority_leverage: DimensionScore;
    industry_velocity: DimensionScore;
  };
  task_tiers: {
    mundane: TaskTier;
    mediocre: TaskTier;
    core: TaskTier;
  };
  action_plan: ActionStep[];
}
