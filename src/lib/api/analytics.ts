import { supabase } from '../supabaseClient';
import type { CandidateAIInsights, CandidateAttemptStatus } from './types';
import { mapAiInsights, type SupabaseResultRow } from './aiInsights';

interface SupabaseAnalyticsUser {
  id: string;
  name: string | null;
  band: string | null;
}

interface SupabaseAnalyticsAssessment {
  target_role: string | null;
}

interface SupabaseAnalyticsRow extends SupabaseResultRow {
  assessment: SupabaseAnalyticsAssessment[] | null;
  user: SupabaseAnalyticsUser[] | null;
}

export interface AnalyticsCandidateRow {
  id: string;
  name: string;
  role: string;
  band: string | null;
  aiInsights?: CandidateAIInsights;
  status: CandidateAttemptStatus;
}

export const getAnalyticsData = async (): Promise<AnalyticsCandidateRow[]> => {
  const { data, error } = await supabase
    .from('results')
    .select(
      `
        id,
        overall_score,
        skill_scores,
        strengths,
        weaknesses,
        recommended_roles,
        summary,
        development_suggestions,
        ai_summary,
        analysis_model,
        analysis_version,
        analysis_completed_at,
        assessment:assessments(target_role),
        user:profiles(id, name, band)
      `,
    );

  if (error) {
    console.error('Failed to load analytics data:', error);
    throw new Error('Unable to load analytics data.');
  }

  const rows = (data as SupabaseAnalyticsRow[] | null) ?? [];

  return rows
    .filter((row) => row.user && row.user.length > 0)
    .map((row) => {
      const user = row.user![0];
      const assessment = row.assessment?.[0];
      const aiInsights = mapAiInsights([row]);

      return {
        id: user.id,
        name: user.name ?? 'Unknown',
        role: assessment?.target_role ?? 'Unknown',
        band: user.band ?? null,
        aiInsights,
        status: (row.analysis_completed_at ? 'completed' : 'awaiting_ai') as CandidateAttemptStatus,
      } satisfies AnalyticsCandidateRow;
    });
};
