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
    console.log('=== WHATSAPP API CLIENT: sendInvitation ===', {
      eventId,
      guestId,
      apiUrl: `${API_BASE_URL}/api/whatsapp/send-invitation`
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-invitation`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ eventId, guestId }),
      });

      console.log('WHATSAPP API CLIENT: Response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('WHATSAPP API CLIENT: Response data', result);
      
      if (!response.ok) {
        console.error('WHATSAPP API CLIENT: Request failed', {
          status: response.status,
          error: result.error
        });
        throw new Error(result.error?.message || 'فشل في إرسال الدعوة');
      }

      console.log('WHATSAPP API CLIENT: Invitation sent successfully', {
        messageId: result.data?.messageId
      });

      return result;
    } catch (error: any) {
      console.error('=== WHATSAPP API CLIENT: ERROR ===', {
        error: error.message,
        eventId,
        guestId
      });
      throw error;
    }
  }

  /**
   * Send invitations to multiple guests
   */
  async sendBulkInvitations(eventId: string, guestIds: string[]): Promise<WhatsappApiResponse> {
    console.log('=== WHATSAPP API CLIENT: sendBulkInvitations ===', {
      eventId,
      guestCount: guestIds.length,
      guestIds,
      apiUrl: `${API_BASE_URL}/api/whatsapp/send-bulk-invitations`
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-bulk-invitations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ eventId, guestIds }),
      });

      console.log('WHATSAPP API CLIENT BULK: Response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('WHATSAPP API CLIENT BULK: Response data', result);
      
      if (!response.ok) {
        console.error('WHATSAPP API CLIENT BULK: Request failed', {
          status: response.status,
          error: result.error
        });
        throw new Error(result.error?.message || 'فشل في إرسال الدعوات');
      }

      console.log('WHATSAPP API CLIENT BULK: Bulk invitations sent successfully', {
        resultData: result.data
      });

      return result;
    } catch (error: any) {
      console.error('=== WHATSAPP API CLIENT BULK: ERROR ===', {
        error: error.message,
        eventId,
        guestCount: guestIds.length
      });
      throw error;
    }
  }
}

export const whatsappAPI = new WhatsappAPI();

