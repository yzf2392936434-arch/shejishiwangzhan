import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';

import { categories } from '@server/database/schema';
import type { Category, CategoryUpsertRequest } from '@shared/api.interface';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toDto(row: typeof categories.$inferSelect): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      coverUrl: row.coverUrl ?? undefined,
      sortOrder: row.sortOrder,
      isVisible: row.isVisible,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findAll(includeHidden = false): Promise<Category[]> {
    const conditions = [isNull(categories.deletedAt)];
    if (!includeHidden) {
      conditions.push(eq(categories.isVisible, true));
    }

    const rows: (typeof categories.$inferSelect)[] = await this.db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

    return rows.map((row: typeof categories.$inferSelect) => this.toDto(row));
  }

  async findById(id: string): Promise<Category> {
    const rows: (typeof categories.$inferSelect)[] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)));

    if (rows.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    return this.toDto(rows[0]);
  }

  async findBySlug(slug: string): Promise<Category> {
    const rows: (typeof categories.$inferSelect)[] = await this.db
      .select()
      .from(categories)
      .where(
        and(eq(categories.slug, slug), isNull(categories.deletedAt)),
      );

    if (rows.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    return this.toDto(rows[0]);
  }

  async create(dto: CategoryUpsertRequest): Promise<Category> {
    const existing: (typeof categories.$inferSelect)[] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.slug, dto.slug));

    if (existing.length > 0) {
      throw new ConflictException('slug 已存在');
    }

    const inserted: (typeof categories.$inferSelect)[] = await this.db
      .insert(categories)
      .values({
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        coverUrl: dto.coverUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isVisible: dto.isVisible ?? true,
      })
      .returning();

    this.logger.log(`分类已创建: ${inserted[0].id} (${dto.name})`);
    return this.toDto(inserted[0]);
  }

  async update(id: string, dto: CategoryUpsertRequest): Promise<Category> {
    const existing: (typeof categories.$inferSelect)[] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)));

    if (existing.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    if (dto.slug && dto.slug !== existing[0].slug) {
      const slugDuplicates: (typeof categories.$inferSelect)[] = await this.db
        .select()
        .from(categories)
        .where(
          and(eq(categories.slug, dto.slug), isNull(categories.deletedAt)),
        );

      if (slugDuplicates.length > 0) {
        throw new ConflictException('slug 已存在');
      }
    }

    const patch: Partial<typeof categories.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.slug !== undefined) patch.slug = dto.slug;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.coverUrl !== undefined) patch.coverUrl = dto.coverUrl;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.isVisible !== undefined) patch.isVisible = dto.isVisible;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: (typeof categories.$inferSelect)[] = await this.db
      .update(categories)
      .set(patch)
      .where(eq(categories.id, id))
      .returning();

    this.logger.log(`分类已更新: ${id}`);
    return this.toDto(updated[0]);
  }

  async remove(id: string): Promise<void> {
    const updated: { id: string }[] = await this.db
      .update(categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning({ id: categories.id });

    if (updated.length === 0) {
      throw new NotFoundException('分类不存在');
    }

    this.logger.log(`分类已删除(软删): ${id}`);
  }

  async reorder(
    items: { id: string; sortOrder: number }[],
  ): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException('排序项不能为空');
    }

    await this.db.transaction(async (tx) => {
      for (const item of items) {
        const updated: { id: string }[] = await tx
          .update(categories)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(
            and(eq(categories.id, item.id), isNull(categories.deletedAt)),
          )
          .returning({ id: categories.id });

        if (updated.length === 0) {
          throw new NotFoundException(`分类不存在: ${item.id}`);
        }
      }
    });

    this.logger.log(`分类排序已更新, 共 ${items.length} 条`);
  }
}
