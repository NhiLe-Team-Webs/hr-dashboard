import { apiClient } from '../httpClient';
import type { Question, QuestionOption } from '../../types/question';
import {
  mapApiQuestion,
  type ApiQuestion,
  type ApiQuestionOption,
} from './questionMappers';
import type {
  FetchQuestionsParams,
  QuestionListResult,
  UpsertQuestionPayload,
  UpsertQuestionOptionPayload,
} from './types';

interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  totalCount?: number;
  pagination?: unknown;
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
    pagination: response.pagination as QuestionListResult['pagination'],
  };
};

export const fetchQuestionByIdFromApi = async (questionId: string, includeOptions = false): Promise<Question> => {
  const response = await apiClient.get<ApiResponseEnvelope<ApiQuestion>>(`api/questions/${questionId}`, {
    query: includeOptions ? { include_options: 'true' } : undefined,
  });

  return mapApiQuestion(response.data);
};

export const createQuestionViaApi = async (payload: UpsertQuestionPayload): Promise<Question> => {
  const response = await apiClient.post<ApiResponseEnvelope<ApiQuestion>>('api/questions', payload);
  return mapApiQuestion(response.data);
};

export const updateQuestionViaApi = async (
  questionId: string,
  payload: Partial<UpsertQuestionPayload>,
): Promise<Question> => {
  const response = await apiClient.put<ApiResponseEnvelope<ApiQuestion>>(`api/questions/${questionId}`, payload);
  return mapApiQuestion(response.data);
};

export const deleteQuestionViaApi = async (questionId: string): Promise<void> => {
  await apiClient.delete<ApiResponseEnvelope<null>>(`api/questions/${questionId}`);
};

export const createQuestionOptionViaApi = async (
  questionId: string,
  payload: UpsertQuestionOptionPayload,
): Promise<QuestionOption> => {
  const response = await apiClient.post<ApiResponseEnvelope<ApiQuestionOption>>(
    `api/questions/${questionId}/options`,
    payload,
  );
  return {
    id: response.data.id,
    text: response.data.option_text,
    optionText: response.data.option_text,
    isCorrect: response.data.is_correct ?? false,
  };
};

export const updateQuestionOptionViaApi = async (
  optionId: string,
  payload: UpsertQuestionOptionPayload,
): Promise<QuestionOption> => {
  const response = await apiClient.put<ApiResponseEnvelope<ApiQuestionOption>>(
    `api/questions/options/${optionId}`,
    payload,
  );
  return {
    id: response.data.id,
    text: response.data.option_text,
    optionText: response.data.option_text,
    isCorrect: response.data.is_correct ?? false,
  };
};

export const deleteQuestionOptionViaApi = async (optionId: string): Promise<void> => {
  await apiClient.delete<ApiResponseEnvelope<null>>(`api/questions/options/${optionId}`);
};
