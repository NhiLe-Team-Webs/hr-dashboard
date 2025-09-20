// src/lib/api.ts

import { supabase } from './supabaseClient';
import { apiClient, PaginatedResponse } from './httpClient';
import { Question, QuestionsByRole, QuestionOption } from '../types/question';
import { LandingPage } from '../types/landingPage';

// ===========================================
// === INTERFACES ĐỂ ĐẢM BẢO AN TOÀN KIỂU ===
// ===========================================

// Interfaces cho hàm getQuestionsByRole
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

interface CandidateData {
  id: string;
  name: string;
  email: string;
  role: string;
  band: string;
  results: { total_score: number | null }[];
}

// Interfaces cho hàm updateCandidateInfo
interface ProfileUpdates {
  name?: string;
  email?: string;
  role?: string;
  band?: string;
}

// Interfaces cho hàm getRoles
interface SupabaseRoleData {
  target_role: string;
}

// Interfaces cho hàm getAnalyticsData
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

// Interfaces cho hàm getCandidates
interface SupabaseCandidateProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  band: string | null;
  results: { total_score: number | null }[];
}


// Interfaces cho hàm getCandidateDetails
interface SupabaseCandidateDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  band: string | null;
  scores: { total_score: number | null }[];
}


// ===============================================
// === CÁC HÀM API CHO CHỨC NĂNG LANDING PAGE ===
// ===============================================

/**
 * Lấy dữ liệu trang landing page từ database.
 */
export const getLandingPageData = async (): Promise<LandingPage> => {
  const { data, error } = await supabase
    .from('landing_page')
    .select('*')
    .single();

  if (error) {
    console.error('Lá»—i khi táº£i dá»¯ liá»‡u landing page:', error);
    throw new Error('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u landing page.');
  }
  return data as LandingPage;
};

/**
 * Cập nhật dữ liệu trang landing page vào database.
 * @param data Dữ liệu cần cập nhật.
 */
export const updateLandingPageData = async (data: Partial<LandingPage>) => {
  const { error } = await supabase
    .from('landing_page')
    .update(data)
    .eq('id', 1);

  if (error) {
    console.error('Lá»—i khi lÆ°u dá»¯ liá»‡u landing page:', error);
    throw new Error('KhÃ´ng thá»ƒ lÆ°u dá»¯ liá»‡u landing page.');
  }
};

// ==================================================
// === CÁC HÀM API CHO CHỨC NĂNG QUẢN LÝ CÂU HỎI ===
// ==================================================

/**
 * Lấy danh sách các vai trò (vị trí công việc) duy nhất từ database.
 */
export const getRoles = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('assessments')
    .select('target_role');

  if (error) {
    console.error('Lá»—i khi táº£i danh sÃ¡ch vai trÃ²:', error);
    return [];
  }
  
  const roles = data as SupabaseRoleData[];
  const distinctRoles = [...new Set(roles.map(item => item.target_role))];
  return distinctRoles;
};

/**
 * Lấy tất cả câu hỏi cho một vai trò cụ thể.
 * @param role Tên vai trò.
 */
export const getQuestionsByRole = async (role: string): Promise<Question[]> => {
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('assessments')
    .select('id')
    .eq('target_role', role)
    .single();

  if (assessmentError) {
    console.error(`Lá»—i khi táº£i assessment cho vai trÃ² ${role}:`, assessmentError);
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
    console.error(`Lá»—i khi táº£i cÃ¢u há»i cho vai trÃ² ${role}:`, error);
    throw new Error('KhÃ´ng thá»ƒ táº£i cÃ¢u há»i.');
  }

  return (data as SupabaseQuestionData[]).map(mapSupabaseQuestion);
};

/**
 * Tạo một câu hỏi mới và các phương án trả lời tương ứng.
 * @param questionData Dữ liệu câu hỏi.
 * @param targetRole Vai trò của câu hỏi.
 * @returns Promise<Question>
 */
export const createQuestion = async (questionData: QuestionDraft, targetRole: string): Promise<Question> => {
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id')
    .eq('target_role', targetRole)
    .single();

  if (assessmentError) {
    console.error('Không tìm thấy bài đánh giá cho vai trò này.');
    throw new Error('Không thể tạo câu hỏi.');
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
    console.error('Lỗi khi tạo câu hỏi:', questionError);
    throw new Error('Không thể tạo câu hỏi.');
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
      console.error('Lỗi khi tạo phương án trả lời:', optionsError);
      throw new Error('Không thể tạo phương án trả lời.');
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
 * Cập nhật thông tin của một câu hỏi và các phương án trả lời.
 * @param questionData Dữ liệu câu hỏi cần cập nhật.
 * @returns Promise<void>
 */
export const updateQuestion = async (questionData: Partial<Question>): Promise<void> => {
  if (!questionData.id) {
    console.error('Missing question ID for update');
    throw new Error('Không thể cập nhật câu hỏi: Thiếu ID.');
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
    console.error('Lỗi khi cập nhật câu hỏi:', questionError);
    throw new Error('Không thể cập nhật câu hỏi.');
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
      throw new Error('Không thể cập nhật câu hỏi: Cần ít nhất một phương án trả lời.');
    }

    const { error: insertError } = await supabase
      .from('question_options')
      .insert(optionsToInsert);

    if (insertError) {
      console.error('Lỗi khi thêm options mới:', insertError);
      throw new Error('Không thể cập nhật các phương án trả lời.');
    }
  } else {
    await supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionData.id);
  }
};

/**
 * Xóa một câu hỏi khỏi database.
 * @param questionId ID của câu hỏi.
 * @returns Promise<void>
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Lỗi khi xóa câu hỏi:', error);
    throw new Error('Không thể xóa câu hỏi.');
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
 * Tạo một vai trò mới bằng cách chèn một câu hỏi mặc định.
 * @param roleName Tên vai trò mới.
 * @returns Promise<void>
 */
export const createRole = async (roleName: string): Promise<void> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const { error: assessmentError } = await supabase
    .from('assessments')
    .insert([
      { 
        target_role: roleName, 
        title: `Đánh giá cho ${roleName}`,
        description: `Bài đánh giá dành riêng cho vị trí công việc ${roleName}`,
        duration: 1800, 
        is_active: true,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10)
      }
    ]);
  
  if (assessmentError) {
    console.error('Lỗi khi tạo bài đánh giá cho vai trò mới:', assessmentError);
    throw new Error('Không thể tạo vai trò mới.');
  }
};

/**
 * Xóa một vai trò và tất cả các câu hỏi liên quan.
 * @param roleName Tên vai trò cần xóa.
 * @returns Promise<void>
 */
export const deleteRole = async (roleName: string): Promise<void> => {
  const { error: assessmentError } = await supabase
    .from('assessments')
    .delete()
    .eq('target_role', roleName);
  
  if (assessmentError) {
    console.error('Lỗi khi xóa vai trò:', assessmentError);
    throw new Error('Không thể xóa vai trò.');
  }
};

// ===================================================
// === CÁC HÀM API CHO CHỨC NĂNG PHÂN TÍCH/BÁO CÁO ===
// ===================================================

/**
 * Lấy dữ liệu cần thiết cho trang phân tích và báo cáo.
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
    console.error('Lỗi khi tải dữ liệu phân tích:', error);
    throw new Error('Không thể tải dữ liệu phân tích.');
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
// === CÁC HÀM API CHO CHỨC NĂNG ỨNG VIÊN/HỒ SƠ ===
// =================================================

/**
 * Cập nhật thông tin hồ sơ ứng viên.
 * @param candidateId ID của ứng viên.
 * @param updates Dữ liệu cần cập nhật.
 * @returns Promise<void>
 */
export const updateCandidateInfo = async (candidateId: string, updates: ProfileUpdates): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', candidateId);

  if (error) {
    console.error('Lỗi khi cập nhật thông tin ứng viên:', error);
    throw new Error('Không thể cập nhật thông tin ứng viên.');
  }
};

export const getCandidateDetails = async (candidateId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      scores:results(total_score)
    `)
    .eq('id', candidateId)
    .single();

  if (error) {
    console.error('Lỗi khi tải dữ liệu chi tiết ứng viên:', error);
    throw new Error('Không thể tải dữ liệu chi tiết ứng viên.');
  }

  return data;
};

export const getCandidates = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      role,
      band,
      results(total_score)
    `);

  if (error) {
    console.error('Lỗi khi tải dữ liệu ứng viên:', error);
    throw new Error('Không thể tải dữ liệu ứng viên.');
  }
  const formattedData = (data as SupabaseCandidateProfile[]).map(item => ({
    id: item.id,
    fullName: item.name,
    email: item.email,
    role: item.role,
    band: item.band,
    avatarChar: item.name ? item.name.charAt(0).toUpperCase() : '?',
    scores: {
      overall: item.results.length > 0 ? item.results[0].total_score : null,
    },
    status: item.results.length > 0 ? 'completed' : 'in_progress',
    startTime: new Date(),
    phone: 'N/A',
    telegram: 'N/A',
  }));

  return formattedData;
};
