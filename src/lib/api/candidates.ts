import { supabase } from '../supabaseClient';
import type { ProfileUpdates } from '../../types/supabase';
import type {
  CandidateAttemptStatus,
  CandidateAttemptSummary,
  CandidateDetailSummary,
  CandidateSummary,
} from './types';
import { mapAiInsights, type SupabaseResultRow } from './aiInsights';

interface SupabaseAssessmentAttempt {
  id: string;
  status: string | null;
  answered_count: number | null;
  total_questions: number | null;
  progress_percent: number | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
}

interface SupabaseCandidateProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  assessment_attempts?: SupabaseAssessmentAttempt[] | null;
  results?: SupabaseResultRow[] | null;
}

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
  };
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
    .select(
      `
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
          last_activity_at
        ),
        results:results!results_user_id_fkey (
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
          analysis_completed_at
        )
      `,
    )
    .eq('id', candidateId)
    .order('analysis_completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .order('completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .limit(1, { foreignTable: 'results' })
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .limit(1, { foreignTable: 'assessment_attempts' })
    .single();

  if (error || !data) {
    console.error('Failed to load candidate details:', error);
    throw new Error('Unable to load candidate details.');
  }

  const profile = data as SupabaseCandidateProfile;
  const attempt = mapAttemptSummary(profile.assessment_attempts?.[0]);
  const aiInsights = mapAiInsights(profile.results);

  return {
    id: profile.id,
    fullName: profile.name ?? null,
    email: profile.email ?? null,
    role: profile.role ?? null,
    band: profile.band ?? null,
    avatarChar: (profile.name ?? '?').charAt(0).toUpperCase(),
    attempt,
    aiInsights,
    phone: null,
    telegram: null,
    age: null,
    gender: null,
    education: null,
  } satisfies CandidateDetailSummary;
};

export const getCandidates = async (): Promise<CandidateSummary[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
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
          last_activity_at
        ),
        results:results!results_user_id_fkey (
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
          analysis_completed_at
        )
      `,
    )
    .order('analysis_completed_at', { foreignTable: 'results', ascending: false, nullsFirst: false })
    .limit(1, { foreignTable: 'results' })
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .limit(1, { foreignTable: 'assessment_attempts' });

  if (error) {
    console.error('Failed to load candidates:', error);
    throw new Error('Unable to load candidates.');
  }

  const rows = (data as SupabaseCandidateProfile[] | null) ?? [];

  return rows.map((profile) => {
    const attempt = mapAttemptSummary(profile.assessment_attempts?.[0]);
    const aiInsights = mapAiInsights(profile.results);

    return {
      id: profile.id,
      fullName: profile.name ?? null,
      email: profile.email ?? null,
      role: profile.role ?? null,
      band: profile.band ?? null,
      avatarChar: (profile.name ?? '?').charAt(0).toUpperCase(),
      attempt,
      aiInsights,
    } satisfies CandidateSummary;
  });
};
