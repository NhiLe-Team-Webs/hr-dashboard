// src/types/candidate.ts

// Interfaces for Users table
export interface ProfileUpdates {
  full_name?: string;
  email?: string;
  role?: string;
  band?: string;
}

// Interfaces for Analytics data returned by backend query
export interface AnalyticsUser {
  auth_id: string;
  full_name: string;
  band: string | null;
}

export interface AnalyticsAssessment {
  target_role: string;
}

export interface AnalyticsData {
  skill_scores: Record<string, unknown> | null;
  strengths: unknown;
  weaknesses: unknown;
  recommended_roles: unknown;
  summary: string | null;
  development_suggestions: unknown;
  ai_summary: Record<string, unknown> | null;
  analysis_model: string | null;
  analysis_completed_at: string | null;
  team_fit: string[] | null;
  user: AnalyticsUser;
  assessment: AnalyticsAssessment;
}

// Interface for roles data returned by backend query
export interface RoleData {
  target_role: string;
}

// Interface for questions data returned by backend query
export interface QuestionData {
  id: string;
  text: string;
  type: string;
  format: 'text' | 'multiple_choice';
  required: boolean;
  points: number;
  target_role: string;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
  }[];
}