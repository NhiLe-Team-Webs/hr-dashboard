import { supabase } from '../supabaseClient';
import type { Question } from '../../types/question';
import type { QuestionDraft } from './types';
import {
  mapSupabaseQuestion,
  normaliseQuestionFormat,
  MULTIPLE_CHOICE_FORMATS,
  type SupabaseQuestionData,
} from './questionMappers';

export const getQuestionsByRole = async (role: string): Promise<Question[]> => {
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('interview_assessments')
    .select('id')
    .eq('target_role', role)
    .single();

  if (assessmentError || !assessmentData) {
    console.error(`Failed to load assessment for role ${role}:`, assessmentError);
    return [];
  }

  const { data, error } = await supabase
    .from('interview_questions')
    .select(
      `
        id,
        text,
        format,
        required,
        assessment_id,
        created_at,
        options:interview_question_options(id, option_text, is_correct)
      `,
    )
    .eq('assessment_id', assessmentData.id);

  if (error) {
    console.error(`Failed to load questions for role ${role}:`, error);
    throw new Error('Unable to load questions.');
  }

  return (data as SupabaseQuestionData[]).map(mapSupabaseQuestion);
};

export const createQuestion = async (questionData: QuestionDraft, targetRole: string): Promise<Question> => {
  const { data: assessment, error: assessmentError } = await supabase
    .from('interview_assessments')
    .select('id')
    .eq('target_role', targetRole)
    .single();

  if (assessmentError || !assessment) {
    console.error('Assessment not found for role:', targetRole, assessmentError);
    throw new Error('Unable to find assessment for the provided role.');
  }

  const { data: newQuestion, error: questionError } = await supabase
    .from('interview_questions')
    .insert([
      {
        text: questionData.text,
        format: questionData.format,
        required: questionData.required,
        assessment_id: assessment.id,
      },
    ])
    .select('id, text, format, required, assessment_id, created_at')
    .single();

  if (questionError || !newQuestion) {
    console.error('Failed to create question:', questionError);
    throw new Error('Unable to create question.');
  }

  if (MULTIPLE_CHOICE_FORMATS.has(questionData.format) && questionData.options?.length) {
    const optionsData = questionData.options.map((option) => ({
      question_id: newQuestion.id,
      option_text: option.text,
      is_correct: option.id === questionData.correctAnswer || option.isCorrect === true,
    }));

    const { error: optionsError } = await supabase
      .from('interview_question_options')
      .insert(optionsData);

    if (optionsError) {
      console.error('Failed to create question options:', optionsError);
      throw new Error('Unable to create question options.');
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

export const updateQuestion = async (questionData: Partial<Question>): Promise<void> => {
  if (!questionData.id) {
    console.error('Cannot update question without id');
    throw new Error('Unable to update question: missing id.');
  }

  const { error: questionError } = await supabase
    .from('interview_questions')
    .update({
      text: questionData.text,
      format: questionData.format,
      required: questionData.required,
    })
    .eq('id', questionData.id);

  if (questionError) {
    console.error('Failed to update question:', questionError);
    throw new Error('Unable to update question.');
  }

  const isMultipleChoice = questionData.format ? MULTIPLE_CHOICE_FORMATS.has(questionData.format) : false;
  const hasOptions = Array.isArray(questionData.options) && questionData.options.length > 0;

  if (isMultipleChoice && hasOptions) {
    await supabase
      .from('interview_question_options')
      .delete()
      .eq('question_id', questionData.id);

    const optionsToInsert = questionData.options
      .filter((option) => option.text.trim())
      .map((option) => ({
        question_id: questionData.id,
        option_text: option.text,
        is_correct: option.id === questionData.correctAnswer || option.isCorrect === true,
      }));

    if (optionsToInsert.length === 0) {
      console.error('Multiple choice question requires at least one option');
      throw new Error('Unable to update question: at least one option is required.');
    }

    const { error: insertError } = await supabase
      .from('interview_question_options')
      .insert(optionsToInsert);

    if (insertError) {
      console.error('Failed to update question options:', insertError);
      throw new Error('Unable to update question options.');
    }
  } else {
    await supabase
      .from('interview_question_options')
      .delete()
      .eq('question_id', questionData.id);
  }
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const { error } = await supabase
    .from('interview_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('Failed to delete question:', error);
    throw new Error('Unable to delete question.');
  }
};
