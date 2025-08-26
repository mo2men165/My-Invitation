// src/lib/api/wishlist.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface WishlistItem {
  _id?: string;
  designId: string;
  packageType?: 'classic' | 'premium' | 'vip'; // Optional
  addedAt?: string;
}

export interface WishlistApiResponse<T = any> {
  success: boolean;
  message?: string;
  wishlist?: WishlistItem[];
  wishlistItem?: WishlistItem;
  wishlistCount?: number;
  count?: number;
  addedCount?: number;
  skippedCount?: number;
  itemsRemoved?: number;
  inWishlist?: boolean;
  source?: 'cache' | 'database';
  error?: { message: string };
}

class WishlistAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getWishlist(): Promise<WishlistApiResponse<WishlistItem[]>> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب المفضلة');
    }

    return result;
  }

  async addToWishlist(designId: string, packageType?: 'classic' | 'premium' | 'vip'): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ designId, packageType }), // Include optional packageType
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة التصميم للمفضلة');
    }

    return result;
  }

  async addMultipleToWishlist(items: { designId: string; packageType?: 'classic' | 'premium' | 'vip' }[]): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/bulk`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ items }), // Send array of items with optional packageType
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة التصاميم للمفضلة');
    }

    return result;
  }


  async removeFromWishlist(designId: string): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/${designId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في حذف التصميم من المفضلة');
    }

    return result;
  }

  async clearWishlist(): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في مسح المفضلة');
    }

    return result;
  }

  async checkWishlist(designId: string): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/check/${designId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في فحص المفضلة');
    }

    return result;
  }

  async getWishlistCount(): Promise<WishlistApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/wishlist/count`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب عدد عناصر المفضلة');
    }

    return result;
  }
}

export const wishlistAPI = new WishlistAPI();

