import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';

import { news } from '@server/database/schema';
import type { NewsItem, NewsStatus } from '@shared/api.interface';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toDto(row: typeof news.$inferSelect): NewsItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      linkUrl: row.linkUrl ?? undefined,
      newsDate: typeof row.newsDate === 'string'
        ? row.newsDate
        : String(row.newsDate),
      status: row.status as NewsStatus,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findAll(status?: NewsStatus): Promise<NewsItem[]> {
    const conditions = [];
    if (status) {
      conditions.push(eq(news.status, status));
    }

    const query = conditions.length > 0
      ? this.db
          .select()
          .from(news)
          .where(and(...conditions))
          .orderBy(asc(news.sortOrder), desc(news.newsDate))
      : this.db
          .select()
          .from(news)
          .orderBy(asc(news.sortOrder), desc(news.newsDate));

    const rows: (typeof news.$inferSelect)[] = await query;
    return rows.map((row: typeof news.$inferSelect) => this.toDto(row));
  }

  async findOne(id: string): Promise<NewsItem> {
    const rows: (typeof news.$inferSelect)[] = await this.db
      .select()
      .from(news)
      .where(eq(news.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('动态不存在');
    }

    return this.toDto(rows[0]);
  }

  async create(dto: {
    title: string;
    content?: string;
    imageUrl?: string;
    linkUrl?: string;
    newsDate: string;
    status?: NewsStatus;
    sortOrder?: number;
  }): Promise<NewsItem> {
    const inserted: (typeof news.$inferSelect)[] = await this.db
      .insert(news)
      .values({
        title: dto.title,
        content: dto.content ?? null,
        imageUrl: dto.imageUrl ?? null,
        linkUrl: dto.linkUrl ?? null,
        newsDate: dto.newsDate,
        status: dto.status ?? 'draft',
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();

    this.logger.log(`动态已创建: ${inserted[0].id} (${dto.title})`);
    return this.toDto(inserted[0]);
  }

  async update(
    id: string,
    dto: {
      title?: string;
      content?: string;
      imageUrl?: string;
      linkUrl?: string;
      newsDate?: string;
      status?: NewsStatus;
      sortOrder?: number;
    },
  ): Promise<NewsItem> {
    const existing: (typeof news.$inferSelect)[] = await this.db
      .select()
      .from(news)
      .where(eq(news.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('动态不存在');
    }

    const patch: Partial<typeof news.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.content !== undefined) patch.content = dto.content;
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) patch.linkUrl = dto.linkUrl;
    if (dto.newsDate !== undefined) patch.newsDate = dto.newsDate;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: (typeof news.$inferSelect)[] = await this.db
      .update(news)
      .set(patch)
      .where(eq(news.id, id))
      .returning();

    this.logger.log(`动态已更新: ${id}`);
    return this.toDto(updated[0]);
  }

  async remove(id: string): Promise<void> {
    const deleted: { id: string }[] = await this.db
      .delete(news)
      .where(eq(news.id, id))
      .returning({ id: news.id });

    if (deleted.length === 0) {
      throw new NotFoundException('动态不存在');
    }

    this.logger.log(`动态已删除: ${id}`);
  }
}
