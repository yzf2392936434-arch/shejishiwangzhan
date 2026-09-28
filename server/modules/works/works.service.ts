import { Inject, Injectable, Logger, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, ilike, inArray, sql, count, sum, gt, asc, arrayContains } from 'drizzle-orm';
import { scryptSync, randomBytes } from 'node:crypto';
import type { Work, WorkListItem, WorksListResponse, WorkStatus, WorkUpsertRequest, WorksFilterParams, Category, Tag, WorkImage, WorkContentBlock, SearchResponse, DashboardStats, ExportDataResponse, Profile, SiteSettings, SkillItem, NavItem, HomeSection, ThemeConfig } from '@shared/api.interface';
import { works, workCategories, workTags, categories, tags, customerMessages, media, workViews, profile, siteSettings } from '@server/database/schema';

type WorkSelect = typeof works.$inferSelect;

@Injectable()
export class WorksService {
  private readonly logger = new Logger(WorksService.name);

  private readonly PASSWORD_SALT = 'portfolio-work-password-salt';

  private hashPassword(password: string): string {
    return scryptSync(password, this.PASSWORD_SALT, 64).toString('hex');
  }

  private verifyPassword(password: string, hash: string | null): boolean {
    if (!hash) return false;
    const inputHash = scryptSync(password, this.PASSWORD_SALT, 64).toString('hex');
    return inputHash === hash;
  }

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toWorkListItem(row: WorkSelect): WorkListItem {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      coverUrl: row.coverUrl ?? undefined,
      summary: row.summary ?? undefined,
      status: row.status as WorkStatus,
      isFeatured: row.isFeatured,
      isPinned: row.isPinned,
      year: row.year ?? undefined,
      likeCount: row.likeCount,
      viewCount: row.viewCount,
      favoriteCount: row.favoriteCount,
      categories: [],
      tags: [],
      software: Array.isArray(row.software) ? row.software : [],
      aiTools: Array.isArray(row.aiTools) ? row.aiTools : [],
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toWork(row: WorkSelect): Work {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      coverUrl: row.coverUrl ?? undefined,
      contentBlocks: (row.contentBlocks as WorkContentBlock[]) ?? [],
      images: (row.images as WorkImage[]) ?? [],
      videoUrl: row.videoUrl ?? undefined,
      videoCoverUrl: row.videoCoverUrl ?? undefined,
      summary: row.summary ?? undefined,
      background: row.background ?? undefined,
      goal: row.goal ?? undefined,
      designApproach: row.designApproach ?? undefined,
      myRole: row.myRole ?? undefined,
      results: row.results ?? undefined,
      productionDate: row.productionDate ?? undefined,
      client: row.client ?? undefined,
      projectType: row.projectType ?? undefined,
      teamSize: row.teamSize ?? undefined,
      duration: row.duration ?? undefined,
      clientQuote: row.clientQuote ?? undefined,
      software: row.software ?? [],
      aiTools: row.aiTools ?? [],
      status: row.status as WorkStatus,
      isFeatured: row.isFeatured,
      isPinned: row.isPinned,
      sortOrder: row.sortOrder,
      year: row.year ?? undefined,
      seoTitle: row.seoTitle ?? undefined,
      seoDescription: row.seoDescription ?? undefined,
      shareTitle: row.shareTitle ?? undefined,
      shareCoverUrl: row.shareCoverUrl ?? undefined,
      viewCount: row.viewCount,
      categories: [],
      tags: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      showSummary: row.showSummary,
      showBackground: row.showBackground,
      showGoal: row.showGoal,
      showDesignApproach: row.showDesignApproach,
      showMyRole: row.showMyRole,
      showResults: row.showResults,
      showProductionDate: row.showProductionDate,
      showSoftware: row.showSoftware,
      showAiTools: row.showAiTools,
      likeCount: row.likeCount,
      favoriteCount: row.favoriteCount,
      scheduledPublishedAt: row.scheduledPublishedAt ? new Date(row.scheduledPublishedAt as Date).toISOString() : undefined,
    };
  }

  private async attachCategoriesAndTags<T extends { id: string; categories: Category[]; tags: Tag[] }>(
    items: T[],
  ): Promise<T[]> {
    if (items.length === 0) return items;

    const ids: string[] = items.map((item: T) => item.id);

    const [wcRows, wtRows] = await Promise.all([
      this.db.select().from(workCategories).where(inArray(workCategories.workId, ids)),
      this.db.select().from(workTags).where(inArray(workTags.workId, ids)),
    ]);

    const categoryIds: string[] = [...new Set(wcRows.map(r => r.categoryId))];
    const tagIds: string[] = [...new Set(wtRows.map(r => r.tagId))];

    const [catRows, tagRows] = await Promise.all([
      categoryIds.length > 0
        ? this.db.select().from(categories).where(inArray(categories.id, categoryIds))
        : Promise.resolve([]),
      tagIds.length > 0
        ? this.db.select().from(tags).where(inArray(tags.id, tagIds))
        : Promise.resolve([]),
    ]);

    const catMap = new Map<string, Category>();
    for (const c of catRows) {
      catMap.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? undefined,
        coverUrl: c.coverUrl ?? undefined,
        sortOrder: c.sortOrder,
        isVisible: c.isVisible,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      });
    }

    const tagMap = new Map<string, Tag>();
    for (const t of tagRows) {
      tagMap.set(t.id, {
        id: t.id,
        name: t.name,
        createdAt: t.createdAt.toISOString(),
      });
    }

    const wcByWork = new Map<string, string[]>();
    for (const wc of wcRows) {
      wcByWork.set(wc.workId, [...(wcByWork.get(wc.workId) ?? []), wc.categoryId]);
    }

    const wtByWork = new Map<string, string[]>();
    for (const wt of wtRows) {
      wtByWork.set(wt.workId, [...(wtByWork.get(wt.workId) ?? []), wt.tagId]);
    }

    for (const item of items) {
      const cids = wcByWork.get(item.id) ?? [];
      item.categories = cids.map(id => catMap.get(id)).filter(Boolean) as Category[];

      const tids = wtByWork.get(item.id) ?? [];
      item.tags = tids.map(id => tagMap.get(id)).filter(Boolean) as Tag[];
    }

    return items;
  }

  private async updateWorkCategories(workId: string, categoryIds: string[] | undefined): Promise<void> {
    if (categoryIds === undefined) return;

    await this.db.transaction(async (tx) => {
      await tx.delete(workCategories).where(eq(workCategories.workId, workId));
      if (categoryIds.length > 0) {
        const uniqueIds = [...new Set(categoryIds)];
        await tx.insert(workCategories).values(
          uniqueIds.map(cid => ({ workId, categoryId: cid })),
        );
      }
    });
  }

  private async updateWorkTags(workId: string, tagIds: string[] | undefined): Promise<void> {
    if (tagIds === undefined) return;

    await this.db.transaction(async (tx) => {
      await tx.delete(workTags).where(eq(workTags.workId, workId));
      if (tagIds.length > 0) {
        const uniqueIds = [...new Set(tagIds)];
        await tx.insert(workTags).values(
          uniqueIds.map(tid => ({ workId, tagId: tid })),
        );
      }
    });
  }

  private async checkSlugUnique(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.slug, slug))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== excludeId) {
      throw new ConflictException('Slug 已存在');
    }
  }

  async findAllAdmin(params: WorksFilterParams & { status?: WorkStatus }): Promise<WorksListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    const offset = (page - 1) * pageSize;

    const conditions = [
      sql`${works.deletedAt} IS NULL`,
    ];

    if (params.status) {
      conditions.push(eq(works.status, params.status));
    }
    if (params.keyword) {
      conditions.push(ilike(works.title, `%${params.keyword}%`));
    }
    if (params.year) {
      conditions.push(eq(works.year, params.year));
    }

    let whereClause;
    if (params.category) {
      whereClause = and(
        sql`${works.id} IN (${
          this.db
            .select({ workId: workCategories.workId })
            .from(workCategories)
            .innerJoin(categories, eq(workCategories.categoryId, categories.id))
            .where(eq(categories.slug, params.category))
        })`,
        ...conditions,
      );
    } else if (params.tag) {
      whereClause = and(
        sql`${works.id} IN (${
          this.db
            .select({ workId: workTags.workId })
            .from(workTags)
            .innerJoin(tags, eq(workTags.tagId, tags.id))
            .where(eq(tags.name, params.tag))
        })`,
        ...conditions,
      );
    } else {
      whereClause = and(...conditions);
    }

    const [totalRows, rows] = await Promise.all([
      this.db.select({ count: count() }).from(works).where(whereClause),
      this.db
        .select()
        .from(works)
        .where(whereClause)
        .orderBy(desc(works.isPinned), desc(works.sortOrder), desc(works.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: WorkListItem[] = rows.map(r => this.toWorkListItem(r));
    await this.attachCategoriesAndTags(items);

    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<Work> {
    const rows = await this.db
      .select()
      .from(works)
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    const work = this.toWork(rows[0]);
    await this.attachCategoriesAndTags([work]);
    return work;
  }

  async create(dto: WorkUpsertRequest): Promise<Work> {
    await this.checkSlugUnique(dto.slug);

    const newWork = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(works)
        .values({
          title: dto.title,
          slug: dto.slug,
          coverUrl: dto.coverUrl,
          contentBlocks: dto.contentBlocks ?? [],
          images: dto.images ?? [],
          videoUrl: dto.videoUrl,
          videoCoverUrl: dto.videoCoverUrl,
          summary: dto.summary,
          background: dto.background,
          goal: dto.goal,
          designApproach: dto.designApproach,
          myRole: dto.myRole,
          results: dto.results,
          productionDate: dto.productionDate,
          client: dto.client,
          projectType: dto.projectType,
          teamSize: dto.teamSize,
          duration: dto.duration,
          clientQuote: dto.clientQuote,
          software: dto.software ?? [],
          aiTools: dto.aiTools ?? [],
          status: dto.status ?? 'draft',
          password: dto.password ? this.hashPassword(dto.password) : null,
          isFeatured: dto.isFeatured ?? false,
          isPinned: dto.isPinned ?? false,
          sortOrder: dto.sortOrder ?? 0,
          year: dto.year,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          shareTitle: dto.shareTitle,
          shareCoverUrl: dto.shareCoverUrl,
          showSummary: dto.showSummary ?? true,
          showBackground: dto.showBackground ?? true,
          showGoal: dto.showGoal ?? true,
          showDesignApproach: dto.showDesignApproach ?? true,
          showMyRole: dto.showMyRole ?? true,
          showResults: dto.showResults ?? true,
          showProductionDate: dto.showProductionDate ?? true,
          showSoftware: dto.showSoftware ?? true,
          showAiTools: dto.showAiTools ?? true,
          scheduledPublishedAt: dto.scheduledPublishedAt ? new Date(dto.scheduledPublishedAt) : null,
        })
        .returning();

      const workId = inserted[0].id;

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        const uniqueCids = [...new Set(dto.categoryIds)];
        await tx.insert(workCategories).values(
          uniqueCids.map(cid => ({ workId, categoryId: cid })),
        );
      }
      if (dto.tagIds && dto.tagIds.length > 0) {
        const uniqueTids = [...new Set(dto.tagIds)];
        await tx.insert(workTags).values(
          uniqueTids.map(tid => ({ workId, tagId: tid })),
        );
      }

      return inserted[0];
    });

    const work = this.toWork(newWork);
    await this.attachCategoriesAndTags([work]);
    this.logger.log(`创建作品: ${work.id} (${work.title})`);
    return work;
  }

  async update(id: string, dto: WorkUpsertRequest): Promise<Work> {
    const existing = await this.db
      .select({ id: works.id, slug: works.slug })
      .from(works)
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    if (dto.slug !== existing[0].slug) {
      await this.checkSlugUnique(dto.slug, id);
    }

    const patch: Partial<typeof works.$inferInsert> = {};

    const updatableFields: (keyof WorkUpsertRequest)[] = [
      'title', 'slug', 'coverUrl', 'contentBlocks', 'images', 'videoUrl', 'videoCoverUrl',
      'summary', 'background', 'goal', 'designApproach', 'myRole', 'results',
      'productionDate', 'client', 'projectType', 'teamSize', 'duration', 'clientQuote', 'software', 'aiTools', 'status', 'password',
      'isFeatured', 'isPinned', 'sortOrder', 'year',
      'seoTitle', 'seoDescription', 'shareTitle', 'shareCoverUrl',
      'showSummary', 'showBackground', 'showGoal', 'showDesignApproach',
      'showMyRole', 'showResults', 'showProductionDate', 'showSoftware', 'showAiTools',
      'scheduledPublishedAt',
    ];

    if (dto.password !== undefined) {
      patch.password = dto.password ? this.hashPassword(dto.password) : null;
    }

    for (const field of updatableFields) {
      if (field === 'password') continue;
      if (dto[field] !== undefined) {
        (patch as Record<string, unknown>)[field] = dto[field];
      }
    }

    patch.updatedAt = new Date();

    const updated = await this.db
      .update(works)
      .set(patch)
      .where(eq(works.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    await this.updateWorkCategories(id, dto.categoryIds);
    await this.updateWorkTags(id, dto.tagIds);

    const work = this.toWork(updated[0]);
    await this.attachCategoriesAndTags([work]);
    this.logger.log(`更新作品: ${id} (${work.title})`);
    return work;
  }

  async remove(id: string): Promise<void> {
    const updated = await this.db
      .update(works)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .returning({ id: works.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    this.logger.log(`软删除作品: ${id}`);
  }

  async restore(id: string): Promise<void> {
    const updated = await this.db
      .update(works)
      .set({ deletedAt: null as unknown as Date, updatedAt: new Date() })
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NOT NULL`))
      .returning({ id: works.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不在回收站中');
    }
    this.logger.log(`恢复作品: ${id}`);
  }

  async setFeatured(id: string, featured: boolean): Promise<void> {
    const updated = await this.db
      .update(works)
      .set({ isFeatured: featured, updatedAt: new Date() })
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .returning({ id: works.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    this.logger.log(`设置作品精选: ${id} = ${featured}`);
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    const updated = await this.db
      .update(works)
      .set({ isPinned: pinned, updatedAt: new Date() })
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .returning({ id: works.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    this.logger.log(`设置作品置顶: ${id} = ${pinned}`);
  }

  async updateStatus(id: string, status: WorkStatus): Promise<void> {
    const updated = await this.db
      .update(works)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(works.id, id), sql`${works.deletedAt} IS NULL`))
      .returning({ id: works.id });

    if (updated.length === 0) {
      throw new NotFoundException('作品不存在');
    }
    this.logger.log(`更新作品状态: ${id} = ${status}`);
  }

  async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
    if (items.length === 0) return;

    await this.db.transaction(async (tx) => {
      const promises = items.map((item: { id: string; sortOrder: number }) =>
        tx.update(works)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(works.id, item.id)),
      );
      await Promise.all(promises);
    });

    this.logger.log(`批量排序作品: ${items.length} 条`);
  }

  async getStats(): Promise<{ total: number; published: number; draft: number; hidden: number; password: number }> {
    const rows = await this.db
      .select({ status: works.status, count: count() })
      .from(works)
      .where(sql`${works.deletedAt} IS NULL`)
      .groupBy(works.status);

    const result = { total: 0, published: 0, draft: 0, hidden: 0, password: 0 };
    for (const row of rows) {
      const c = Number(row.count);
      result.total += c;
      const s = row.status as keyof typeof result;
      if (s in result) {
        (result as Record<string, number>)[s] = c;
      }
    }
    return result;
  }

  async findPublic(params: WorksFilterParams): Promise<WorksListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    const offset = (page - 1) * pageSize;

    const conditions = [
      eq(works.status, 'published'),
      sql`${works.deletedAt} IS NULL`,
    ];

    if (params.keyword) {
      conditions.push(ilike(works.title, `%${params.keyword}%`));
    }
    if (params.year) {
      conditions.push(eq(works.year, params.year));
    }
    if (params.software) {
      conditions.push(arrayContains(works.software, [params.software]));
    }
    if (params.aiTool) {
      conditions.push(arrayContains(works.aiTools, [params.aiTool]));
    }

    let whereClause;
    if (params.category) {
      whereClause = and(
        sql`${works.id} IN (${
          this.db
            .select({ workId: workCategories.workId })
            .from(workCategories)
            .innerJoin(categories, eq(workCategories.categoryId, categories.id))
            .where(and(eq(categories.slug, params.category), eq(categories.isVisible, true)))
        })`,
        ...conditions,
      );
    } else if (params.tag) {
      whereClause = and(
        sql`${works.id} IN (${
          this.db
            .select({ workId: workTags.workId })
            .from(workTags)
            .innerJoin(tags, eq(workTags.tagId, tags.id))
            .where(eq(tags.name, params.tag))
        })`,
        ...conditions,
      );
    } else {
      whereClause = and(...conditions);
    }

    const [totalRows, rows] = await Promise.all([
      this.db.select({ count: count() }).from(works).where(whereClause),
      this.db
        .select()
        .from(works)
        .where(whereClause)
        .orderBy(desc(works.isPinned), desc(works.sortOrder), desc(works.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: WorkListItem[] = rows.map(r => this.toWorkListItem(r));
    await this.attachCategoriesAndTags(items);

    return { items, total, page, pageSize };
  }

  async findBySlug(slug: string): Promise<Work | null> {
    const rows = await this.db
      .select()
      .from(works)
      .where(and(
        eq(works.slug, slug),
        eq(works.status, 'published'),
        sql`${works.deletedAt} IS NULL`,
      ))
      .limit(1);

    if (rows.length === 0) return null;

    const work = this.toWork(rows[0]);
    await this.attachCategoriesAndTags([work]);
    return work;
  }

  async findBySlugWithPasswordCheck(slug: string, password?: string): Promise<Work | null> {
    const rows = await this.db
      .select()
      .from(works)
      .where(and(
        eq(works.slug, slug),
        sql`${works.deletedAt} IS NULL`,
      ))
      .limit(1);

    if (rows.length === 0) return null;

    const work = rows[0];
    const status = work.status as WorkStatus;

    if (status !== 'published' && status !== 'password') {
      return null;
    }

    if (status === 'password') {
      if (!password || !this.verifyPassword(password, work.password)) {
        throw new ForbiddenException('密码错误');
      }
    }

    const result = this.toWork(work);
    await this.attachCategoriesAndTags([result]);
    return result;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(works)
      .set({ viewCount: sql`${works.viewCount} + 1` })
      .where(eq(works.id, id));
  }

  async recordView(workId: string, ipAddress: string): Promise<void> {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayStartIso = dayStart.toISOString();
    const dayEndIso = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const existing = await this.db
      .select({ id: workViews.id })
      .from(workViews)
      .where(and(
        eq(workViews.workId, workId),
        eq(workViews.ipAddress, ipAddress),
        sql`${workViews.viewedAt} >= ${dayStartIso}`,
        sql`${workViews.viewedAt} < ${dayEndIso}`,
      ))
      .limit(1);

    if (existing.length > 0) {
      return;
    }

    await this.db.transaction(async (tx) => {
      const dupCheck = await tx
        .select({ id: workViews.id })
        .from(workViews)
        .where(and(
          eq(workViews.workId, workId),
          eq(workViews.ipAddress, ipAddress),
          sql`${workViews.viewedAt} >= ${dayStartIso}`,
          sql`${workViews.viewedAt} < ${dayEndIso}`,
        ))
        .limit(1);

      if (dupCheck.length > 0) return;

      await tx.insert(workViews).values({
        workId,
        ipAddress,
      });

      await tx
        .update(works)
        .set({ viewCount: sql`${works.viewCount} + 1` })
        .where(eq(works.id, workId));
    });
  }

  async getHotWorks(limit: number): Promise<WorkListItem[]> {
    const rows = await this.db
      .select()
      .from(works)
      .where(and(
        eq(works.status, 'published'),
        sql`${works.deletedAt} IS NULL`,
      ))
      .orderBy(sql`${works.likeCount} * 2 + ${works.viewCount} DESC`, desc(works.createdAt))
      .limit(limit);

    const items: WorkListItem[] = rows.map(r => this.toWorkListItem(r));
    await this.attachCategoriesAndTags(items);
    return items;
  }

  async getRelatedWorks(workId: string, limit = 4): Promise<WorkListItem[]> {
    const [wcRows, wtRows] = await Promise.all([
      this.db
        .select({ categoryId: workCategories.categoryId })
        .from(workCategories)
        .where(eq(workCategories.workId, workId)),
      this.db
        .select({ tagId: workTags.tagId })
        .from(workTags)
        .where(eq(workTags.workId, workId)),
    ]);

    const categoryIds = wcRows.map(r => r.categoryId);
    const tagIds = wtRows.map(r => r.tagId);

    if (categoryIds.length === 0 && tagIds.length === 0) {
      const recent = await this.db
        .select()
        .from(works)
        .where(and(
          eq(works.status, 'published'),
          sql`${works.deletedAt} IS NULL`,
          sql`${works.id} != ${workId}`,
        ))
        .orderBy(desc(works.createdAt))
        .limit(limit);
      const items: WorkListItem[] = recent.map(r => this.toWorkListItem(r));
      await this.attachCategoriesAndTags(items);
      return items;
    }

    const relatedRows = await this.db
      .select({
        id: works.id,
        matchScore: sql<number>`(
          SELECT COUNT(*) FROM ${workCategories}
          WHERE ${workCategories.workId} = ${works.id}
          AND ${workCategories.categoryId} IN (${sql.join(categoryIds.length > 0 ? categoryIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)})
        ) + (
          SELECT COUNT(*) FROM ${workTags}
          WHERE ${workTags.workId} = ${works.id}
          AND ${workTags.tagId} IN (${sql.join(tagIds.length > 0 ? tagIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)})
        )`,
      })
      .from(works)
      .where(and(
        eq(works.status, 'published'),
        sql`${works.deletedAt} IS NULL`,
        sql`${works.id} != ${workId}`,
        sql`(
          ${works.id} IN (SELECT ${workCategories.workId} FROM ${workCategories} WHERE ${workCategories.categoryId} IN (${sql.join(categoryIds.length > 0 ? categoryIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)}))
          OR ${works.id} IN (SELECT ${workTags.workId} FROM ${workTags} WHERE ${workTags.tagId} IN (${sql.join(tagIds.length > 0 ? tagIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)}))
        )`,
      ))
       .orderBy(
        sql`(
          SELECT COUNT(*) FROM ${workCategories}
          WHERE ${workCategories.workId} = ${works.id}
          AND ${workCategories.categoryId} IN (${sql.join(categoryIds.length > 0 ? categoryIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)})
        ) + (
          SELECT COUNT(*) FROM ${workTags}
          WHERE ${workTags.workId} = ${works.id}
          AND ${workTags.tagId} IN (${sql.join(tagIds.length > 0 ? tagIds.map(id => sql`${id}`) : [sql`NULL`], sql`, `)})
        ) DESC`,
        desc(works.createdAt),
      )
       .limit(limit);

    if (relatedRows.length === 0) {
      const recent = await this.db
        .select()
        .from(works)
        .where(and(
          eq(works.status, 'published'),
          sql`${works.deletedAt} IS NULL`,
          sql`${works.id} != ${workId}`,
        ))
        .orderBy(desc(works.createdAt))
        .limit(limit);
      const items: WorkListItem[] = recent.map(r => this.toWorkListItem(r));
      await this.attachCategoriesAndTags(items);
      return items;
    }

    const relatedIds = relatedRows.map(r => r.id);
    const workRows = await this.db
      .select()
      .from(works)
      .where(inArray(works.id, relatedIds));

    const sortedWorkRows = relatedIds.map(id => workRows.find(w => w.id === id)).filter(Boolean) as typeof works.$inferSelect[];

    const items: WorkListItem[] = sortedWorkRows.map(r => this.toWorkListItem(r));
    await this.attachCategoriesAndTags(items);
    return items;
  }

  async searchPublic(keyword: string): Promise<SearchResponse> {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return { items: [], total: 0, keyword: trimmed };
    }

    const likePattern = `%${trimmed}%`;

    const whereClause = and(
      eq(works.status, 'published'),
      sql`${works.deletedAt} IS NULL`,
      sql`(
        ${works.title} ILIKE ${likePattern}
        OR ${works.summary} ILIKE ${likePattern}
        OR ${works.id} IN (
          SELECT ${workCategories.workId}
          FROM ${workCategories}
          INNER JOIN ${categories} ON ${workCategories.categoryId} = ${categories.id}
          WHERE ${categories.name} ILIKE ${likePattern}
        )
        OR ${works.id} IN (
          SELECT ${workTags.workId}
          FROM ${workTags}
          INNER JOIN ${tags} ON ${workTags.tagId} = ${tags.id}
          WHERE ${tags.name} ILIKE ${likePattern}
        )
      )`,
    );

    const rows = await this.db
      .select()
      .from(works)
      .where(whereClause)
      .orderBy(
        sql`CASE WHEN ${works.title} ILIKE ${likePattern} THEN 0 ELSE 1 END`,
        desc(works.createdAt),
      )
      .limit(50);

    const total = rows.length;
    const items: WorkListItem[] = rows.map(r => this.toWorkListItem(r));
    await this.attachCategoriesAndTags(items);

    return { items, total, keyword: trimmed };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      statusStats,
      categoryCountRow,
      mediaCountRow,
      totalViewsRow,
      totalLikesRow,
      totalFavoritesRow,
      unreadMessagesRow,
      recentRows,
      popularRows,
      visitCountRow,
      deviceStatsRows,
      popularWorkVisitRows,
      dailyTrendRows,
    ] = await Promise.all([
      this.getStats(),
      this.db.select({ count: count() }).from(categories).where(sql`${categories.deletedAt} IS NULL`),
      this.db.select({ count: count() }).from(media).where(sql`${media.deletedAt} IS NULL`),
      this.db.select({ total: sql<number>`COALESCE(SUM(${works.viewCount}), 0)` }).from(works).where(sql`${works.deletedAt} IS NULL`),
      this.db.select({ total: sql<number>`COALESCE(SUM(${works.likeCount}), 0)` }).from(works).where(sql`${works.deletedAt} IS NULL`),
      this.db.select({ total: sql<number>`COALESCE(SUM(${works.favoriteCount}), 0)` }).from(works).where(sql`${works.deletedAt} IS NULL`),
      this.db.select({ count: count() }).from(customerMessages).where(and(eq(customerMessages.isRead, false), eq(customerMessages.isAdminReply, false))),
      this.db
        .select()
        .from(works)
        .where(sql`${works.deletedAt} IS NULL`)
        .orderBy(desc(works.createdAt))
        .limit(5),
      this.db
        .select()
        .from(works)
        .where(and(sql`${works.deletedAt} IS NULL`))
        .orderBy(sql`${works.likeCount} + ${works.viewCount} DESC`, desc(works.createdAt))
        .limit(5),
      this.db.select({
        totalVisits: sql<number>`count(*)`,
        last7Days: sql<number>`count(*) filter (where ${workViews.viewedAt} >= now() - interval '7 days')`,
        last30Days: sql<number>`count(*) filter (where ${workViews.viewedAt} >= now() - interval '30 days')`,
        today: sql<number>`count(*) filter (where (${workViews.viewedAt} AT TIME ZONE 'Asia/Shanghai')::date = (now() AT TIME ZONE 'Asia/Shanghai')::date)`,
      }).from(workViews),
      this.db.select({
        deviceType: workViews.deviceType,
        count: sql<number>`count(*)`,
      }).from(workViews).groupBy(workViews.deviceType),
      this.db
        .select({
          workId: workViews.workId,
          workTitle: works.title,
          views: sql<number>`count(*)`,
        })
        .from(workViews)
        .innerJoin(works, eq(workViews.workId, works.id))
        .where(sql`${works.deletedAt} IS NULL`)
        .groupBy(workViews.workId, works.title)
        .orderBy(sql`count(*) DESC`)
        .limit(5),
      this.db.select({
        date: sql<string>`TO_CHAR((${workViews.viewedAt} AT TIME ZONE 'Asia/Shanghai')::date, 'YYYY-MM-DD')`,
        views: sql<number>`count(*)`,
      })
        .from(workViews)
        .where(sql`${workViews.viewedAt} >= now() - interval '6 days'`)
        .groupBy(sql`(${workViews.viewedAt} AT TIME ZONE 'Asia/Shanghai')::date`)
        .orderBy(sql`(${workViews.viewedAt} AT TIME ZONE 'Asia/Shanghai')::date ASC`),
    ]);

    const recentWorks: WorkListItem[] = recentRows.map(r => this.toWorkListItem(r));
    const popularWorks: WorkListItem[] = popularRows.map(r => this.toWorkListItem(r));
    await Promise.all([
      this.attachCategoriesAndTags(recentWorks),
      this.attachCategoriesAndTags(popularWorks),
    ]);

    const deviceStats = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };
    for (const row of deviceStatsRows) {
      const dt: string = row.deviceType ?? 'unknown';
      const c: number = Number(row.count);
      if (dt === 'mobile') deviceStats.mobile = c;
      else if (dt === 'desktop') deviceStats.desktop = c;
      else if (dt === 'tablet') deviceStats.tablet = c;
    }

    const popularWorksVisit = popularWorkVisitRows.map((row: { workId: string; workTitle: string; views: number }) => ({
      workId: row.workId,
      workTitle: row.workTitle,
      views: Number(row.views),
    }));

    const trendMap = new Map<string, number>();
    for (const row of dailyTrendRows) {
      trendMap.set(row.date, Number(row.views));
    }
    const dailyTrend: { date: string; views: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const dateStr = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      dailyTrend.push({
        date: dateStr,
        views: trendMap.get(dateStr) ?? 0,
      });
    }

    const visitStats = {
      totalVisits: Number(visitCountRow[0]?.totalVisits ?? 0),
      last7Days: Number(visitCountRow[0]?.last7Days ?? 0),
      last30Days: Number(visitCountRow[0]?.last30Days ?? 0),
      today: Number(visitCountRow[0]?.today ?? 0),
      deviceStats,
      popularWorks: popularWorksVisit,
      dailyTrend,
    };

    return {
      totalWorks: statusStats.total,
      publishedWorks: statusStats.published,
      draftWorks: statusStats.draft,
      hiddenWorks: statusStats.hidden,
      passwordWorks: statusStats.password,
      totalCategories: Number(categoryCountRow[0]?.count ?? 0),
      totalMedia: Number(mediaCountRow[0]?.count ?? 0),
      totalViews: Number(totalViewsRow[0]?.total ?? 0),
      totalLikes: Number(totalLikesRow[0]?.total ?? 0),
      totalFavorites: Number(totalFavoritesRow[0]?.total ?? 0),
      unreadMessages: Number(unreadMessagesRow[0]?.count ?? 0),
      recentWorks,
      popularWorks,
      visitStats,
    };
  }

  async exportAllData(): Promise<ExportDataResponse> {
    const [
      workRows,
      categoryRows,
      tagRows,
      profileRows,
      settingsRows,
      mediaRows,
    ] = await Promise.all([
      this.db.select().from(works).orderBy(desc(works.createdAt)),
      this.db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.createdAt)),
      this.db.select().from(tags).orderBy(asc(tags.name)),
      this.db.select().from(profile).limit(1),
      this.db.select().from(siteSettings).limit(1),
      this.db.select().from(media).orderBy(desc(media.createdAt)),
    ]);

    const worksList: Work[] = workRows.map((r: WorkSelect) => this.toWork(r));
    await this.attachCategoriesAndTags(worksList);

    const categoryList: Category[] = categoryRows.map((row: typeof categories.$inferSelect) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      coverUrl: row.coverUrl ?? undefined,
      sortOrder: row.sortOrder,
      isVisible: row.isVisible,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    const tagList: Tag[] = tagRows.map((row: typeof tags.$inferSelect) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
    }));

    let profileData: Profile | null = null;
    if (profileRows.length > 0) {
      const row = profileRows[0];
      profileData = {
        id: row.id,
        avatarUrl: row.avatarUrl ?? undefined,
        name: row.name,
        title: row.title ?? undefined,
        tagline: row.tagline ?? undefined,
        bio: row.bio ?? undefined,
        fullBio: row.fullBio ?? undefined,
        workYears: row.workYears ?? undefined,
        location: row.location ?? undefined,
        jobStatus: (row.jobStatus as Profile['jobStatus']) ?? 'open',
        specialties: row.specialties ?? [],
        software: (row.software as unknown as SkillItem[]) ?? [],
        aiTools: (row.aiTools as unknown as SkillItem[]) ?? [],
        phone: row.phone ?? undefined,
        wechat: row.wechat ?? undefined,
        email: row.email ?? undefined,
        website: row.website ?? undefined,
        behance: row.behance ?? undefined,
        zcool: row.zcool ?? undefined,
        github: row.github ?? undefined,
        xiaohongshu: row.xiaohongshu ?? undefined,
        linkedin: row.linkedin ?? undefined,
        showPhone: row.showPhone,
        showWechat: row.showWechat,
        showEmail: row.showEmail,
        showWebsite: row.showWebsite,
        showBehance: row.showBehance,
        showZcool: row.showZcool,
        showGithub: row.showGithub,
        showXiaohongshu: row.showXiaohongshu,
        showLinkedin: row.showLinkedin,
        resumeUrl: row.resumeUrl ?? undefined,
        updatedAt: row.updatedAt.toISOString(),
      };
    }

    let settingsData: SiteSettings | null = null;
    if (settingsRows.length > 0) {
      const row = settingsRows[0];
      const navItems = Array.isArray(row.navItems) && row.navItems.length > 0
        ? (row.navItems as NavItem[])
        : [];
      const homeSections = Array.isArray(row.homeSections) && row.homeSections.length > 0
        ? (row.homeSections as HomeSection[])
        : [];
      const themeConfig = (row.themeConfig && typeof row.themeConfig === 'object')
        ? (row.themeConfig as ThemeConfig)
        : {};
      settingsData = {
        id: row.id,
        siteName: row.siteName,
        logoUrl: row.logoUrl ?? undefined,
        faviconUrl: row.faviconUrl ?? undefined,
        homeTitle: row.homeTitle ?? undefined,
        homeSubtitle: row.homeSubtitle ?? undefined,
        homeIntro: row.homeIntro ?? undefined,
        footerText: row.footerText ?? undefined,
        seoTitle: row.seoTitle ?? undefined,
        seoDescription: row.seoDescription ?? undefined,
        defaultShareImage: row.defaultShareImage ?? undefined,
        navItems,
        homeSections,
        themeConfig,
        customerServiceEnabled: row.customerServiceEnabled,
        bgmUrl: row.bgmUrl ?? undefined,
        bgmEnabled: row.bgmEnabled,
        bgmVolume: row.bgmVolume,
        bgmAutoPlay: row.bgmAutoPlay ?? false,
        cursorStyle: row.cursorStyle,
        homeHotWorksEnabled: row.homeHotWorksEnabled,
        homeHotWorksTitle: row.homeHotWorksTitle,
        homeHotWorksCount: row.homeHotWorksCount,
        homeHotWorksSortOrder: row.homeHotWorksSortOrder,
        autoPopupCsEnabled: row.autoPopupCsEnabled,
        loginCaptchaEnabled: row.loginCaptchaEnabled,
        captchaBgUrl: row.captchaBgUrl ?? undefined,
        watermarkEnabled: false,
         watermarkText: '',
         watermarkOpacity: 0,
         antiDownloadEnabled: row.antiDownloadEnabled ?? true,
        skillMatrix: (row.skillMatrix && typeof row.skillMatrix === 'object')
          ? (row.skillMatrix as SiteSettings['skillMatrix'])
          : { rows: [], cols: [], cells: [] },
        homeCta: (row.homeCta && typeof row.homeCta === 'object')
          ? (row.homeCta as SiteSettings['homeCta'])
          : {},
        updatedAt: row.updatedAt.toISOString(),
      };
    }

    const mediaList = mediaRows.map((row: typeof media.$inferSelect) => ({
      id: row.id,
      fileName: row.fileName,
      fileUrl: row.fileUrl,
      fileSize: Number(row.fileSize),
      mimeType: row.mimeType ?? undefined,
      mediaType: row.mediaType,
    }));

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      works: worksList,
      categories: categoryList,
      tags: tagList,
      profile: profileData,
      siteSettings: settingsData,
      mediaList,
    };
  }
}
