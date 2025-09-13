// src/lib/api/cart.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CartItem {
  _id?: string;
  designId: string;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    inviteCount: number;
    eventDate: string; // Will be converted to Date on backend
    startTime: string;
    endTime: string;
    invitationText: string;
    hostName: string;
    eventLocation: string;
    additionalCards: number;
    gateSupervisors: number;
    extraHours: number;
    expeditedDelivery: boolean;
    // New location fields
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    detectedCity: string;
  };
  totalPrice: number;
  addedAt?: string;
  updatedAt?: string;
}

export interface CartApiResponse<T = any> {
  success: boolean;
  message?: string;
  cart?: CartItem[];
  cartItem?: CartItem;
  cartCount?: number;
  count?: number;
  source?: 'cache' | 'database';
  error?: { message: string };
  eventId?: string; // New field from backend
}

class CartAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getCart(): Promise<CartApiResponse<CartItem[]>> {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب السلة');
    }

    return result;
  }

  async addToCart(item: Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إضافة العنصر للسلة');
    }

    return result;
  }

  async updateCartItem(id: string, updates: Partial<Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>>): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث العنصر');
    }

    return result;
  }

  // NEW: Update specific field
  async updateCartItemField(id: string, field: string, value: any): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart/${id}/field`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ field, value }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في تحديث الحقل');
    }

    return result;
  }

  async removeFromCart(id: string): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في حذف العنصر من السلة');
    }

    return result;
  }

  async clearCart(): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في مسح السلة');
    }

    return result;
  }

  async getCartCount(): Promise<CartApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/cart/count`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في جلب عدد عناصر السلة');
    }

    return result;
  }
}

export const cartAPI = new CartAPI();