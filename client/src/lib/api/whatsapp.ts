// client/src/lib/api/whatsapp.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface WhatsappApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    message: string;
  };
}

class WhatsappAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Send invitation to a single guest
   */
  async sendInvitation(eventId: string, guestId: string): Promise<WhatsappApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-invitation`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, guestId }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إرسال الدعوة');
    }

    return result;
  }

  /**
   * Send invitations to multiple guests
   */
  async sendBulkInvitations(eventId: string, guestIds: string[]): Promise<WhatsappApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-bulk-invitations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, guestIds }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إرسال الدعوات');
    }

    return result;
  }
}

export const whatsappAPI = new WhatsappAPI();

