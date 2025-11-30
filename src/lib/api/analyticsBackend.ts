/**
 * Analytics API - Backend Version
 * Uses the centralized backend API instead of direct Supabase access
 */

import { httpClient } from './httpClient';
import type { CandidateAIInsights, CandidateAttemptStatus } from './types';

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

interface AnalyticsOverviewResponse {
  totalCandidates: number;
  totalAssessments: number;
  completionRate: number;
  averageScore: number;
  candidatesByRole: Record<string, number>;
  assessmentsByDate: Array<{ date: string; count: number }>;
}

interface AnalyticsCandidatesResponse {
  candidates: AnalyticsCandidateRow[];
}

/**
 * Get analytics overview data
 */
export const getAnalyticsOverview = async (startDate?: string, endDate?: string): Promise<AnalyticsOverviewResponse> => {
  try {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await httpClient.get<AnalyticsOverviewResponse>('/hr/analytics/overview', params);
    return response;
  } catch (error) {
    console.error('Failed to fetch analytics overview from backend:', error);
    throw new Error('Unable to load analytics overview');
  }
};

/**
 * Get analytics candidate data
 */
export const getAnalyticsData = async (): Promise<AnalyticsCandidateRow[]> => {
  try {
    const response = await httpClient.get<AnalyticsCandidatesResponse>('/hr/analytics/candidates');
    return response.candidates;
  } catch (error) {
    console.error('Failed to fetch analytics data from backend:', error);
    throw new Error('Unable to load analytics data');
  }
};
