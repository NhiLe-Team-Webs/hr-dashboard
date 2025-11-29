import { supabase } from '../supabaseClient';
import type { CandidateAIInsights, CandidateAttemptStatus } from './types';
import type { SupabaseCandidateUser } from './candidates';
import { candidateSummarySelect, mapCandidateSummary } from './candidates';

export interface AnalyticsCandidateRow {
  id: string;
  name: string;
  role: string;
  band: string | null;
  aiInsights?: CandidateAIInsights;
  status: CandidateAttemptStatus;
  recommendedTeam?: {
    id: string;
    name: string;
  } | null;
}

export const getAnalyticsData = async (): Promise<AnalyticsCandidateRow[]> => {
  // Import fetchTeams from candidates module
  const { getCandidates } = await import('./candidates');
  
  // Use getCandidates which already handles teams mapping
  const candidates = await getCandidates();

  // Map to analytics format
  return candidates.map((candidateSummary) => {
    return {
      id: candidateSummary.id,
      name: candidateSummary.fullName ?? 'Chưa cập nhật',
      role: candidateSummary.role ?? 'Chưa xác định',
      band: candidateSummary.band,
      aiInsights: candidateSummary.aiInsights,
      status: candidateSummary.attempt?.status ?? 'not_started',
      recommendedTeam: candidateSummary.recommendedTeam,
    };
  });
};
