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

interface Team {
  id: string;
  name: string;
}

let teamsCache: Team[] | null = null;

const fetchTeams = async (): Promise<Team[]> => {
  if (teamsCache) {
    return teamsCache;
  }

  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .is('deleted_at', null);

  if (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }

  teamsCache = data || [];
  return teamsCache;
};

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

export interface SupabaseCandidateUser {
  id: string; // Internal ID
  auth_id: string; // Auth ID
  full_name: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  phone: string | null;
  gender: string | null;
  education: string | null;
  address: string | null;
  dob: string | null;
  nid: string | null;
  nickname: string | null;
  telegram_user_id: number | null;
  assessment_attempts?: SupabaseAssessmentAttempt[] | null;
  results?: SupabaseResultRow[] | null;
}

export const candidateSummarySelect = `
  id,
  auth_id,
  full_name,
  email,
  role,
  band,
  phone,
  gender,
  education,
  address,
  dob,
  nid,
  nickname,
  telegram_user_id,
  assessment_attempts:interview_assessment_attempts!user_id (
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
    assessment:interview_assessments (
      id,
      title,
      target_role
    )
  ),
  results:interview_results!user_id (
    id,
    skill_scores,
    strengths,
    weaknesses,
    recommended_roles,
    summary,
    development_suggestions,
    ai_summary,
    analysis_model,
    analysis_completed_at,
    created_at,
    team_fit,
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
    .map((entry): CandidateCheatingEvent | null => {
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

const mapUser = (user: SupabaseCandidateUser, teams: Team[]) => {
  const sortedAttempts = sortAttemptsByRecency(user.assessment_attempts);
  const attemptSummaries = sortedAttempts
    .map((attempt) => mapAttemptSummary(attempt))
    .filter((attempt): attempt is CandidateAttemptSummary => Boolean(attempt));

  const aiInsights = mapAiInsights(user.results, teams);
  const avatarSource = (user.full_name ?? '').trim();
  const avatarChar = avatarSource ? avatarSource.charAt(0).toUpperCase() : '?';

  // Extract team information from results
  const latestResult = user.results?.[0];
  // Get team information from the team_fit JSONB field (array of team IDs)
  const teamFit = latestResult?.team_fit;
  let recommendedTeam = null;
  
  if (teamFit && Array.isArray(teamFit) && teamFit.length > 0) {
    const firstTeamId = teamFit[0];
    const team = teams.find(t => t.id === firstTeamId);
    if (team) {
      recommendedTeam = {
        id: team.id,
        name: team.name
      };
    }
  }

  const summary: CandidateSummary = {
    id: user.auth_id, // Use Auth ID as the public ID
    fullName: user.full_name ?? null,
    email: user.email ?? null,
    role: user.role ?? null,
    band: user.band ?? null,
    avatarChar,
    attempt: attemptSummaries[0],
    attemptCount: attemptSummaries.length > 0 ? attemptSummaries.length : undefined,
    aiInsights,
    recommendedTeam,
  } satisfies CandidateSummary;

  return {
    summary,
    attemptSummaries,
  };
};

export const mapCandidateSummary = (user: SupabaseCandidateUser, teams: Team[]): CandidateSummary => mapUser(user, teams).summary;

const mapCandidateDetail = (user: SupabaseCandidateUser, teams: Team[]): CandidateDetailSummary => {
  const { summary, attemptSummaries } = mapUser(user, teams);

  return {
    ...summary,
    attempts: attemptSummaries,
    phone: user.phone ?? null,
    telegram: user.telegram_user_id ? String(user.telegram_user_id) : null,
    age: null, // Calculate from dob if needed, or leave null
    gender: user.gender ?? null,
    education: user.education ?? null,
  } satisfies CandidateDetailSummary;
};

export const updateCandidateInfo = async (candidateId: string, updates: ProfileUpdates): Promise<void> => {
  // candidateId is Auth ID
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('auth_id', candidateId);

  if (error) {
    console.error('Failed to update candidate user:', error);
    throw new Error('Unable to update candidate user.');
  }
};

export const getCandidateDetails = async (candidateId: string): Promise<CandidateDetailSummary> => {
  // candidateId is Auth ID
  const [teamsResult, candidateResult] = await Promise.all([
    fetchTeams(),
    supabase
      .from('users')
      .select(candidateSummarySelect)
      .eq('auth_id', candidateId)
      .eq('role', 'candidate')
      .order('analysis_completed_at', { foreignTable: 'interview_results', ascending: false, nullsFirst: false })
      .order('created_at', { foreignTable: 'interview_assessment_attempts', ascending: false })
      .maybeSingle()
  ]);

  const { data, error } = candidateResult;

  if (error || !data) {
    console.error('Failed to load candidate details:', error);
    throw new Error('Unable to load candidate details.');
  }

  return mapCandidateDetail(data as SupabaseCandidateUser, teamsResult);
};

export const getCandidates = async (): Promise<CandidateSummary[]> => {
  const [teams, candidatesResult] = await Promise.all([
    fetchTeams(),
    supabase
      .from('users')
      .select(candidateSummarySelect)
      .eq('role', 'candidate')
      .order('analysis_completed_at', { foreignTable: 'interview_results', ascending: false, nullsFirst: false })
      .limit(1, { foreignTable: 'interview_results' })
      .order('created_at', { foreignTable: 'interview_assessment_attempts', ascending: false })
      .limit(1, { foreignTable: 'interview_assessment_attempts' })
  ]);

  const { data, error } = candidatesResult;

  if (error) {
    console.error('Failed to load candidates:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error('Unable to load candidates.');
  }

  const rows = (data as SupabaseCandidateUser[] | null) ?? [];

  return rows.map((user) => mapCandidateSummary(user, teams));
};

export interface CandidateAnswer {
  questionId: string;
  questionText: string;
  questionFormat: string;
  userAnswer: string;
  selectedOptionIndex?: number;
  allOptions?: string[];
  answeredAt: string;
}

export const getCandidateAnswers = async (attemptId: string): Promise<CandidateAnswer[]> => {
  // First, try to get answers from answers_snapshot (faster, no joins needed)
  const { data: attemptData, error: attemptError } = await supabase
    .from('interview_assessment_attempts')
    .select('answers_snapshot')
    .eq('id', attemptId)
    .single();

  if (!attemptError && attemptData?.answers_snapshot) {
    // Parse and return the snapshot
    const snapshot = attemptData.answers_snapshot;
    if (Array.isArray(snapshot) && snapshot.length > 0) {
      return snapshot.map((item: any) => ({
        questionId: item.questionId ?? item.question_id,
        questionText: item.questionText ?? item.question_text ?? 'Unknown question',
        questionFormat: item.questionFormat ?? item.question_format ?? 'unknown',
        userAnswer: item.userAnswer ?? item.user_answer ?? '',
        selectedOptionIndex: item.selectedOptionIndex ?? item.selected_option_index,
        allOptions: item.allOptions ?? item.all_options ?? [],
        answeredAt: item.answeredAt ?? item.answered_at ?? new Date().toISOString(),
      }));
    }
  }

  console.warn('answers_snapshot not available, falling back to interview_answers table');

  // Fallback to old method if snapshot doesn't exist
  // Try to query by attempt_id first (if migration has been run)
  const { data: dataWithAttempt, error: errorWithAttempt } = await supabase
    .from('interview_answers')
    .select(`
      id,
      question_id,
      user_answer_text,
      selected_option_id,
      created_at,
      question:interview_questions (
        id,
        text,
        format,
        correct_answer
      ),
      selected_option:interview_question_options!selected_option_id (
        id,
        option_text,
        is_correct
      )
    `)
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true });

  // If attempt_id column doesn't exist or query fails, fall back to result_id
  if (errorWithAttempt) {
    console.warn('attempt_id query failed, falling back to result_id:', errorWithAttempt);
    
    // Get result_id from the attempt via interview_results
    let resultData = null;
    const { data: resultByAttempt, error: resultError } = await supabase
      .from('interview_results')
      .select('id')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (resultError) {
      console.warn('Failed to find result by attempt_id, trying user_id/assessment_id:', resultError);
      
      // Last resort: get result by matching user_id and assessment_id from attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from('interview_assessment_attempts')
        .select('user_id, assessment_id')
        .eq('id', attemptId)
        .single();

      if (attemptError || !attemptData) {
        console.error('Failed to find attempt:', attemptError);
        return []; // Can't find the attempt, return empty
      }

      const { data: resultByUserData, error: resultByUserError } = await supabase
        .from('interview_results')
        .select('id')
        .eq('user_id', attemptData.user_id)
        .eq('assessment_id', attemptData.assessment_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resultByUserError || !resultByUserData) {
        console.error('Failed to find result by user/assessment:', resultByUserError);
        return []; // No results yet, return empty array
      }

      resultData = resultByUserData;
    } else {
      resultData = resultByAttempt;
    }

    if (!resultData) {
      return []; // No results yet
    }

    // Query by result_id instead
    const { data: dataWithResult, error: errorWithResult } = await supabase
      .from('interview_answers')
      .select(`
        id,
        question_id,
        user_answer_text,
        selected_option_id,
        created_at,
        question:interview_questions (
          id,
          text,
          format,
          correct_answer
        ),
        selected_option:interview_question_options!selected_option_id (
          id,
          option_text,
          is_correct
        )
      `)
      .eq('result_id', resultData.id)
      .order('created_at', { ascending: true });

    if (errorWithResult) {
      console.error('Failed to load candidate answers by result_id:', errorWithResult);
      throw new Error('Unable to load candidate answers.');
    }

    if (!dataWithResult) {
      return [];
    }

    return dataWithResult.map((row: any) => {
      const question = Array.isArray(row.question) ? row.question[0] : row.question;
      const selectedOption = Array.isArray(row.selected_option) ? row.selected_option[0] : row.selected_option;
      
      return {
        questionId: row.question_id,
        questionText: question?.text ?? 'Unknown question',
        questionFormat: question?.format ?? 'unknown',
        userAnswer: row.user_answer_text ?? selectedOption?.option_text ?? '',
        selectedOptionIndex: undefined,
        allOptions: [],
        answeredAt: row.created_at,
      } satisfies CandidateAnswer;
    });
  }

  if (!dataWithAttempt) {
    return [];
  }

  return dataWithAttempt.map((row: any) => {
    const question = Array.isArray(row.question) ? row.question[0] : row.question;
    const selectedOption = Array.isArray(row.selected_option) ? row.selected_option[0] : row.selected_option;
    
    return {
      questionId: row.question_id,
      questionText: question?.text ?? 'Unknown question',
      questionFormat: question?.format ?? 'unknown',
      userAnswer: row.user_answer_text ?? selectedOption?.option_text ?? '',
      selectedOptionIndex: undefined,
      allOptions: [],
      answeredAt: row.created_at,
    } satisfies CandidateAnswer;
  });
};
