/**
 * Questions API - Backend Version
 * Uses the centralized backend API instead of direct Supabase access
 */

import { httpClient } from './httpClient';
import type { Question } from '../../types/question';
import type { QuestionDraft } from './types';

/**
 * Get questions by role
 */
export const getQuestionsByRole = async (role?: string): Promise<Question[]> => {
  try {
    const params = role ? { role } : {};
    const response = await httpClient.get<{ questions: unknown[] }>('/hr/questions', params);

    // Map backend response to frontend format
    return response.questions.map((q: unknown) => {
      const question = q as Record<string, unknown>;
      return {
        id: question.id as string,
        text: question.text as string,
        type: (question.type as string) ?? 'General',
        format: question.format as import('../../types/question').QuestionFormat,
        required: (question.required as boolean) ?? true,
        assessmentId: question.assessment_id as string,
        createdAt: question.created_at as string,
        options: (question.options as unknown[])?.map((opt: unknown) => {
          const option = opt as Record<string, unknown>;
          return {
            id: option.id as string,
            text: option.option_text as string,
            optionText: option.option_text as string,
            isCorrect: (option.is_correct as boolean) ?? false,
          };
        }),
        correctAnswer: question.correct_answer as string,
        points: question.points as number,
        role: question.role as string,
      };
    });
  } catch (error) {
    console.error('Failed to fetch questions from backend:', error);
    throw new Error('Unable to load questions');
  }
};

/**
 * Create a new question
 */
export const createQuestion = async (questionData: QuestionDraft, targetRole: string): Promise<Question> => {
  try {
    console.log('Creating question with data:', { questionData, targetRole });

    const payload = {
      text: questionData.text,
      format: questionData.format === 'text' ? 'open_ended' : questionData.format,
      role: targetRole,
      required: questionData.required,
      options: questionData.options?.map((opt) => ({
        text: opt.text,
        is_correct: opt.id === questionData.correctAnswer || opt.isCorrect === true,
      })),
      correct_answer: questionData.correctAnswer,
      duration: questionData.duration,
      points: questionData.points,
    };

    console.log('Sending payload to backend:', payload);
    const response = await httpClient.post<{ question: Record<string, unknown> }>('/hr/questions', payload);
    console.log('Received response from backend:', response);

    const question = response.question;
    const result = {
      id: question.id as string,
      text: question.text as string,
      type: questionData.type ?? 'General',
      format: question.format as import('../../types/question').QuestionFormat,
      required: (question.required as boolean) ?? true,
      assessmentId: question.assessment_id as string,
      createdAt: question.created_at as string,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      points: (question.points as number) || questionData.points, // Use returned points or fallback to requested
    };

    console.log('Returning question result:', result);
    return result;
  } catch (error) {
    console.error('Failed to create question:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unable to create question');
  }
};

/**
 * Update an existing question
 */
export const updateQuestion = async (questionData: Partial<Question>): Promise<void> => {
  try {
    if (!questionData.id) {
      throw new Error('Question ID is required');
    }

    const payload: Record<string, unknown> = {
      text: questionData.text,
      format: questionData.format === 'text' ? 'open_ended' : questionData.format,
      required: questionData.required,
    };

    // Add options if it's a multiple choice question
    if (questionData.options && questionData.options.length > 0) {
      payload.options = questionData.options.map((opt) => ({
        text: opt.text,
        is_correct: opt.id === questionData.correctAnswer || opt.isCorrect === true,
      }));
    }

    if (questionData.correctAnswer) {
      payload.correct_answer = questionData.correctAnswer;
    }

    if (questionData.points !== undefined) {
      payload.points = questionData.points;
    }

    await httpClient.put(`/hr/questions/${questionData.id}`, payload);
  } catch (error) {
    console.error('Failed to update question:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unable to update question');
  }
};

/**
 * Delete a question
 */
export const deleteQuestion = async (questionId: string): Promise<void> => {
  try {
    await httpClient.delete(`/hr/questions/${questionId}`);
  } catch (error) {
    console.error('Failed to delete question:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unable to delete question');
  }
};
