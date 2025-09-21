// src/types/supabase.ts

// Interfaces for the Profiles table
export interface ProfileUpdates {
  name?: string;
  email?: string;
  role?: string;
  band?: string;
}

// Interfaces for the Analytics data returned by the Supabase query
export interface SupabaseAnalyticsUser {
  id: string;
  name: string;
  band: string | null;
}

export interface SupabaseAnalyticsAssessment {
  target_role: string;
}

export interface SupabaseAnalyticsData {
  overall_score: number | null;
  skill_scores: Record<string, unknown> | null;
  strengths: unknown;
  weaknesses: unknown;
  recommended_roles: unknown;
  summary: string | null;
  development_suggestions: unknown;
  ai_summary: Record<string, unknown> | null;
  analysis_model: string | null;
  analysis_version: string | null;
  analysis_completed_at: string | null;
  user: SupabaseAnalyticsUser;
  assessment: SupabaseAnalyticsAssessment;
}

// Interface for the roles data returned by the Supabase query
export interface SupabaseRoleData {
  target_role: string;
}

// Interface for the questions data returned by the Supabase query
export interface SupabaseQuestionData {
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