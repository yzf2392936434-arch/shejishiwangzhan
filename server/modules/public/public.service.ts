import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, desc, eq, isNull, sql, count, like, or, inArray, arrayContains } from 'drizzle-orm';

import {
  categories,
  profile as profileTable,
  siteSettings,
  workCategories,
  works,
  workTags,
  tags,
  workExperiences,
  skills as skillsTable,
  workViews,
} from '@server/database/schema';
import type {
  Category,
  HomeData,
  HomeSection,
  NavItem,
  Profile,
  PublicWorksFilterParams,
  SiteSettings,
  Tag,
  Work,
  WorkExperience,
  WorkListItem,
  WorkStatus,
  WorksListResponse,
} from '@shared/api.interface';
import type { Skill, SkillItem } from '@shared/api.interface';

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'nav-home', label: '首页', path: '/', isVisible: true, sortOrder: 1 },
  { id: 'nav-about', label: '关于我', path: '/about', isVisible: true, sortOrder: 2 },
  { id: 'nav-contact', label: '联系方式', path: '/contact', isVisible: true, sortOrder: 3 },
  { id: 'nav-works', label: '作品', path: '/works', isVisible: true, sortOrder: 4 },
  { id: 'nav-resume', label: '简历', path: '/resume', isVisible: true, sortOrder: 5 },
];

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: 'section-hero', type: 'hero', isVisible: true, sortOrder: 1, title: '首屏' },
  { id: 'section-about', type: 'about', isVisible: true, sortOrder: 2, title: '关于我' },
  { id: 'section-featured', type: 'featured_works', isVisible: true, sortOrder: 3, title: '精选作品' },
  { id: 'section-pinned', type: 'pinned_works', isVisible: true, sortOrder: 4, title: '代表作' },
  { id: 'section-skill-matrix', type: 'skill_matrix', isVisible: true, sortOrder: 5, title: '能力矩阵' },
  { id: 'section-news', type: 'news_feed', isVisible: true, sortOrder: 6, title: '最新动态' },
  { id: 'section-categories', type: 'categories', isVisible: true, sortOrder: 7, title: '作品分类' },
  { id: 'section-skills', type: 'skills', isVisible: true, sortOrder: 8, title: '技能标签' },
  { id: 'section-contact', type: 'contact', isVisible: true, sortOrder: 9, title: '联系方式' },
];

const DEFAULT_SETTINGS: Omit<SiteSettings, 'id' | 'updatedAt'> = {
  siteName: 'Portfolio',
  logoUrl: undefined,
  faviconUrl: undefined,
  homeTitle: undefined,
  homeSubtitle: undefined,
  homeIntro: undefined,
  footerText: undefined,
  seoTitle: undefined,
  seoDescription: undefined,
  defaultShareImage: undefined,
  navItems: DEFAULT_NAV_ITEMS,
  homeSections: DEFAULT_HOME_SECTIONS,
  themeConfig: {},
  customerServiceEnabled: false,
  bgmUrl: undefined,
  bgmEnabled: false,
  bgmVolume: 50,
  bgmAutoPlay: false,
  cursorStyle: 'none',
  homeHotWorksEnabled: false,
  homeHotWorksTitle: '热门作品',
  homeHotWorksCount: 6,
  homeHotWorksSortOrder: 5,
  autoPopupCsEnabled: false,
  loginCaptchaEnabled: true,
  captchaBgUrl: undefined,
  watermarkEnabled: false,
  watermarkText: 'Portfolio',
  watermarkOpacity: 0.15,
  skillMatrix: { rows: [], cols: [], cells: [] },
  homeCta: {},
  antiDownloadEnabled: true,
};

const DEFAULT_PROFILE: Omit<Profile, 'id' | 'updatedAt'> = {
  avatarUrl: undefined,
  name: '设计师',
  title: undefined,
  tagline: undefined,
  bio: undefined,
  fullBio: undefined,
  workYears: undefined,
  location: undefined,
  jobStatus: 'open',
  specialties: [],
  software: [],
  aiTools: [],
  phone: undefined,
  wechat: undefined,
  email: undefined,
  website: undefined,
  behance: undefined,
  zcool: undefined,
  github: undefined,
  xiaohongshu: undefined,
  linkedin: undefined,
  showPhone: false,
  showWechat: false,
  showEmail: true,
  showWebsite: false,
  showBehance: false,
  showZcool: false,
  showGithub: false,
  showXiaohongshu: false,
  showLinkedin: false,
  resumeUrl: undefined,
};

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private mapSettings(row: typeof siteSettings.$inferSelect): SiteSettings {
    const navItems = Array.isArray(row.navItems) && row.navItems.length > 0
      ? (row.navItems as NavItem[])
      : DEFAULT_NAV_ITEMS;
    const dbSections: HomeSection[] = Array.isArray(row.homeSections) && row.homeSections.length > 0
      ? (row.homeSections as HomeSection[])
      : [];
    const existingTypes = new Set(dbSections.map((s: HomeSection) => s.type));
    const missingDefaults = DEFAULT_HOME_SECTIONS.filter(
      (s: HomeSection) => !existingTypes.has(s.type),
    );
    const homeSections = [...dbSections, ...missingDefaults].sort(
      (a: HomeSection, b: HomeSection) => a.sortOrder - b.sortOrder,
    );
    const themeConfig = (row.themeConfig && typeof row.themeConfig === 'object')
      ? (row.themeConfig as SiteSettings['themeConfig'])
      : {};
    return {
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
      customerServiceEnabled: row.customerServiceEnabled ?? false,
      bgmUrl: row.bgmUrl ?? undefined,
      bgmEnabled: row.bgmEnabled ?? false,
      bgmVolume: row.bgmVolume ?? 50,
      bgmAutoPlay: row.bgmAutoPlay ?? false,
      cursorStyle: row.cursorStyle ?? 'none',
      homeHotWorksEnabled: row.homeHotWorksEnabled ?? false,
      homeHotWorksTitle: row.homeHotWorksTitle ?? '热门作品',
      homeHotWorksCount: row.homeHotWorksCount ?? 6,
      homeHotWorksSortOrder: row.homeHotWorksSortOrder ?? 5,
      autoPopupCsEnabled: row.autoPopupCsEnabled ?? false,
      loginCaptchaEnabled: row.loginCaptchaEnabled ?? true,
      captchaBgUrl: row.captchaBgUrl ?? undefined,
      watermarkEnabled: row.watermarkEnabled ?? false,
      watermarkText: row.watermarkText ?? undefined,
      watermarkOpacity: row.watermarkOpacity ?? 15,
      skillMatrix: (row.skillMatrix && typeof row.skillMatrix === 'object')
        ? (row.skillMatrix as SiteSettings['skillMatrix'])
        : { rows: [], cols: [], cells: [] },
      homeCta: (row.homeCta && typeof row.homeCta === 'object')
        ? (row.homeCta as SiteSettings['homeCta'])
        : {},
      antiDownloadEnabled: row.antiDownloadEnabled ?? true,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings(): Promise<SiteSettings> {
    const rows = await this.db.select().from(siteSettings).limit(1);
    if (rows.length === 0) {
      return {
        ...DEFAULT_SETTINGS,
        id: '',
        updatedAt: new Date().toISOString(),
      };
    }
    return this.mapSettings(rows[0]);
  }

  private mapProfile(row: typeof profileTable.$inferSelect): Profile {
    const softwareArr: unknown[] = Array.isArray(row.software) ? row.software : [];
    const aiToolsArr: unknown[] = Array.isArray(row.aiTools) ? row.aiTools : [];

    return {
      id: row.id,
      avatarUrl: row.avatarUrl ?? undefined,
      name: row.name,
      title: row.title ?? undefined,
      tagline: row.tagline ?? undefined,
      bio: row.bio ?? undefined,
      fullBio: row.fullBio ?? undefined,
      workYears: row.workYears ?? undefined,
      location: row.location ?? undefined,
      jobStatus: row.jobStatus as Profile['jobStatus'],
      specialties: row.specialties ?? [],
      software: softwareArr as SkillItem[],
      aiTools: aiToolsArr as SkillItem[],
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
      selfIntro: row.selfIntro ?? undefined,
      resumeUrl: row.resumeUrl ?? undefined,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private filterPublicProfile(profile: Profile): Profile {
    const result: Profile = { ...profile };
    if (!profile.showPhone) result.phone = undefined;
    if (!profile.showWechat) result.wechat = undefined;
    if (!profile.showEmail) result.email = undefined;
    if (!profile.showWebsite) result.website = undefined;
    if (!profile.showBehance) result.behance = undefined;
    if (!profile.showZcool) result.zcool = undefined;
    if (!profile.showGithub) result.github = undefined;
    if (!profile.showXiaohongshu) result.xiaohongshu = undefined;
    if (!profile.showLinkedin) result.linkedin = undefined;
    return result;
  }

  async getProfile(): Promise<Profile> {
    const rows = await this.db.select().from(profileTable).limit(1);
    if (rows.length === 0) {
      return {
        ...DEFAULT_PROFILE,
        id: '',
        updatedAt: new Date().toISOString(),
      };
    }
    return this.filterPublicProfile(this.mapProfile(rows[0]));
  }

  private mapCategory(row: typeof categories.$inferSelect): Category {
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

  async getVisibleCategories(): Promise<Category[]> {
    const rows = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.isVisible, true), isNull(categories.deletedAt)))
      .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

    return rows.map((row: typeof categories.$inferSelect) => this.mapCategory(row));
  }

  private async attachCategoriesAndTags(worksList: typeof works.$inferSelect[]): Promise<{
    categoriesByWork: Map<string, Category[]>;
    tagsByWork: Map<string, Tag[]>;
  }> {
    const workIds = worksList.map((w: typeof works.$inferSelect) => w.id);

    const categoriesByWork = new Map<string, Category[]>();
    const tagsByWork = new Map<string, Tag[]>();

    if (workIds.length === 0) {
      return { categoriesByWork, tagsByWork };
    }

    const workCatRows = await this.db
      .select({
        workId: workCategories.workId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        coverUrl: categories.coverUrl,
        sortOrder: categories.sortOrder,
        isVisible: categories.isVisible,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(workCategories)
      .innerJoin(categories, eq(workCategories.categoryId, categories.id))
      .where(and(isNull(categories.deletedAt)))
      .orderBy(asc(categories.sortOrder));

    for (const row of workCatRows) {
      const cat: Category = {
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
      categoriesByWork.set(row.workId, [
        ...(categoriesByWork.get(row.workId) ?? []),
        cat,
      ]);
    }

    const workTagRows = await this.db
      .select({
        workId: workTags.workId,
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
      })
      .from(workTags)
      .innerJoin(tags, eq(workTags.tagId, tags.id))
      .where(isNull(tags.deletedAt));

    for (const row of workTagRows) {
      const tag: Tag = {
        id: row.id,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
      };
      tagsByWork.set(row.workId, [
        ...(tagsByWork.get(row.workId) ?? []),
        tag,
      ]);
    }

    return { categoriesByWork, tagsByWork };
  }

  private mapWorkListItem(
    row: typeof works.$inferSelect,
    categoriesArr: Category[],
    tagsArr: Tag[],
  ): WorkListItem {
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
      likeCount: row.likeCount ?? 0,
      viewCount: row.viewCount ?? 0,
      favoriteCount: row.favoriteCount ?? 0,
      categories: categoriesArr,
      tags: tagsArr,
      software: Array.isArray(row.software) ? row.software : [],
      aiTools: Array.isArray(row.aiTools) ? row.aiTools : [],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getFeaturedWorks(limit: number = 8): Promise<WorkListItem[]> {
    const rows = await this.db
      .select()
      .from(works)
      .where(
        and(
          eq(works.status, 'published'),
          eq(works.isFeatured, true),
          isNull(works.deletedAt),
        ),
      )
      .orderBy(desc(works.sortOrder), desc(works.createdAt))
      .limit(limit);

    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(rows);

    return rows.map((row: typeof works.$inferSelect) =>
      this.mapWorkListItem(
        row,
        categoriesByWork.get(row.id) ?? [],
        tagsByWork.get(row.id) ?? [],
      ),
    );
  }

  async getWorkExperiences(): Promise<WorkExperience[]> {
    const rows = await this.db
      .select()
      .from(workExperiences)
      .where(isNull(workExperiences.deletedAt))
      .orderBy(desc(workExperiences.sortOrder), desc(workExperiences.startDate));

    return rows.map((row) => ({
      id: row.id,
      company: row.company,
      position: row.position,
      startDate: String(row.startDate),
      endDate: row.endDate ? String(row.endDate) : undefined,
      isCurrent: row.isCurrent,
      description: row.description ?? undefined,
      projects: row.projects ?? undefined,
      sortOrder: row.sortOrder,
    }));
  }

  async getSkills(): Promise<Skill[]> {
    const rows = await this.db
      .select()
      .from(skillsTable)
      .where(isNull(skillsTable.deletedAt))
      .orderBy(asc(skillsTable.sortOrder), asc(skillsTable.createdAt));

    return rows.map((row: typeof skillsTable.$inferSelect) => ({
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      description: row.description ?? undefined,
      category: (row.category as Skill['category']) ?? 'other',
      sortOrder: row.sortOrder,
    }));
  }

  async getTags(): Promise<Tag[]> {
    const rows = await this.db
      .select()
      .from(tags)
      .where(isNull(tags.deletedAt))
      .orderBy(asc(tags.name));

    return rows.map((row: typeof tags.$inferSelect) => ({
       id: row.id,
       name: row.name,
       createdAt: row.createdAt.toISOString(),
     }));
  }

  async getPublicWorks(params: PublicWorksFilterParams): Promise<WorksListResponse> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 12, 50);
    const offset = (page - 1) * pageSize;

    const baseConditions = [
      eq(works.status, 'published' as const),
      isNull(works.deletedAt),
    ];

    let filteredWorkIds: string[] | null = null;

    if (params.category) {
      const catRows = await this.db
        .select({ workId: workCategories.workId })
        .from(workCategories)
        .innerJoin(categories, eq(workCategories.categoryId, categories.id))
        .where(eq(categories.slug, params.category));
      const ids = catRows.map((r) => r.workId);
      filteredWorkIds = filteredWorkIds === null
        ? ids
        : filteredWorkIds.filter((id) => ids.includes(id));
    }

    if (params.tag) {
      const tagRows = await this.db
        .select({ workId: workTags.workId })
        .from(workTags)
        .innerJoin(tags, eq(workTags.tagId, tags.id))
        .where(eq(tags.name, params.tag));
      const ids = tagRows.map((r) => r.workId);
      filteredWorkIds = filteredWorkIds === null
        ? ids
        : filteredWorkIds.filter((id) => ids.includes(id));
    }

    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      const titleMatchRows = await this.db
        .select({ id: works.id })
        .from(works)
        .where(
          and(
            eq(works.status, 'published' as const),
            isNull(works.deletedAt),
            or(
              like(works.title, kw),
              like(works.summary, kw),
            ),
          ),
        );
      const titleMatchIds = titleMatchRows.map((r) => r.id);

      const catMatchRows = await this.db
        .select({ workId: workCategories.workId })
        .from(workCategories)
        .innerJoin(categories, eq(workCategories.categoryId, categories.id))
        .where(like(categories.name, kw));
      const catMatchIds = catMatchRows.map((r) => r.workId);

      const tagMatchRows = await this.db
        .select({ workId: workTags.workId })
        .from(workTags)
        .innerJoin(tags, eq(workTags.tagId, tags.id))
        .where(like(tags.name, kw));
      const tagMatchIds = tagMatchRows.map((r) => r.workId);

      const keywordIds = [...new Set([...titleMatchIds, ...catMatchIds, ...tagMatchIds])];
      filteredWorkIds = filteredWorkIds === null
        ? keywordIds
        : filteredWorkIds.filter((id) => keywordIds.includes(id));
    }

    const whereConditions = [...baseConditions];

    if (params.year) {
      whereConditions.push(eq(works.year, params.year));
    }

    if (params.software) {
      whereConditions.push(arrayContains(works.software, [params.software]));
    }

    if (params.aiTool) {
      whereConditions.push(arrayContains(works.aiTools, [params.aiTool]));
    }

    if (filteredWorkIds !== null && filteredWorkIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }
    if (filteredWorkIds !== null) {
      whereConditions.push(inArray(works.id, filteredWorkIds));
    }

    const [allRows, countResult] = await Promise.all([
      this.db
        .select()
        .from(works)
        .where(and(...whereConditions))
        .orderBy(desc(works.isPinned), desc(works.sortOrder), desc(works.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(works)
        .where(and(...whereConditions)),
    ]);

    const total = Number(countResult[0]?.value ?? 0);
    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(allRows);

    const items: WorkListItem[] = allRows.map((row) =>
      this.mapWorkListItem(
        row,
        categoriesByWork.get(row.id) ?? [],
        tagsByWork.get(row.id) ?? [],
      ),
    );

    return { items, total, page, pageSize };
  }

  private mapWorkDetail(
    row: typeof works.$inferSelect,
    categoriesArr: Category[],
    tagsArr: Tag[],
  ): Work {
    const imagesArr: unknown[] = Array.isArray(row.images) ? row.images : [];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      coverUrl: row.coverUrl ?? undefined,
      contentBlocks: (row.contentBlocks ?? []) as Work['contentBlocks'],
      images: imagesArr as Work['images'],
      videoUrl: row.videoUrl ?? undefined,
      videoCoverUrl: row.videoCoverUrl ?? undefined,
      summary: row.summary ?? undefined,
      background: row.background ?? undefined,
      goal: row.goal ?? undefined,
      designApproach: row.designApproach ?? undefined,
      myRole: row.myRole ?? undefined,
      results: row.results ?? undefined,
      productionDate: row.productionDate
        ? String(row.productionDate)
        : undefined,
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
      likeCount: row.likeCount ?? 0,
      favoriteCount: row.favoriteCount ?? 0,
      categories: categoriesArr,
      tags: tagsArr,
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
    };
  }

  async getWorkBySlug(slug: string): Promise<Work> {
    const rows = await this.db
      .select()
      .from(works)
      .where(
        and(
          eq(works.slug, slug),
          eq(works.status, 'published'),
          isNull(works.deletedAt),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('作品不存在或已下线');
    }

    const row = rows[0];
    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags([row]);

    return this.mapWorkDetail(
      row,
      categoriesByWork.get(row.id) ?? [],
      tagsByWork.get(row.id) ?? [],
    );
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
      .where(
        and(
          eq(works.status, 'published'),
          isNull(works.deletedAt),
        ),
      )
      .orderBy(sql`${works.likeCount} * 2 + ${works.viewCount} DESC`, desc(works.createdAt))
      .limit(limit);

    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(rows);

    return rows.map((row: typeof works.$inferSelect) =>
      this.mapWorkListItem(
        row,
        categoriesByWork.get(row.id) ?? [],
        tagsByWork.get(row.id) ?? [],
      ),
    );
  }

  async getRelatedWorksBySlug(slug: string, limit: number = 6): Promise<WorkListItem[]> {
    const workRow = await this.db
      .select({ id: works.id })
      .from(works)
      .where(
        and(
          eq(works.slug, slug),
          eq(works.status, 'published'),
          isNull(works.deletedAt),
        ),
      )
      .limit(1);

    if (workRow.length === 0) return [];

    return this.getRelatedWorks(workRow[0].id, limit);
  }

  async getRelatedWorks(workId: string, limit: number = 4): Promise<WorkListItem[]> {
    const [categoryRows, tagRows] = await Promise.all([
      this.db
        .select({ categoryId: workCategories.categoryId })
        .from(workCategories)
        .where(eq(workCategories.workId, workId)),
      this.db
        .select({ tagId: workTags.tagId })
        .from(workTags)
        .where(eq(workTags.workId, workId)),
    ]);

    const categoryIds = categoryRows.map((r: { categoryId: string }) => r.categoryId);
    const tagIds = tagRows.map((r: { tagId: string }) => r.tagId);

    if (categoryIds.length === 0 && tagIds.length === 0) {
      const recent = await this.db
        .select()
        .from(works)
        .where(
          and(
            eq(works.status, 'published'),
            isNull(works.deletedAt),
            sql`${works.id} != ${workId}`,
          ),
        )
        .orderBy(desc(works.createdAt))
        .limit(limit);
      const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(recent);
      return recent.map((row: typeof works.$inferSelect) =>
        this.mapWorkListItem(
          row,
          categoriesByWork.get(row.id) ?? [],
          tagsByWork.get(row.id) ?? [],
        ),
      );
    }

    const catPlaceholders = categoryIds.length > 0
      ? sql.join(categoryIds.map((id: string) => sql`${id}`), sql`, `)
      : sql`NULL`;
    const tagPlaceholders = tagIds.length > 0
      ? sql.join(tagIds.map((id: string) => sql`${id}`), sql`, `)
      : sql`NULL`;

    const relatedRows = await this.db
      .select({
        id: works.id,
        matchScore: sql<number>`(
          SELECT COUNT(*) FROM ${workCategories}
          WHERE ${workCategories.workId} = ${works.id}
          AND ${workCategories.categoryId} IN (${catPlaceholders})
        ) + (
          SELECT COUNT(*) FROM ${workTags}
          WHERE ${workTags.workId} = ${works.id}
          AND ${workTags.tagId} IN (${tagPlaceholders})
        )`,
      })
      .from(works)
      .where(
        and(
          eq(works.status, 'published'),
          isNull(works.deletedAt),
          sql`${works.id} != ${workId}`,
          sql`(
            ${works.id} IN (SELECT ${workCategories.workId} FROM ${workCategories} WHERE ${workCategories.categoryId} IN (${catPlaceholders}))
            OR ${works.id} IN (SELECT ${workTags.workId} FROM ${workTags} WHERE ${workTags.tagId} IN (${tagPlaceholders}))
          )`,
        ),
      )
      .orderBy(
        sql`(
          SELECT COUNT(*) FROM ${workCategories}
          WHERE ${workCategories.workId} = ${works.id}
          AND ${workCategories.categoryId} IN (${catPlaceholders})
        ) + (
          SELECT COUNT(*) FROM ${workTags}
          WHERE ${workTags.workId} = ${works.id}
          AND ${workTags.tagId} IN (${tagPlaceholders})
        ) DESC`,
        desc(works.createdAt),
      )
       .limit(limit);

    if (relatedRows.length === 0) {
      const recent = await this.db
        .select()
        .from(works)
        .where(
          and(
            eq(works.status, 'published' as const),
            isNull(works.deletedAt),
            sql`${works.id} != ${workId}`,
          ),
        )
        .orderBy(desc(works.createdAt))
        .limit(limit);
      const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(recent);
      return recent.map((row) =>
        this.mapWorkListItem(
          row,
          categoriesByWork.get(row.id) ?? [],
          tagsByWork.get(row.id) ?? [],
        ),
      );
    }

    const relatedIds = relatedRows.map((r) => r.id);
    const workResult = await this.db
      .select()
      .from(works)
      .where(inArray(works.id, relatedIds));

    const sortedRows = relatedIds
      .map((id) => workResult.find((w) => w.id === id))
      .filter(Boolean) as typeof works.$inferSelect[];

    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags(sortedRows);
    return sortedRows.map((row) =>
      this.mapWorkListItem(
        row,
        categoriesByWork.get(row.id) ?? [],
        tagsByWork.get(row.id) ?? [],
      ),
    );
  }

  async verifyWorkPassword(
    slug: string,
    password: string,
  ): Promise<{ success: boolean; work?: Work }> {
    const rows = await this.db
      .select()
      .from(works)
      .where(
        and(
          eq(works.slug, slug),
          eq(works.status, 'password'),
          isNull(works.deletedAt),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return { success: false };
    }

    const row = rows[0];
    if (row.password !== password) {
      return { success: false };
    }

    const { categoriesByWork, tagsByWork } = await this.attachCategoriesAndTags([row]);
    const work = this.mapWorkDetail(
      row,
      categoriesByWork.get(row.id) ?? [],
      tagsByWork.get(row.id) ?? [],
    );

    return { success: true, work };
  }

  async getHomeData(): Promise<HomeData> {
    const [settings, profile, featuredWorks, categoryList] = await Promise.all([
      this.getSettings(),
      this.getProfile(),
      this.getFeaturedWorks(8),
      this.getVisibleCategories(),
    ]);

    return {
      settings,
      profile,
      featuredWorks,
      categories: categoryList,
    };
  }
}
