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
  createdAt?: string | null;
  durationSeconds?: number | null;
  averageSecondsPerQuestion?: number | null;
  questionTimings?: Record<string, number> | null;
  cheatingCount?: number | null;
  cheatingEvents?: CandidateCheatingEvent[] | null;
  aiStatus?: string | null;
  lastAiError?: string | null;
  assessmentId?: string | null;
  assessmentTitle?: string | null;
  assessmentRole?: string | null;
}

export interface CandidateAIInsights {
  skillScores?: Record<string, number | null>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedRoles?: string[];
  summary?: string | null;
  developmentSuggestions?: string[];
  rawAiSummary?: Record<string, unknown> | null;
  model?: string | null;
  analysisCompletedAt?: string | null;
  createdAt?: string | null;
  insightLocale?: string | null;
  insightVersion?: string | null;
  teamFit?: string[] | null;
  timeAnalysis?: Record<string, unknown> | null;
  cheatingSummary?: Record<string, unknown> | null;
  personalityTraits?: Record<string, unknown> | null;
  overallScore?: number | null;
}

export interface CandidateCheatingEvent {
  questionId?: string | null;
  type?: string;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
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
  attemptCount?: number;
  recommendedTeam?: {
    id: string;
    name: string;
  } | null;
}

export interface CandidateDetailSummary extends CandidateSummary {
  phone?: string | null;
  telegram?: string | null;
  age?: number | null;
  gender?: string | null;
  education?: string | null;
  attempts?: CandidateAttemptSummary[];
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
