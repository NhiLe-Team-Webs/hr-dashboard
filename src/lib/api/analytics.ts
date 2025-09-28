import { supabase } from '../supabaseClient';
import type { CandidateAIInsights, CandidateAttemptStatus } from './types';
import {
  candidateSummarySelect,
  mapCandidateSummary,
  type SupabaseCandidateProfile,
} from './candidates';

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
    .from('profiles')
    .select(candidateSummarySelect)
    .order('analysis_completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false });

  if (error) {
    console.error('Failed to load analytics data:', error);
    throw new Error('Unable to load analytics data.');
  }

  const rows = (data as SupabaseCandidateProfile[] | null) ?? [];

  return rows.map((profile) => {
    const summary = mapCandidateSummary(profile);
    const status = summary.attempt?.status ?? 'not_started';
    const role = summary.attempt?.assessmentRole ?? summary.role ?? 'Chưa xác định';

    return {
      id: summary.id,
      name: summary.fullName ?? 'Chưa cập nhật',
      role,
      band: summary.band ?? null,
      aiInsights: summary.aiInsights,
      status: status as CandidateAttemptStatus,
    } satisfies AnalyticsCandidateRow;
  });
};
