import { supabase } from '../supabaseClient';
import type { ProfileUpdates } from '../../types/supabase';
import type {
  CandidateAttemptStatus,
  CandidateAttemptSummary,
  CandidateCheatingEvent,
  CandidateDetailSummary,
  CandidateSummary,
} from './types';
import { mapAiInsights, type SupabaseResultRow } from './aiInsights';

export interface SupabaseAssessmentAttempt {
  id: string;
  status: string | null;
  answered_count: number | null;
  total_questions: number | null;
  progress_percent: number | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  created_at: string | null;
  duration_seconds: number | null;
  average_seconds_per_question: number | null;
  question_timings: Record<string, unknown> | null;
  cheating_count: number | null;
  cheating_events: unknown;
  ai_status: string | null;
  last_ai_error: string | null;
  assessment_id: string | null;
  assessment?: Array<{
    id: string;
    title: string | null;
    target_role: string | null;
  }> | null;
}

export interface SupabaseCandidateProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  assessment_attempts?: SupabaseAssessmentAttempt[] | null;
  results?: SupabaseResultRow[] | null;
}

export const candidateSummarySelect = `
  id,
  name,
  email,
  role,
  band,
  assessment_attempts (
    id,
    status,
    answered_count,
    total_questions,
    progress_percent,
    started_at,
    submitted_at,
    completed_at,
    last_activity_at,
    created_at,
    duration_seconds,
    average_seconds_per_question,
    question_timings,
    cheating_count,
    cheating_events,
    ai_status,
    last_ai_error,
    assessment_id,
    assessment:assessments!assessment_attempts_assessment_id_fkey (
      id,
      title,
      target_role
    )
  ),
  results:results!results_profile_id_fkey (
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
    created_at,
    role_fit,
    time_analysis,
    cheating_summary,
    personality_traits,
    insight_locale,
    insight_version
  )
`;

const isPlainObject = (input: unknown): input is Record<string, unknown> =>
  Boolean(input) && typeof input === 'object' && !Array.isArray(input);

const normaliseQuestionTimings = (input: unknown): Record<string, number> | null => {
  if (!isPlainObject(input)) {
    return null;
  }

  const entries = Object.entries(input).reduce<Record<string, number>>((acc, [key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      acc[key] = value;
      return acc;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        acc[key] = parsed;
      }
    }

    return acc;
  }, {});

  return Object.keys(entries).length > 0 ? entries : null;
};

const normaliseCheatingEvents = (input: unknown): CandidateCheatingEvent[] | null => {
  if (!input) {
    return null;
  }

  const rawEvents = Array.isArray(input) ? input : [input];
  const events = rawEvents
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      const metadata = isPlainObject(entry.metadata) ? (entry.metadata as Record<string, unknown>) : undefined;
      const questionId = typeof entry.question_id === 'string' ? entry.question_id : null;
      const type = typeof entry.type === 'string' ? entry.type : undefined;
      const occurredAt = typeof entry.occurred_at === 'string' ? entry.occurred_at : undefined;

      if (!questionId && !type && !occurredAt && !metadata) {
        return null;
      }

      return {
        questionId,
        type,
        occurredAt,
        metadata,
      } satisfies CandidateCheatingEvent;
    })
    .filter((event): event is CandidateCheatingEvent => Boolean(event));

  return events.length > 0 ? events : null;
};

const sortAttemptsByRecency = (
  attempts: SupabaseAssessmentAttempt[] | null | undefined,
): SupabaseAssessmentAttempt[] => {
  if (!attempts) {
    return [];
  }

  return [...attempts].sort((a, b) => {
    const timestamp = (value: SupabaseAssessmentAttempt) => {
      const candidates = [value.created_at, value.completed_at, value.submitted_at, value.started_at, value.last_activity_at];
      for (const candidate of candidates) {
        if (candidate) {
          const parsed = Date.parse(candidate);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      }
      return Number.NEGATIVE_INFINITY;
    };

    return timestamp(b) - timestamp(a);
  });
};

const mapAttemptSummary = (row?: SupabaseAssessmentAttempt | null): CandidateAttemptSummary | undefined => {
  if (!row) {
    return undefined;
  }

  const status = (row.status ?? 'not_started') as CandidateAttemptStatus;
  const answeredRaw = Math.max(row.answered_count ?? 0, 0);
  const totalQuestions = Math.max(row.total_questions ?? answeredRaw, 0);
  const isCompleted = status === 'awaiting_ai' || status === 'completed';

  const answeredCount = isCompleted ? totalQuestions : answeredRaw;
  const calculatedProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const rawProgress = row.progress_percent != null ? Number(row.progress_percent) : calculatedProgress;
  const progressPercent = isCompleted ? 100 : Math.min(100, Math.max(0, rawProgress));

  const assessment = row.assessment?.[0];

  return {
    id: row.id,
    status,
    answeredCount,
    totalQuestions,
    progressPercent,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    durationSeconds: row.duration_seconds,
    averageSecondsPerQuestion: row.average_seconds_per_question,
    questionTimings: normaliseQuestionTimings(row.question_timings),
    cheatingCount: row.cheating_count ?? undefined,
    cheatingEvents: normaliseCheatingEvents(row.cheating_events),
    aiStatus: row.ai_status ?? undefined,
    lastAiError: row.last_ai_error ?? undefined,
    assessmentId: row.assessment_id,
    assessmentTitle: assessment?.title ?? null,
    assessmentRole: assessment?.target_role ?? null,
  } satisfies CandidateAttemptSummary;
};

const mapProfile = (profile: SupabaseCandidateProfile) => {
  const sortedAttempts = sortAttemptsByRecency(profile.assessment_attempts);
  const attemptSummaries = sortedAttempts
    .map((attempt) => mapAttemptSummary(attempt))
    .filter((attempt): attempt is CandidateAttemptSummary => Boolean(attempt));

  const aiInsights = mapAiInsights(profile.results);
  const avatarSource = (profile.name ?? '').trim();
  const avatarChar = avatarSource ? avatarSource.charAt(0).toUpperCase() : '?';

  const summary: CandidateSummary = {
    id: profile.id,
    fullName: profile.name ?? null,
    email: profile.email ?? null,
    role: profile.role ?? null,
    band: profile.band ?? null,
    avatarChar,
    attempt: attemptSummaries[0],
    attemptCount: attemptSummaries.length > 0 ? attemptSummaries.length : undefined,
    aiInsights,
  } satisfies CandidateSummary;

  return {
    summary,
    attemptSummaries,
  };
};

export const mapCandidateSummary = (profile: SupabaseCandidateProfile): CandidateSummary => mapProfile(profile).summary;

const mapCandidateDetail = (profile: SupabaseCandidateProfile): CandidateDetailSummary => {
  const { summary, attemptSummaries } = mapProfile(profile);

  return {
    ...summary,
    attempts: attemptSummaries,
    phone: null,
    telegram: null,
    age: null,
    gender: null,
    education: null,
  } satisfies CandidateDetailSummary;
};

export const updateCandidateInfo = async (candidateId: string, updates: ProfileUpdates): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', candidateId);

  if (error) {
    console.error('Failed to update candidate profile:', error);
    throw new Error('Unable to update candidate profile.');
  }
};

export const getCandidateDetails = async (candidateId: string): Promise<CandidateDetailSummary> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(candidateSummarySelect)
    .eq('id', candidateId)
    .order('analysis_completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to load candidate details:', error);
    throw new Error('Unable to load candidate details.');
  }

  return mapCandidateDetail(data as SupabaseCandidateProfile);
};

export const getCandidates = async (): Promise<CandidateSummary[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(candidateSummarySelect)
    .order('analysis_completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .limit(1, { foreignTable: 'results' })
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .limit(1, { foreignTable: 'assessment_attempts' });

  if (error) {
    console.error('Failed to load candidates:', error);
    throw new Error('Unable to load candidates.');
  }

  const rows = (data as SupabaseCandidateProfile[] | null) ?? [];

  return rows.map((profile) => mapCandidateSummary(profile));
};
