// src/lib/api/cart.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Sanitize error messages to hide technical details from users
 * Converts network/fetch errors to user-friendly Arabic messages
 */
function sanitizeErrorMessage(error: any, defaultMessage: string): string {
  const message = error?.message || String(error);
  
  // Network/fetch errors - server unreachable
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('net::ERR_') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    (message.includes('fetch') && error.name === 'TypeError')
  ) {
    return 'الخادم غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً';
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى';
  }
  
  // CORS errors
  if (message.includes('CORS') || message.includes('cross-origin')) {
    return 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى';
  }
  
  // Generic network errors
  if (message.includes('network') || message.includes('Network')) {
    return 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت';
  }
  
  // If it's already a user-friendly Arabic message, return as-is
  if (/[\u0600-\u06FF]/.test(message)) {
    return message;
  }
  
  // For any other unhandled error, return the default message
  return defaultMessage;
}

export interface CartItem {
  _id: string;
  designId: string;
  packageType: 'classic' | 'premium' | 'vip';
  details: {
    eventName: string;
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
    fastDelivery: boolean;
    // Location fields
    placeId?: string;
    displayName?: string;
    formattedAddress?: string;
    detectedCity: string;
    locationCoordinates?: {
      lat: number;
      lng: number;
    };
    googleMapsUrl?: string;
    // Custom design fields
    isCustomDesign?: boolean;
    customDesignNotes?: string;
  };
  totalPrice: number;
  // Admin price modification fields
  originalPrice?: number;
  adminModifiedPrice?: number;
  adminPriceModifiedAt?: string;
  adminPriceModifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  priceModificationReason?: string;
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في جلب السلة');
      }

      return result;
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في جلب السلة'));
    }
  }

  async addToCart(item: Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(item),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Return detailed validation error message from backend
        throw new Error(result.error?.message || 'فشل في إضافة العنصر للسلة');
      }

      return result;
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في إضافة العنصر للسلة'));
    }
  }

  async updateCartItem(id: string, updates: Partial<Omit<CartItem, '_id' | 'addedAt' | 'updatedAt'>>): Promise<CartApiResponse> {
    try {
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
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في تحديث العنصر'));
    }
  }

  // NEW: Update specific field
  async updateCartItemField(id: string, field: string, value: any): Promise<CartApiResponse> {
    try {
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
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في تحديث الحقل'));
    }
  }

  async removeFromCart(id: string): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في حذف العنصر من السلة');
      }

      return result;
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في حذف العنصر من السلة'));
    }
  }

  async clearCart(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في مسح السلة');
      }

      return result;
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في مسح السلة'));
    }
  }

  async getCartCount(): Promise<CartApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'فشل في جلب عدد عناصر السلة');
      }

      return result;
    } catch (error: any) {
      throw new Error(sanitizeErrorMessage(error, 'فشل في جلب عدد عناصر السلة'));
    }
  }
}

export const cartAPI = new CartAPI();