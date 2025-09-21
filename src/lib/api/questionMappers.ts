import type { Question, QuestionOption } from '../../types/question';

export const MULTIPLE_CHOICE_FORMATS = new Set(['multiple_choice']);

export interface SupabaseQuestionOptionData {
  id: string;
  option_text: string;
  is_correct: boolean;
}

export interface SupabaseQuestionData {
  id: string;
  text: string;
  type?: string;
  format: string;
  required: boolean;
  assessment_id: string | null;
  created_at?: string;
  options?: SupabaseQuestionOptionData[];
}

export interface ApiQuestionOption {
  id: string;
  option_text: string;
  is_correct?: boolean;
}

export interface ApiQuestion {
  id: string;
  text: string;
  type: string;
  format: string;
  required: boolean;
  assessment_id: string | null;
  created_at?: string;
  options?: ApiQuestionOption[];
}

export const normaliseQuestionFormat = (format?: string | null): Question['format'] => {
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

export const mapSupabaseQuestion = (question: SupabaseQuestionData): Question => ({
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

export const mapApiQuestion = (question: ApiQuestion): Question => ({
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
