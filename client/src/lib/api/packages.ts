// client/src/lib/api/packages.ts
import { InvitationDesign } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const packagesAPI = {
  async getImages(): Promise<InvitationDesign[]> {
    const response = await fetch(`${API_URL}/api/packages/images`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب تصاميم الباقات');
    }

    return result.data;
  }
};
