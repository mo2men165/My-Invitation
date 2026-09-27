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

/**
 * One chunk of a bulk send. The server sends a handful of messages per request
 * and hands back whoever is left, so the caller loops until remainingGuestIds
 * is empty. That keeps each request inside the serverless function timeout and
 * makes the whole run resumable: guests are marked as sent as they go.
 */
export interface BulkChunkResult {
  success: boolean;
  sent: number;
  failed: number;
  results: Array<{
    guestId: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }>;
  remainingGuestIds: string[];
}

export interface BulkSendProgress {
  sent: number;
  failed: number;
  total: number;
}

export interface BulkSendSummary {
  sent: number;
  failed: number;
  total: number;
  failures: Array<{ guestId: string; error?: string }>;
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
   * Send one chunk of invitations. Returns what was sent and who is left.
   */
  async sendInvitationChunk(eventId: string, guestIds: string[]): Promise<BulkChunkResult> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-bulk-invitations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ eventId, guestIds }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'فشل في إرسال الدعوات');
    }

    const chunk = result.data;

    // The API and the frontend deploy separately, so an older API may answer
    // with the previous shape. Say so plainly instead of failing on undefined.
    if (!chunk || !Array.isArray(chunk.results) || !Array.isArray(chunk.remainingGuestIds)) {
      throw new Error('الخادم يعمل بإصدار أقدم غير متوافق. يرجى المحاولة بعد قليل');
    }

    return chunk as BulkChunkResult;
  }

  /**
   * Send invitations to every given guest, a chunk at a time, reporting
   * progress as it goes. Failures are collected rather than aborting the run,
   * so one bad number does not stop the rest of the list.
   */
  async sendBulkInvitations(
    eventId: string,
    guestIds: string[],
    onProgress?: (progress: BulkSendProgress) => void
  ): Promise<BulkSendSummary> {
    const total = guestIds.length;
    const failures: BulkSendSummary['failures'] = [];
    let sent = 0;
    let failed = 0;
    let remaining = guestIds;

    while (remaining.length > 0) {
      const chunk: BulkChunkResult = await this.sendInvitationChunk(eventId, remaining);

      sent += chunk.sent;
      failed += chunk.failed;
      failures.push(
        ...chunk.results
          .filter(r => !r.success)
          .map(r => ({ guestId: r.guestId, error: r.error }))
      );

      onProgress?.({ sent, failed, total });

      // Guard against a server that stops making progress, so the loop can
      // never spin forever on the same guests.
      if (chunk.remainingGuestIds.length >= remaining.length) {
        break;
      }

      remaining = chunk.remainingGuestIds;
    }

    return { sent, failed, total, failures };
  }
}

export const whatsappAPI = new WhatsappAPI();

