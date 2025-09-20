// src/lib/api.ts

import { supabase } from './supabaseClient';
import { apiClient, PaginatedResponse } from './httpClient';
import { Question, QuestionsByRole, QuestionOption, RoleSummary } from '../types/question';
import { LandingPage } from '../types/landingPage';

// ===========================================
// === INTERFACES �? �?M B?O AN TO�N KI?U ===
// ===========================================

// Interfaces cho h�m getQuestionsByRole
interface SupabaseQuestionOptionData {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface SupabaseQuestionData {
  id: string;
  text: string;
  type?: string;
  format: string;
  required: boolean;
  assessment_id: string | null;
  created_at?: string;
  options?: SupabaseQuestionOptionData[];
}

interface ApiQuestionOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
}

interface ApiQuestion {
  id: string;
  text: string;
  type: string;
  format: string;
  required: boolean;
  assessment_id: string | null;
  created_at?: string;
  options?: ApiQuestionOption[];
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  totalCount?: number;
  pagination?: PaginatedResponse<unknown>['pagination'];
}

const MULTIPLE_CHOICE_FORMATS = new Set(['multiple_choice']);

export type QuestionDraft = Omit<Question, 'id' | 'assessmentId' | 'createdAt'>;


const normaliseQuestionFormat = (format?: string | null): Question['format'] => {
  if (!format) {
    return 'text';
  }

  if (format === 'multiple_choice' || format === 'multiple-choice') {
    return 'multiple_choice';
  }

  return format as Question['format'];
};

const mapOption = (option: SupabaseQuestionOptionData | ApiQuestionOption): QuestionOption => ({
  id: option.id,
  text: option.option_text,
  optionText: option.option_text,
  isCorrect: option.is_correct ?? false,
});

const extractCorrectAnswer = (options?: (SupabaseQuestionOptionData | ApiQuestionOption)[]) =>
  options?.find((option) => option.is_correct)?.id;

const mapSupabaseQuestion = (question: SupabaseQuestionData): Question => ({
  id: question.id,
  text: question.text,
  type: question.type ?? 'General',
  format: normaliseQuestionFormat(question.format),
  required: question.required,
  assessmentId: question.assessment_id,
  createdAt: question.created_at,
  options: MULTIPLE_CHOICE_FORMATS.has(question.format)
    ? question.options?.map(mapOption)
    : undefined,
  correctAnswer: MULTIPLE_CHOICE_FORMATS.has(question.format)
    ? extractCorrectAnswer(question.options)
    : undefined,
});

const mapApiQuestion = (question: ApiQuestion): Question => ({
  id: question.id,
  text: question.text,
  type: question.type ?? 'General',
  format: normaliseQuestionFormat(question.format),
  required: question.required,
  assessmentId: question.assessment_id,
  createdAt: question.created_at,
  options: question.options && question.options.length > 0
    ? question.options.map(mapOption)
    : undefined,
  correctAnswer: extractCorrectAnswer(question.options),
});

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

export interface CandidateSummary {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  avatarChar: string;
  scores?: {
    overall: number | null;
    work_sample?: number | null;
    problem_solving?: number | null;
    reliability?: number | null;
    culture_fit?: number | null;
  };
  attempt?: CandidateAttemptSummary;
}

export interface CandidateDetailSummary extends CandidateSummary {
  phone?: string | null;
  telegram?: string | null;
  age?: number | null;
  gender?: string | null;
  education?: string | null;
}

interface SupabaseAssessmentAttempt {
  id: string;
  status: string;
  answered_count: number | null;
  total_questions: number | null;
  progress_percent: number | null;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
}

const mapAttemptSummary = (row?: SupabaseAssessmentAttempt): CandidateAttemptSummary | undefined => {
  if (!row) {
    return undefined;
  }

  const status = (row.status ?? 'not_started') as CandidateAttemptStatus;
  const rawAnswered = Math.max(row.answered_count ?? 0, 0);
  const totalQuestions = Math.max(row.total_questions ?? rawAnswered, 0);
  const isCompletedState = status === 'awaiting_ai' || status === 'completed';

  const answeredCount = isCompletedState ? totalQuestions : rawAnswered;
  const calculatedProgress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const rawProgress = row.progress_percent != null ? Number(row.progress_percent) : calculatedProgress;
  const progressPercent = isCompletedState ? 100 : Math.min(100, Math.max(0, rawProgress));

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

interface SupabaseCandidateProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  band: string | null;
  assessment_attempts?: SupabaseAssessmentAttempt[];
}

interface ProfileUpdates {
  name?: string;
  email?: string;
  role?: string;
  band?: string;
}

interface SupabaseRoleData {
  target_role: string;
  duration?: number;
}

interface SupabaseAnalyticsUser {
  id: string;
  name: string;
  band: string | null;
}

interface SupabaseAnalyticsAssessment {
  target_role: string;
}

interface SupabaseAnalyticsData {
  total_score: number | null;
  user: SupabaseAnalyticsUser | null;
  assessment: SupabaseAnalyticsAssessment | null;
}

interface SupabaseAnalyticsRow {
  total_score: number | null;
  assessment: SupabaseAnalyticsAssessment[] | null;
  user: SupabaseAnalyticsUser[] | null;
}

// ===============================================
// === C�C H�M API CHO CH?C NANG LANDING PAGE ===
// ===============================================

/**
 * L?y d? li?u trang landing page t? database.
 */
export const getLandingPageData = async (): Promise<LandingPage> => {
  const { data, error } = await supabase
    .from('landing_page')
    .select('*')
    .single();

  if (error) {
    console.error('Lỗi khi tải dữ liệu landing page:', error);
    throw new Error('Không thể tải dữ liệu landing page.');
  }
  return data as LandingPage;
};

/**
 * C?p nh?t d? li?u trang landing page v�o database.
 * @param data D? li?u c?n c?p nh?t.
 */
export const updateLandingPageData = async (data: Partial<LandingPage>) => {
  const { error } = await supabase
    .from('landing_page')
    .update(data)
    .eq('id', 1);

  if (error) {
    console.error('Lỗi khi lưu dữ liệu landing page:', error);
    throw new Error('Không thể lưu dữ liệu landing page.');
  }
};

// ==================================================
// === C�C H�M API CHO CH?C NANG QU?N L� C�U H?I ===
// ==================================================

/**
 * L?y danh s�ch c�c vai tr� (v? tr� c�ng vi?c) duy nh?t t? database.
 */
export const getRoles = async (): Promise<RoleSummary[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select('target_role, duration');

  if (error) {
    console.error('L?i khi t?i danh s�ch vai tr�:', error);
    return [];
  }

  const roles = (data as (SupabaseRoleData & { duration?: number })[]) ?? [];
  const roleMap = new Map<string, number>();

  roles.forEach((item) => {
    if (!item.target_role) {
      return;
    }
    if (!roleMap.has(item.target_role)) {
      roleMap.set(item.target_role, item.duration ?? 1800);
    }
  });

  return Array.from(roleMap.entries()).map(([name, duration]) => ({
    name,
    duration,
  }));
};

/**
 * L?y t?t c? c�u h?i cho m?t vai tr� c? th?.
 * @param role T�n vai tr�.
 */
export const getQuestionsByRole = async (role: string): Promise<Question[]> => {
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('assessments')
    .select('id')
    .eq('target_role', role)
    .single();

  if (assessmentError) {
    console.error(`Lỗi khi tải assessment cho vai trò ${role}:`, assessmentError);
    return [];
  }

  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      text,
      format,
      required,
      assessment_id,
      created_at,
      options:question_options(id, option_text, is_correct)
    `)
    .eq('assessment_id', assessmentData.id);

  if (error) {
    console.error(`Lỗi khi tải câu hỏi cho vai trò ${role}:`, error);
    throw new Error('Không thể tải câu hỏi.');
  }

  return (data as SupabaseQuestionData[]).map(mapSupabaseQuestion);
};

/**
 * T?o m?t c�u h?i m?i v� c�c phuong �n tr? l?i tuong ?ng.
 * @param questionData D? li?u c�u h?i.
 * @param targetRole Vai tr� c?a c�u h?i.
 * @returns Promise<Question>
 */
export const createQuestion = async (questionData: QuestionDraft, targetRole: string): Promise<Question> => {
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id')
    .eq('target_role', targetRole)
    .single();

  if (assessmentError) {
    console.error('Kh�ng t�m th?y b�i d�nh gi� cho vai tr� n�y.');
    throw new Error('Kh�ng th? t?o c�u h?i.');
  }

  const { data: newQuestion, error: questionError } = await supabase
    .from('questions')
    .insert([{
      text: questionData.text,
      format: questionData.format,
      required: questionData.required,
      assessment_id: assessment.id,
    }])
    .select('id, text, format, required, assessment_id, created_at')
    .single();

  if (questionError) {
    console.error('L?i khi t?o c�u h?i:', questionError);
    throw new Error('Kh�ng th? t?o c�u h?i.');
  }

  if (MULTIPLE_CHOICE_FORMATS.has(questionData.format) && questionData.options?.length) {
    const optionsData = questionData.options.map(option => ({
      question_id: newQuestion.id,
      option_text: option.text,
      is_correct: option.id === questionData.correctAnswer || option.isCorrect === true,
    }));

    const { error: optionsError } = await supabase
      .from('question_options')
      .insert(optionsData);

    if (optionsError) {
      console.error('L?i khi t?o phuong �n tr? l?i:', optionsError);
      throw new Error('Kh�ng th? t?o phuong �n tr? l?i.');
    }
  }

  return {
    id: newQuestion.id,
    text: newQuestion.text,
    type: questionData.type ?? 'General',
    format: normaliseQuestionFormat(newQuestion.format),
    required: newQuestion.required,
    assessmentId: newQuestion.assessment_id,
    createdAt: newQuestion.created_at,
    options: questionData.options,
    correctAnswer: questionData.correctAnswer,
  };
};

/**
 * C?p nh?t th�ng tin c?a m?t c�u h?i v� c�c phuong �n tr? l?i.
 * @param questionData D? li?u c�u h?i c?n c?p nh?t.
 * @returns Promise<void>
 */
export const updateQuestion = async (questionData: Partial<Question>): Promise<void> => {
  if (!questionData.id) {
    console.error('Missing question ID for update');
    throw new Error('Kh�ng th? c?p nh?t c�u h?i: Thi?u ID.');
  }

  const { error: questionError } = await supabase
    .from('questions')
    .update({
      text: questionData.text,
      format: questionData.format,
      required: questionData.required,
    })
    .eq('id', questionData.id);

  if (questionError) {
    console.error('L?i khi c?p nh?t c�u h?i:', questionError);
    throw new Error('Kh�ng th? c?p nh?t c�u h?i.');
  }

  const isMultipleChoice = questionData.format ? MULTIPLE_CHOICE_FORMATS.has(questionData.format) : false;
  const hasOptions = Array.isArray(questionData.options) && questionData.options.length > 0;

  if (isMultipleChoice && hasOptions) {
    await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionData.id);

    const optionsToInsert = questionData.options
      .filter(opt => opt.text.trim())
      .map(opt => ({
        question_id: questionData.id,
        option_text: opt.text,
        is_correct: opt.id === questionData.correctAnswer || opt.isCorrect === true,
      }));

    if (optionsToInsert.length === 0) {
      console.error('No valid options provided for multiple_choice question');
      throw new Error('Kh�ng th? c?p nh?t c�u h?i: C?n �t nh?t m?t phuong �n tr? l?i.');
    }

    const { error: insertError } = await supabase
      .from('question_options')
      .insert(optionsToInsert);

    if (insertError) {
      console.error('L?i khi th�m options m?i:', insertError);
      throw new Error('Kh�ng th? c?p nh?t c�c phuong �n tr? l?i.');
    }
  } else {
    await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionData.id);
  }
};

/**
 * X�a m?t c�u h?i kh?i database.
 * @param questionId ID c?a c�u h?i.
 * @returns Promise<void>
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('L?i khi x�a c�u h?i:', error);
    throw new Error('Kh�ng th? x�a c�u h?i.');
  }
};

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

const buildQuestionQuery = (params: FetchQuestionsParams = {}) => ({
  limit: params.limit,
  offset: params.offset,
  include_options: params.includeOptions ? 'true' : undefined,
});

export const fetchQuestionsFromApi = async (params: FetchQuestionsParams = {}): Promise<QuestionListResult> => {
  const response = await apiClient.get<ApiResponseEnvelope<ApiQuestion[]>>('api/questions', {
    query: buildQuestionQuery(params),
  });

  return {
    items: response.data.map(mapApiQuestion),
    count: response.count,
    totalCount: response.totalCount,
    pagination: response.pagination,
  };
};

export const fetchQuestionByIdFromApi = async (questionId: string, includeOptions = false): Promise<Question> => {
  const response = await apiClient.get<ApiResponseEnvelope<ApiQuestion>>(`api/questions/${questionId}`, {
    query: includeOptions ? { include_options: 'true' } : undefined,
  });

  return mapApiQuestion(response.data);
};

interface UpsertQuestionOptionPayload {
  option_text: string;
  is_correct?: boolean;
}

interface UpsertQuestionPayload {
  text: string;
  type: string;
  format: string;
  required: boolean;
  assessment_id?: string | null;
  options?: UpsertQuestionOptionPayload[];
}

export const createQuestionViaApi = async (payload: UpsertQuestionPayload): Promise<Question> => {
  const response = await apiClient.post<ApiResponseEnvelope<ApiQuestion>>('api/questions', payload);
  return mapApiQuestion(response.data);
};

export const updateQuestionViaApi = async (questionId: string, payload: Partial<UpsertQuestionPayload>): Promise<Question> => {
  const response = await apiClient.put<ApiResponseEnvelope<ApiQuestion>>(`api/questions/${questionId}`, payload);
  return mapApiQuestion(response.data);
};

export const deleteQuestionViaApi = async (questionId: string): Promise<void> => {
  await apiClient.delete<ApiResponseEnvelope<null>>(`api/questions/${questionId}`);
};

export const createQuestionOptionViaApi = async (questionId: string, payload: UpsertQuestionOptionPayload): Promise<QuestionOption> => {
  const response = await apiClient.post<ApiResponseEnvelope<ApiQuestionOption>>(`api/questions/${questionId}/options`, payload);
  return mapOption(response.data);
};

export const updateQuestionOptionViaApi = async (optionId: string, payload: UpsertQuestionOptionPayload): Promise<QuestionOption> => {
  const response = await apiClient.put<ApiResponseEnvelope<ApiQuestionOption>>(`api/questions/options/${optionId}`, payload);
  return mapOption(response.data);
};

export const deleteQuestionOptionViaApi = async (optionId: string): Promise<void> => {
  await apiClient.delete<ApiResponseEnvelope<null>>(`api/questions/options/${optionId}`);
};

/**
 * T?o m?t vai tr� m?i b?ng c�ch ch�n m?t c�u h?i m?c d?nh.
 * @param roleName T�n vai tr� m?i.
 * @returns Promise<void>
 */
export const createRole = async (roleName: string, durationSeconds: number): Promise<RoleSummary> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const { data, error: assessmentError } = await supabase
    .from('assessments')
    .insert([
      {
        target_role: roleName,
        title: `��nh gi� cho ${roleName}`,
        description: `B�i d�nh gi� d�nh ri�ng cho v? tr� c�ng vi?c ${roleName}`,
        duration: durationSeconds,
        is_active: true,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10)
      }
    ])
    .select('target_role, duration')
    .single();

  if (assessmentError) {
    console.error('L?i khi t?o b�i d�nh gi� cho vai tr� m?i:', assessmentError);
    throw new Error('Kh�ng th? t?o vai tr� m?i.');
  }

  const insertedDuration = data?.duration ?? durationSeconds;
  return {
    name: data?.target_role ?? roleName,
    duration: insertedDuration,
  };
};

export const updateRoleDuration = async (roleName: string, durationSeconds: number): Promise<void> => {
  const { error } = await supabase
    .from('assessments')
    .update({ duration: durationSeconds })
    .eq('target_role', roleName);

  if (error) {
    console.error('L?i khi c?p nh?t th?i lu?ng cho vai tr�:', error);
    throw new Error('Kh�ng th? c?p nh?t th?i lu?ng b�i d�nh gi�.');
  }
};

/**
 * X�a m?t vai tr� v� t?t c? c�c c�u h?i li�n quan.
 * @param roleName T�n vai tr� c?n x�a.
 * @returns Promise<void>
 */
export const deleteRole = async (roleName: string): Promise<void> => {
  const { error: assessmentError } = await supabase
    .from('assessments')
    .delete()
    .eq('target_role', roleName);
  
  if (assessmentError) {
    console.error('L?i khi x�a vai tr�:', assessmentError);
    throw new Error('Kh�ng th? x�a vai tr�.');
  }
};

// ===================================================
// === C�C H�M API CHO CH?C NANG PH�N T�CH/B�O C�O ===
// ===================================================

/**
 * L?y d? li?u c?n thi?t cho trang ph�n t�ch v� b�o c�o.
 * @returns Promise<any>
 */
export const getAnalyticsData = async () => {
  const { data, error } = await supabase
    .from('results')
    .select(`
      total_score,
      assessment:assessments(target_role),
      user:profiles(id, name, band)
    `);

  if (error) {
    console.error('L?i khi t?i d? li?u ph�n t�ch:', error);
    throw new Error('Kh�ng th? t?i d? li?u ph�n t�ch.');
  }

  const formattedData = (data as SupabaseAnalyticsRow[])
    .filter(row => row.user && row.user.length > 0)
    .map(row => {
      const user = row.user![0];
      const assessment = row.assessment?.[0];
      return {
        id: user.id,
        name: user.name ?? 'Unknown',
        role: assessment?.target_role ?? 'Unknown',
        band: user.band,
        scores: {
          overall: row.total_score,
        },
        status: 'completed' as const,
      };
    });

  return formattedData;
};

// =================================================
// === C�C H�M API CHO CH?C NANG ?NG VI�N/H? SO ===
// =================================================

/**
 * C?p nh?t th�ng tin h? so ?ng vi�n.
 * @param candidateId ID c?a ?ng vi�n.
 * @param updates D? li?u c?n c?p nh?t.
 * @returns Promise<void>
 */
export const updateCandidateInfo = async (candidateId: string, updates: ProfileUpdates): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', candidateId);

  if (error) {
    console.error('L?i khi c?p nh?t th�ng tin ?ng vi�n:', error);
    throw new Error('Kh�ng th? c?p nh?t th�ng tin ?ng vi�n.');
  }
};

export const getCandidateDetails = async (candidateId: string): Promise<CandidateDetailSummary> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
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
      )
    `)
    .eq('id', candidateId)

    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .limit(1, { foreignTable: 'assessment_attempts' })
    .single();

  if (error) {
    console.error('L?i khi t?i d? li?u chi ti?t ?ng vi�n:', error);
    throw new Error('Kh�ng th? t?i d? li?u chi ti?t ?ng vi�n.');
  }

  const attempt = mapAttemptSummary(data?.assessment_attempts?.[0]);

  return {
    id: data.id,
    fullName: data.name ?? null,
    email: data.email ?? null,
    role: data.role ?? null,
    band: data.band ?? null,
    avatarChar: (data.name ?? '?').charAt(0).toUpperCase(),
    attempt,
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
    .select(`
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
      )
    `)
    .order('created_at', { foreignTable: 'assessment_attempts', ascending: false })
    .limit(1, { foreignTable: 'assessment_attempts' });

  if (error) {
    console.error('L?i khi t?i d? li?u ?ng vi�n:', error);
    throw new Error('Kh�ng th? t?i d? li?u ?ng vi�n.');
  }

  const rows = (data as SupabaseCandidateProfile[]) ?? [];

  return rows.map((item) => {
    const attempt = mapAttemptSummary(item.assessment_attempts?.[0]);

    return {
      id: item.id,
      fullName: item.name ?? null,
      email: item.email ?? null,
      role: item.role ?? null,
      band: item.band ?? null,
      avatarChar: (item.name ?? '?').charAt(0).toUpperCase(),
        attempt,
    } satisfies CandidateSummary;
  });
};












