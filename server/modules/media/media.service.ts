import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { media } from '@server/database/schema';
import type { MediaItem, MediaType } from '@shared/api.interface';

interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateMediaInput {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  mediaType?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private mapRow(row: typeof media.$inferSelect): MediaItem {
    return {
      id: row.id,
      fileName: row.fileName,
      filePath: row.filePath,
      fileUrl: row.fileUrl,
      fileSize: Number(row.fileSize),
      mimeType: row.mimeType ?? undefined,
      mediaType: row.mediaType as MediaType,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      usedIn: row.usedIn ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(params?: {
    mediaType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<MediaListResponse> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [isNull(media.deletedAt)];
    if (params?.mediaType) {
      conditions.push(eq(media.mediaType, params.mediaType));
    }
    const where = and(...conditions);

    const [totalResult, rows] = await Promise.all([
      this.db.select({ count: count() }).from(media).where(where),
      this.db
        .select()
        .from(media)
        .where(where)
        .orderBy(desc(media.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: rows.map((row: typeof media.$inferSelect) => this.mapRow(row)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<MediaItem> {
    const rows = await this.db
      .select()
      .from(media)
      .where(and(eq(media.id, id), isNull(media.deletedAt)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('媒体文件不存在');
    }

    return this.mapRow(rows[0]);
  }

  async create(data: CreateMediaInput): Promise<MediaItem> {
    const inserted = await this.db
      .insert(media)
      .values({
        fileName: data.fileName,
        filePath: data.filePath,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? 0,
        mimeType: data.mimeType,
        mediaType: data.mediaType ?? 'image',
        width: data.width,
        height: data.height,
        thumbnailUrl: data.thumbnailUrl,
      })
      .returning();

    this.logger.log(`Created media record: ${inserted[0].id}`);
    return this.mapRow(inserted[0]);
  }

  async remove(id: string): Promise<void> {
    const updated = await this.db
      .update(media)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(media.id, id), isNull(media.deletedAt)))
      .returning({ id: media.id });

    if (updated.length === 0) {
      throw new NotFoundException('媒体文件不存在');
    }

    this.logger.log(`Soft-deleted media: ${id}`);
  }
}
