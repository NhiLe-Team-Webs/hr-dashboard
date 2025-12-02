import { httpClient } from './httpClient';

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  role: string;
  duration_minutes: number;
  passing_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  target_role: string;
  duration?: number; // Duration in minutes
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface AssessmentListResponse {
  assessments: Assessment[];
}

/**
 * Get all assessments
 */
export const getAssessments = async (): Promise<Assessment[]> => {
  const response = await httpClient.get<{ assessments: Assessment[] }>('/hr/assessments');
  return response.assessments;
};

/**
 * Get assessment by ID
 */
export const getAssessmentById = async (id: string): Promise<{ assessment: Assessment; questionCount: number }> => {
  const response = await httpClient.get<{ assessment: Assessment; questionCount: number }>(`/hr/assessments/${id}`);
  return response;
};

/**
 * Create new assessment
 */
export const createAssessment = async (request: CreateAssessmentRequest): Promise<Assessment> => {
  const response = await httpClient.post<{ assessment: Assessment }>('/hr/assessments', request);
  return response.assessment;
};

/**
 * Update assessment
 */
export const updateAssessment = async (id: string, request: Partial<CreateAssessmentRequest>): Promise<Assessment> => {
  const response = await httpClient.put<{ assessment: Assessment }>(`/hr/assessments/${id}`, request);
  return response.assessment;
};

/**
 * Delete assessment
 */
export const deleteAssessment = async (id: string): Promise<void> => {
  await httpClient.delete(`/hr/assessments/${id}`);
};