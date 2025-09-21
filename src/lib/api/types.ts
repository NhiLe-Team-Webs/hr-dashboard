import type { Question } from '../../types/question';
import type { PaginatedResponse } from '../httpClient';

export type QuestionDraft = Omit<Question, 'id' | 'assessmentId' | 'createdAt'>;

export type CandidateAttemptStatus = 'not_started' | 'in_progress' | 'awaiting_ai' | 'completed';

export interface CandidateAttemptSummary {
  id: string;
  status: CandidateAttemptStatus;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  lastActivityAt?: string | null;
}

export interface CandidateAIInsights {
  overallScore?: number | null;
  skillScores?: Record<string, number | null>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedRoles?: string[];
  summary?: string | null;
  developmentSuggestions?: string[];
  rawAiSummary?: Record<string, unknown> | null;
  model?: string | null;
  version?: string | null;
  analysisCompletedAt?: string | null;
}

export interface CandidateSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  avatarChar: string;
  aiInsights?: CandidateAIInsights;
  attempt?: CandidateAttemptSummary;
}

export interface CandidateDetailSummary extends CandidateSummary {
  phone?: string | null;
  telegram?: string | null;
  age?: number | null;
  gender?: string | null;
  education?: string | null;
}

export interface FetchQuestionsParams {
  limit?: number;
  offset?: number;
  includeOptions?: boolean;
}

export interface QuestionListResult {
  items: Question[];
  count?: number;
  totalCount?: number;
  pagination?: PaginatedResponse<unknown>['pagination'];
}

export interface UpsertQuestionOptionPayload {
  option_text: string;
  is_correct?: boolean;
}

export interface UpsertQuestionPayload {
  text: string;
  type: string;
  format: string;
  required: boolean;
  assessment_id?: string | null;
  options?: UpsertQuestionOptionPayload[];
}
