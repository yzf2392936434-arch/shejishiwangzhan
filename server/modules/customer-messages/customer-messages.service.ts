import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, sql, count, max } from 'drizzle-orm';

import { customerMessages } from '@server/database/schema';
import type { CustomerMessage, CustomerSession } from '@shared/api.interface';

type MessageRow = typeof customerMessages.$inferSelect;

@Injectable()
export class CustomerMessagesService {
  private readonly logger = new Logger(CustomerMessagesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toCustomerMessage(row: MessageRow): CustomerMessage {
    return {
      id: row.id,
      sessionId: row.sessionId,
      visitorName: row.visitorName ?? undefined,
      content: row.content,
      isAdminReply: row.isAdminReply,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createVisitorMessage(
    sessionId: string,
    visitorName: string | undefined,
    content: string,
  ): Promise<CustomerMessage> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId 不能为空');
    }
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('内容不能为空');
    }

    const inserted = await this.db
      .insert(customerMessages)
      .values({
        sessionId: sessionId.trim(),
        visitorName: visitorName && visitorName.trim() ? visitorName.trim() : undefined,
        content: content.trim(),
        isAdminReply: false,
        isRead: false,
      })
      .returning();

    this.logger.log(`访客消息: session=${sessionId.trim()}`);
    return this.toCustomerMessage(inserted[0]);
  }

  async getSessionMessages(sessionId: string): Promise<CustomerMessage[]> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId 不能为空');
    }

    const rows = await this.db
      .select()
      .from(customerMessages)
      .where(eq(customerMessages.sessionId, sessionId.trim()))
      .orderBy(customerMessages.createdAt);

    return rows.map(r => this.toCustomerMessage(r));
  }

  async getSessions(): Promise<{ sessions: CustomerSession[] }> {
    const sessionStats = await this.db
      .select({
        sessionId: customerMessages.sessionId,
        lastMessageAt: max(customerMessages.createdAt),
        unreadCount: sql<number>`COUNT(*) FILTER (WHERE ${customerMessages.isRead} = false AND ${customerMessages.isAdminReply} = false)`,
      })
      .from(customerMessages)
      .groupBy(customerMessages.sessionId)
      .orderBy(desc(max(customerMessages.createdAt)));

    if (sessionStats.length === 0) {
      return { sessions: [] };
    }

    const sessionIds: string[] = sessionStats.map(s => s.sessionId);

    const allRows = await this.db
      .select()
      .from(customerMessages)
      .where(sql`${customerMessages.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(customerMessages.sessionId, customerMessages.createdAt);

    const messagesBySession = new Map<string, CustomerMessage[]>();
    const visitorNameBySession = new Map<string, string>();

    for (const row of allRows) {
      const msg = this.toCustomerMessage(row);
      if (!messagesBySession.has(row.sessionId)) {
        messagesBySession.set(row.sessionId, []);
      }
      messagesBySession.get(row.sessionId)!.push(msg);

      if (!row.isAdminReply && row.visitorName && !visitorNameBySession.has(row.sessionId)) {
        visitorNameBySession.set(row.sessionId, row.visitorName);
      }
    }

    const sessions: CustomerSession[] = sessionStats.map(stat => ({
      sessionId: stat.sessionId,
      visitorName: visitorNameBySession.get(stat.sessionId),
      lastMessageAt: stat.lastMessageAt ? new Date(stat.lastMessageAt as Date).toISOString() : new Date().toISOString(),
      unreadCount: Number(stat.unreadCount) || 0,
      messages: messagesBySession.get(stat.sessionId) ?? [],
    }));

    return { sessions };
  }

  async adminReply(sessionId: string, content: string): Promise<CustomerMessage> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId 不能为空');
    }
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('内容不能为空');
    }

    const trimmedSessionId = sessionId.trim();

    const existing = await this.db
      .select({ id: customerMessages.id })
      .from(customerMessages)
      .where(eq(customerMessages.sessionId, trimmedSessionId))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('会话不存在');
    }

    const inserted = await this.db
      .insert(customerMessages)
      .values({
        sessionId: trimmedSessionId,
        content: content.trim(),
        isAdminReply: true,
        isRead: false,
      })
      .returning();

    this.logger.log(`管理员回复: session=${trimmedSessionId}`);
    return this.toCustomerMessage(inserted[0]);
  }

  async markSessionRead(sessionId: string): Promise<void> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId 不能为空');
    }

    const trimmedSessionId = sessionId.trim();

    const updated = await this.db
      .update(customerMessages)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(
        eq(customerMessages.sessionId, trimmedSessionId),
        eq(customerMessages.isRead, false),
        eq(customerMessages.isAdminReply, false),
      ))
      .returning({ id: customerMessages.id });

    this.logger.log(`标记已读: session=${trimmedSessionId}, count=${updated.length}`);
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const result = await this.db
      .select({ count: count() })
      .from(customerMessages)
      .where(and(
        eq(customerMessages.isRead, false),
        eq(customerMessages.isAdminReply, false),
      ));

    return { unreadCount: Number(result[0]?.count ?? 0) };
  }
}
