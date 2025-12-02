/**
 * Candidates API - Backend Version
 * Uses the centralized backend API instead of direct Supabase access
 */

import { httpClient } from './httpClient';
import type { CandidateSummary, CandidateDetailSummary, CandidateAIInsights, CandidateAttemptSummary, CandidateAttemptStatus } from './types';
import type { ProfileUpdates } from '../../types/candidate';

interface CandidateListResponse {
  candidates: unknown[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CandidateListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

/**
 * Backend Candidate Interface
 */
interface BackendCandidate {
  id: string;
  auth_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  band: string | null;
  phone?: string | null;
  gender?: string | null;
  education?: string | null;
  dob?: string | null;
  telegram_user_id?: string | null;
  assessment_attempts?: AssessmentAttempt[];
  results?: AssessmentResult[];
  [key: string]: unknown;
}

interface AssessmentAttempt {
  id: string;
  status: string;
  answered_count: number;
  total_questions: number;
  progress_percent: number;
  started_at: string;
  submitted_at: string;
  completed_at: string;
  duration_seconds: number;
  assessment?: {
    title: string;
    target_role: string;
  };
  ai_status: string;
  cheating_count: number;
}

interface AssessmentResult {
  overall_score?: number;
  recommended_roles?: string[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  development_suggestions?: string[];
  team_fit?: string[] | Record<string, unknown> | null;
  analysis_completed_at?: string;
  skill_scores?: Record<string, unknown>;
  time_analysis?: Record<string, unknown>;
  cheating_summary?: string | Record<string, unknown>;
  personality_traits?: string[] | Record<string, unknown>;
}

const mapCandidate = (data: BackendCandidate): CandidateSummary => {
  console.log('Mapping candidate data:', data);

  // Safely access results with null checks
  let aiInsights: CandidateAIInsights | undefined = undefined;
  if (data.results && data.results.length > 0) {
    const result = data.results[0] as AssessmentResult;
    console.log('Processing AI insights from result:', result);

    // Calculate overall score from skill_scores if not provided
    let overallScore: number | undefined = result.overall_score;
    if (!overallScore && result.skill_scores) {
      const scores = Object.values(result.skill_scores).filter((v): v is number => typeof v === 'number');
      if (scores.length > 0) {
        overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    }

    // Normalize teamFit to array of strings
    let teamFit: string[] | undefined = undefined;
    if (result.team_fit) {
      if (Array.isArray(result.team_fit)) {
        // Check if it's an array of objects (new format) or strings (old format)
        if (result.team_fit.length > 0 && typeof result.team_fit[0] === 'object') {
          teamFit = (result.team_fit as any[]).map(t => t.name || t.id);
        } else {
          teamFit = result.team_fit as string[];
        }
      } else if (typeof result.team_fit === 'object') {
        // If it's an object, extract keys or values
        teamFit = Object.keys(result.team_fit);
      }
    }

    aiInsights = {
      overallScore,
      recommendedRoles: result.recommended_roles || [],
      summary: result.summary || null,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      developmentSuggestions: result.development_suggestions || [],
      teamFit,
      analysisCompletedAt: result.analysis_completed_at,
      skillScores: result.skill_scores as Record<string, number>,
      timeAnalysis: result.time_analysis as Record<string, unknown>,
      cheatingSummary: typeof result.cheating_summary === 'string'
        ? { summary: result.cheating_summary } as Record<string, unknown>
        : (result.cheating_summary as unknown) as Record<string, unknown>,
      personalityTraits: Array.isArray(result.personality_traits)
        ? result.personality_traits.reduce((acc, trait, index) => {
          acc[`trait_${index}`] = trait;
          return acc;
        }, {} as Record<string, unknown>)
        : result.personality_traits as Record<string, unknown>,
    };
  }

  // Safely access assessment attempts with null checks
  let attempt: CandidateAttemptSummary | undefined = undefined;
  if (data.assessment_attempts && data.assessment_attempts.length > 0) {
    const firstAttempt = data.assessment_attempts[0] as AssessmentAttempt;
    console.log('Processing first attempt:', firstAttempt);

    attempt = {
      id: firstAttempt.id,
      status: firstAttempt.status as CandidateAttemptStatus,
      answeredCount: firstAttempt.answered_count,
      totalQuestions: firstAttempt.total_questions,
      progressPercent: firstAttempt.progress_percent,
      startedAt: firstAttempt.started_at,
      submittedAt: firstAttempt.submitted_at,
      completedAt: firstAttempt.completed_at,
      durationSeconds: firstAttempt.duration_seconds,
      averageSecondsPerQuestion: firstAttempt.answered_count > 0
        ? firstAttempt.duration_seconds / firstAttempt.answered_count
        : 0,
      assessmentTitle: firstAttempt.assessment?.title,
      assessmentRole: firstAttempt.assessment?.target_role,
      aiStatus: firstAttempt.ai_status,
      cheatingCount: firstAttempt.cheating_count,
    };
  }

  console.log('Mapped AI insights:', aiInsights);
  console.log('Mapped attempt:', attempt);

  return {
    id: data.id,
    authId: data.auth_id,
    fullName: data.full_name,
    email: data.email,
    role: data.role,
    band: data.band,
    avatarChar: (data.full_name?.[0] || data.email?.[0] || '?').toUpperCase(),
    aiInsights,
    attempt,
  };
};

const mapCandidateDetail = (data: BackendCandidate): CandidateDetailSummary => {
  const summary = mapCandidate(data);

  // Calculate age from DOB if available
  let age: number | undefined;
  if (data.dob) {
    const birthDate = new Date(data.dob);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  return {
    ...summary,
    phone: data.phone,
    telegram: data.telegram_user_id || (data.nickname as string | undefined), // Fallback to nickname if telegram_id is missing
    gender: data.gender,
    education: data.education,
    age,
    attempts: data.assessment_attempts?.map(attempt => ({
      id: attempt.id,
      status: attempt.status as CandidateAttemptStatus,
      answeredCount: attempt.answered_count,
      totalQuestions: attempt.total_questions,
      progressPercent: attempt.progress_percent,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      completedAt: attempt.completed_at,
      durationSeconds: attempt.duration_seconds,
      averageSecondsPerQuestion: attempt.answered_count > 0
        ? attempt.duration_seconds / attempt.answered_count
        : 0,
      assessmentTitle: attempt.assessment?.title,
      assessmentRole: attempt.assessment?.target_role,
      aiStatus: attempt.ai_status,
      cheatingCount: attempt.cheating_count,
    })) || [],
  };
};

/**
 * Get paginated list of candidates
 */
export const getCandidates = async (params?: CandidateListParams): Promise<CandidateSummary[]> => {
  try {
    const response = await httpClient.get<CandidateListResponse>('/hr/candidates', params);

    console.log('[getCandidates] Response from backend:', {
      candidatesCount: response.candidates?.length,
      sampleCandidate: response.candidates?.[0] ? {
        id: (response.candidates[0] as any).id,
        email: (response.candidates[0] as any).email,
        hasAttempts: !!(response.candidates[0] as any).assessment_attempts,
        attemptsCount: (response.candidates[0] as any).assessment_attempts?.length,
        hasResults: !!(response.candidates[0] as any).results,
        resultsCount: (response.candidates[0] as any).results?.length,
      } : null,
    });

    // Map backend response to frontend format
    return (response.candidates as BackendCandidate[]).map(mapCandidate);
  } catch (error) {
    console.error('Failed to fetch candidates from backend:', error);
    throw new Error('Unable to load candidates');
  }
};

/**
 * Get detailed candidate information by ID
 */
export const getCandidateDetails = async (candidateId: string): Promise<CandidateDetailSummary> => {
  try {
    const response = await httpClient.get<BackendCandidate>(`/hr/candidates/${candidateId}`);

    // Map backend response to frontend format
    return mapCandidateDetail(response);
  } catch (error) {
    console.error('Failed to fetch candidate details from backend:', error);
    throw new Error('Unable to load candidate details');
  }
};

/**
 * Update candidate information
 */
export const updateCandidateInfo = async (candidateId: string, updates: ProfileUpdates): Promise<void> => {
  try {
    await httpClient.put(`/hr/candidates/${candidateId}`, updates);
  } catch (error) {
    console.error('Failed to update candidate:', error);
    throw new Error('Unable to update candidate');
  }
};

/**
 * Ensure candidate exists (called after OAuth)
 */
export const ensureCandidate = async (authId: string, email: string, fullName: string): Promise<unknown> => {
  try {
    const response = await httpClient.post<unknown>('/hr/candidates/ensure', {
      auth_id: authId,
      email,
      full_name: fullName,
    });
    return response;
  } catch (error) {
    console.error('Failed to ensure candidate:', error);
    throw new Error('Unable to ensure candidate');
  }
};

/**
 * Get candidate answers for an assessment attempt
 */
export interface CandidateAnswer {
  questionNumber?: number;
  questionId: string;
  questionText: string;
  questionFormat: string;
  userAnswer: string | null;
  selectedOptionIndex?: number | null;
  allOptions?: string[];
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
  answeredAt: string;
}

export const getCandidateAnswers = async (attemptId: string): Promise<CandidateAnswer[]> => {
  try {
    const response = await httpClient.get<CandidateAnswer[]>(`/hr/candidates/attempts/${attemptId}/answers`);
    return response;
  } catch (error) {
    console.error('Failed to fetch candidate answers from backend:', error);
    throw new Error('Unable to load candidate answers');
  }
};
