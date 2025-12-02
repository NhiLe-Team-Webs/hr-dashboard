/**
 * AI Insights API - Backend Version
 * Uses the centralized backend API instead of direct AI calls
 */

import { httpClient } from './httpClient';

interface AIInsightsResponse {
  insights: string;
  strengths: string[];
  areas_for_improvement: string[];
}

/**
 * Get AI insights for a candidate
 */
export const getAIInsights = async (candidateId: string, attemptId?: string): Promise<AIInsightsResponse> => {
  try {
    const payload: Record<string, unknown> = {
      candidate_id: candidateId,
    };

    if (attemptId) {
      payload.attempt_id = attemptId;
    }

    const response = await httpClient.post<AIInsightsResponse>('/hr/ai/insights', payload);
    return response;
  } catch (error) {
    console.error('Failed to fetch AI insights from backend:', error);
    throw new Error('Unable to load AI insights');
  }
};
