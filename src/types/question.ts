// src/types/question.ts 

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: string;
  format: 'text' | 'multiple_choice';
  required: boolean;
  points: number;
  options?: Option[];
  correctAnswer?: string;
}

// Thêm interface mới này
export interface QuestionsByRole {
  [role: string]: Question[];
}