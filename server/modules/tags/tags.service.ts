import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, isNull, inArray, asc } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';

import { tags } from '@server/database/schema';
import type { Tag, TagUpsertRequest } from '@shared/api.interface';

function extractPostgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string') return code;
    current = cause;
  }
  return undefined;
}

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toDto(row: typeof tags.$inferSelect): Tag {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<Tag[]> {
    const rows: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(isNull(tags.deletedAt))
      .orderBy(asc(tags.name));

    return rows.map((row: typeof tags.$inferSelect) => this.toDto(row));
  }

  async findById(id: string): Promise<Tag> {
    const rows: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), isNull(tags.deletedAt)));

    if (rows.length === 0) {
      throw new NotFoundException('标签不存在');
    }

    return this.toDto(rows[0]);
  }

  async findByName(name: string): Promise<Tag | null> {
    const rows: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.name, name), isNull(tags.deletedAt)));

    return rows.length > 0 ? this.toDto(rows[0]) : null;
  }

  async create(dto: TagUpsertRequest): Promise<Tag> {
    const existing: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(eq(tags.name, dto.name));

    if (existing.length > 0) {
      if (existing[0].deletedAt) {
        const restored: (typeof tags.$inferSelect)[] = await this.db
          .update(tags)
          .set({ deletedAt: null, updatedAt: new Date() })
          .where(eq(tags.id, existing[0].id))
          .returning();
        this.logger.log(`标签已恢复: ${restored[0].id} (${dto.name})`);
        return this.toDto(restored[0]);
      }
      return this.toDto(existing[0]);
    }

    try {
      const inserted: (typeof tags.$inferSelect)[] = await this.db
        .insert(tags)
        .values({ name: dto.name })
        .returning();

      this.logger.log(`标签已创建: ${inserted[0].id} (${dto.name})`);
      return this.toDto(inserted[0]);
    } catch (error: unknown) {
      const code: string | undefined = extractPostgresErrorCode(error);
      if (code === '23505') {
        const created: (typeof tags.$inferSelect)[] = await this.db
          .select()
          .from(tags)
          .where(eq(tags.name, dto.name));
        if (created.length > 0) {
          return this.toDto(created[0]);
        }
      }
      throw error;
    }
  }

  async update(id: string, dto: TagUpsertRequest): Promise<Tag> {
    const existing: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(and(eq(tags.id, id), isNull(tags.deletedAt)));

    if (existing.length === 0) {
      throw new NotFoundException('标签不存在');
    }

    if (dto.name === existing[0].name) {
      return this.toDto(existing[0]);
    }

    const patch: Partial<typeof tags.$inferInsert> = {
      name: dto.name,
      updatedAt: new Date(),
    };

    try {
      const updated: (typeof tags.$inferSelect)[] = await this.db
        .update(tags)
        .set(patch)
        .where(eq(tags.id, id))
        .returning();

      this.logger.log(`标签已更新: ${id}`);
      return this.toDto(updated[0]);
    } catch (error: unknown) {
      const code: string | undefined = extractPostgresErrorCode(error);
      if (code === '23505') {
        throw new ConflictException('标签名称已存在');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const updated: { id: string }[] = await this.db
      .update(tags)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(tags.id, id), isNull(tags.deletedAt)))
      .returning({ id: tags.id });

    if (updated.length === 0) {
      throw new NotFoundException('标签不存在');
    }

    this.logger.log(`标签已删除(软删): ${id}`);
  }

  async findOrCreate(names: string[]): Promise<Tag[]> {
    if (!names || names.length === 0) {
      return [];
    }

    const uniqueNames: string[] = [...new Set(
      names.map((n: string) => n.trim()).filter((n: string) => n.length > 0),
    )];

    if (uniqueNames.length === 0) {
      throw new BadRequestException('标签名称不能为空');
    }

    const existingRows: (typeof tags.$inferSelect)[] = await this.db
      .select()
      .from(tags)
      .where(inArray(tags.name, uniqueNames));

    const existingMap = new Map<string, typeof tags.$inferSelect>();
    const softDeletedToRestore: string[] = [];

    for (const row of existingRows) {
      existingMap.set(row.name, row);
      if (row.deletedAt) {
        softDeletedToRestore.push(row.id);
      }
    }

    if (softDeletedToRestore.length > 0) {
      await this.db
        .update(tags)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(inArray(tags.id, softDeletedToRestore));

      const restoredRows: (typeof tags.$inferSelect)[] = await this.db
        .select()
        .from(tags)
        .where(inArray(tags.id, softDeletedToRestore));

      for (const row of restoredRows) {
        existingMap.set(row.name, row);
      }
    }

    const newNames: string[] = uniqueNames.filter(
      (name: string) => !existingMap.has(name),
    );

    if (newNames.length > 0) {
      try {
        const newRows: (typeof tags.$inferSelect)[] = await this.db
          .insert(tags)
          .values(newNames.map((name: string) => ({ name })))
          .returning();

        for (const row of newRows) {
          existingMap.set(row.name, row);
        }

        this.logger.log(`批量创建标签: ${newNames.length} 个`);
      } catch (error: unknown) {
        const code: string | undefined = extractPostgresErrorCode(error);
        if (code === '23505') {
          const allRows: (typeof tags.$inferSelect)[] = await this.db
            .select()
            .from(tags)
            .where(inArray(tags.name, uniqueNames));

          return allRows
            .filter((row: typeof tags.$inferSelect) => !row.deletedAt)
            .map((row: typeof tags.$inferSelect) => this.toDto(row));
        }
        throw error;
      }
    }

    const result: Tag[] = uniqueNames
      .map((name: string) => existingMap.get(name))
      .filter((row): row is typeof tags.$inferSelect =>
        row !== undefined && row.deletedAt === null,
      )
      .map((row: typeof tags.$inferSelect) => this.toDto(row));

    return result;
  }
}
