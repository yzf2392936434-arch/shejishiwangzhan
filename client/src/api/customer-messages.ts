import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { CustomerMessage, CustomerSession } from '@shared/api.interface';

export async function sendVisitorMessage(
  sessionId: string,
  content: string,
  visitorName?: string,
): Promise<CustomerMessage> {
  try {
    const res = await axiosForBackend.post('/api/public/customer-messages', {
      sessionId,
      content,
      visitorName,
    });
    return res.data;
  } catch (e) {
    logger.error('sendVisitorMessage failed', e);
    throw e;
  }
}

export async function getVisitorMessages(
  sessionId: string,
): Promise<CustomerMessage[]> {
  try {
    const res = await axiosForBackend.get('/api/public/customer-messages', {
      params: { sessionId },
    });
    return res.data;
  } catch (e) {
    logger.error('getVisitorMessages failed', e);
    throw e;
  }
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  try {
    const res = await axiosForBackend.get('/api/admin/customer-messages/unread-count');
    return res.data;
  } catch (e) {
    logger.error('getUnreadCount failed', e);
    throw e;
  }
}

export async function getAdminSessions(): Promise<CustomerSession[]> {
  try {
    const res = await axiosForBackend.get('/api/admin/customer-messages');
    return res.data.sessions;
  } catch (e) {
    logger.error('getAdminSessions failed', e);
    throw e;
  }
}

export async function replySessionMessage(
  sessionId: string,
  content: string,
): Promise<CustomerMessage> {
  try {
    const res = await axiosForBackend.post(
      `/api/admin/customer-messages/${sessionId}/reply`,
      { content },
    );
    return res.data;
  } catch (e) {
    logger.error('replySessionMessage failed', e);
    throw e;
  }
}

export async function markSessionRead(sessionId: string): Promise<void> {
  try {
    await axiosForBackend.patch(
      `/api/admin/customer-messages/${sessionId}/read`,
    );
  } catch (e) {
    logger.error('markSessionRead failed', e);
    throw e;
  }
}
