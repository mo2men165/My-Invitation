// src/lib/api/compare.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CompareItem {
  _id?: string;
  designId: string;
  packageType: 'classic' | 'premium' | 'vip'; // Required for compare
  addedAt?: string;
}

export interface CompareApiResponse<T = any> {
  success: boolean;
  message?: string;
  compareList?: CompareItem[];
  compareItem?: CompareItem;
  compareCount?: number;
  count?: number;
  itemsRemoved?: number;
  inCompare?: boolean;
  isFull?: boolean;
  source?: 'cache' | 'database';
  error?: { message: string };
}

class CompareAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getCompareList(): Promise<CompareApiResponse<CompareItem[]>> {
    const response = await fetch(`${API_BASE_URL}/api/compare`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب قائمة المقارنة');
    }

    return result;
  }

  async addToCompare(designId: string, packageType: 'classic' | 'premium' | 'vip'): Promise<CompareApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/compare`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ designId, packageType }), // Include required packageType
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة التصميم لقائمة المقارنة');
    }

    return result;
  }

  async replaceCompareList(items: { designId: string; packageType: 'classic' | 'premium' | 'vip' }[]): Promise<CompareApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/compare/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ items }), // Send array of items with required packageType
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث قائمة المقارنة');
    }

    return result;
  }

  
    async removeFromCompare(designId: string): Promise<CompareApiResponse> {
      const response = await fetch(`${API_BASE_URL}/api/compare/${designId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في حذف التصميم من قائمة المقارنة');
      }
  
      return result;
    }
  
    async clearCompareList(): Promise<CompareApiResponse> {
      const response = await fetch(`${API_BASE_URL}/api/compare`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في مسح قائمة المقارنة');
      }
  
      return result;
    }
  
    async checkCompare(designId: string): Promise<CompareApiResponse> {
      const response = await fetch(`${API_BASE_URL}/api/compare/check/${designId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في فحص قائمة المقارنة');
      }
  
      return result;
    }
  
    async getCompareCount(): Promise<CompareApiResponse> {
      const response = await fetch(`${API_BASE_URL}/api/compare/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في جلب عدد عناصر المقارنة');
      }
  
      return result;
    }
  
    async isCompareFull(): Promise<CompareApiResponse> {
      const response = await fetch(`${API_BASE_URL}/api/compare/full`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
  
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في فحص قائمة المقارنة');
      }
  
      return result;
    }
  }
  
  export const compareAPI = new CompareAPI();