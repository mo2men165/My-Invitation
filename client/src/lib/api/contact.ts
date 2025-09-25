// src/lib/api/contact.ts
import { apiClient } from '../axios';

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  error?: {
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface SubjectsResponse {
  success: boolean;
  data: string[];
}

export const contactAPI = {
  /**
   * Submit contact form
   */
  async submitForm(formData: ContactFormData): Promise<ContactResponse> {
    const response = await apiClient.post<ContactResponse>('/api/contact/submit', formData);
    return response.data;
  },

  /**
   * Get available contact subjects
   */
  async getSubjects(): Promise<string[]> {
    const response = await apiClient.get<SubjectsResponse>('/api/contact/subjects');
    return response.data.data;
  }
};
