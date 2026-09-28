import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';

import { siteSettings } from '@server/database/schema';
import type {
  HomeCtaConfig,
  HomeSection,
  NavItem,
  SiteSettings,
  SiteSettingsUpdateRequest,
  SkillMatrix,
  ThemeConfig,
} from '@shared/api.interface';

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
  { id: 'section-contact', type: 'contact', isVisible: true, sortOrder: 3, title: '联系方式' },
  { id: 'section-featured', type: 'featured_works', isVisible: true, sortOrder: 4, title: '精选作品' },
  { id: 'section-categories', type: 'categories', isVisible: true, sortOrder: 5, title: '作品分类' },
  { id: 'section-skills', type: 'skills', isVisible: true, sortOrder: 6, title: '技能标签' },
  { id: 'section-pinned-works', type: 'pinned_works', isVisible: true, sortOrder: 7, title: '代表作' },
  { id: 'section-skill-matrix', type: 'skill_matrix', isVisible: true, sortOrder: 8, title: '能力矩阵' },
  { id: 'section-news-feed', type: 'news_feed', isVisible: true, sortOrder: 9, title: '最新动态' },
];

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  preset: 'minimal',
};

const DEFAULT_SKILL_MATRIX: SkillMatrix = {
  rows: [],
  cols: [],
  cells: [],
};

const DEFAULT_HOME_CTA: HomeCtaConfig = {};

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
  themeConfig: DEFAULT_THEME_CONFIG,
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
  watermarkOpacity: 15,
  skillMatrix: DEFAULT_SKILL_MATRIX,
  homeCta: DEFAULT_HOME_CTA,
  antiDownloadEnabled: true,
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async get(): Promise<SiteSettings> {
    const rows = await this.db.select().from(siteSettings).limit(1);
    if (rows.length === 0) {
      return {
        ...DEFAULT_SETTINGS,
        id: '',
        updatedAt: new Date().toISOString(),
      };
    }
    const row = rows[0];
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
      ? (row.themeConfig as ThemeConfig)
      : DEFAULT_THEME_CONFIG;
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
      watermarkEnabled: row.watermarkEnabled,
      watermarkText: row.watermarkText ?? undefined,
      watermarkOpacity: row.watermarkOpacity,
      skillMatrix: (row.skillMatrix && typeof row.skillMatrix === 'object')
        ? (row.skillMatrix as SkillMatrix)
        : DEFAULT_SKILL_MATRIX,
      homeCta: (row.homeCta && typeof row.homeCta === 'object')
        ? (row.homeCta as HomeCtaConfig)
        : DEFAULT_HOME_CTA,
      antiDownloadEnabled: row.antiDownloadEnabled ?? true,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async update(dto: SiteSettingsUpdateRequest): Promise<SiteSettings> {
    const existing = await this.db.select({ id: siteSettings.id }).from(siteSettings).limit(1);

    const patch: Partial<typeof siteSettings.$inferInsert> = {};
    if (dto.siteName !== undefined) patch.siteName = dto.siteName;
    if (dto.logoUrl !== undefined) patch.logoUrl = dto.logoUrl;
    if (dto.faviconUrl !== undefined) patch.faviconUrl = dto.faviconUrl;
    if (dto.homeTitle !== undefined) patch.homeTitle = dto.homeTitle;
    if (dto.homeSubtitle !== undefined) patch.homeSubtitle = dto.homeSubtitle;
    if (dto.homeIntro !== undefined) patch.homeIntro = dto.homeIntro;
    if (dto.footerText !== undefined) patch.footerText = dto.footerText;
    if (dto.seoTitle !== undefined) patch.seoTitle = dto.seoTitle;
    if (dto.seoDescription !== undefined) patch.seoDescription = dto.seoDescription;
    if (dto.defaultShareImage !== undefined) patch.defaultShareImage = dto.defaultShareImage;
    if (dto.navItems !== undefined) patch.navItems = JSON.stringify(dto.navItems) as any;
    if (dto.homeSections !== undefined) patch.homeSections = JSON.stringify(dto.homeSections) as any;
    if (dto.themeConfig !== undefined) patch.themeConfig = JSON.stringify(dto.themeConfig) as any;
    if (dto.customerServiceEnabled !== undefined) patch.customerServiceEnabled = dto.customerServiceEnabled;
    if (dto.bgmUrl !== undefined) patch.bgmUrl = dto.bgmUrl;
    if (dto.bgmEnabled !== undefined) patch.bgmEnabled = dto.bgmEnabled;
    if (dto.bgmVolume !== undefined) patch.bgmVolume = dto.bgmVolume;
    if (dto.bgmAutoPlay !== undefined) patch.bgmAutoPlay = dto.bgmAutoPlay;
    if (dto.cursorStyle !== undefined) patch.cursorStyle = dto.cursorStyle;
    if (dto.homeHotWorksEnabled !== undefined) patch.homeHotWorksEnabled = dto.homeHotWorksEnabled;
    if (dto.homeHotWorksTitle !== undefined) patch.homeHotWorksTitle = dto.homeHotWorksTitle;
    if (dto.homeHotWorksCount !== undefined) patch.homeHotWorksCount = dto.homeHotWorksCount;
    if (dto.homeHotWorksSortOrder !== undefined) patch.homeHotWorksSortOrder = dto.homeHotWorksSortOrder;
    if (dto.autoPopupCsEnabled !== undefined) patch.autoPopupCsEnabled = dto.autoPopupCsEnabled;
    if (dto.loginCaptchaEnabled !== undefined) patch.loginCaptchaEnabled = dto.loginCaptchaEnabled;
    if (dto.captchaBgUrl !== undefined) patch.captchaBgUrl = dto.captchaBgUrl;
    if (dto.watermarkEnabled !== undefined) patch.watermarkEnabled = dto.watermarkEnabled;
    if (dto.watermarkText !== undefined) patch.watermarkText = dto.watermarkText;
    if (dto.watermarkOpacity !== undefined) patch.watermarkOpacity = dto.watermarkOpacity;
    if (dto.skillMatrix !== undefined) patch.skillMatrix = JSON.stringify(dto.skillMatrix) as any;
    if (dto.homeCta !== undefined) patch.homeCta = JSON.stringify(dto.homeCta) as any;
    if (dto.antiDownloadEnabled !== undefined) patch.antiDownloadEnabled = dto.antiDownloadEnabled;

    patch.updatedAt = new Date();

    let result: typeof siteSettings.$inferSelect;

    if (existing.length === 0) {
      const inserted = await this.db
        .insert(siteSettings)
        .values(patch as typeof siteSettings.$inferInsert)
        .returning();
      result = inserted[0];
      this.logger.log('Created initial site settings record');
    } else {
      const updated = await this.db
        .update(siteSettings)
        .set(patch)
        .where(eq(siteSettings.id, existing[0].id))
        .returning();
      result = updated[0];
      this.logger.log(`Updated site settings: ${result.id}`);
    }

    return {
      id: result.id,
      siteName: result.siteName,
      logoUrl: result.logoUrl ?? undefined,
      faviconUrl: result.faviconUrl ?? undefined,
      homeTitle: result.homeTitle ?? undefined,
      homeSubtitle: result.homeSubtitle ?? undefined,
      homeIntro: result.homeIntro ?? undefined,
      footerText: result.footerText ?? undefined,
      seoTitle: result.seoTitle ?? undefined,
      seoDescription: result.seoDescription ?? undefined,
      defaultShareImage: result.defaultShareImage ?? undefined,
      navItems: Array.isArray(result.navItems) && result.navItems.length > 0
        ? (result.navItems as NavItem[])
        : DEFAULT_NAV_ITEMS,
      homeSections: Array.isArray(result.homeSections) && result.homeSections.length > 0
        ? (result.homeSections as HomeSection[])
        : DEFAULT_HOME_SECTIONS,
      themeConfig: (result.themeConfig && typeof result.themeConfig === 'object')
        ? (result.themeConfig as ThemeConfig)
        : DEFAULT_THEME_CONFIG,
      customerServiceEnabled: result.customerServiceEnabled,
      bgmUrl: result.bgmUrl ?? undefined,
      bgmEnabled: result.bgmEnabled,
      bgmVolume: result.bgmVolume,
      bgmAutoPlay: result.bgmAutoPlay ?? false,
      cursorStyle: result.cursorStyle,
      homeHotWorksEnabled: result.homeHotWorksEnabled,
      homeHotWorksTitle: result.homeHotWorksTitle,
      homeHotWorksCount: result.homeHotWorksCount,
      homeHotWorksSortOrder: result.homeHotWorksSortOrder,
      autoPopupCsEnabled: result.autoPopupCsEnabled,
      loginCaptchaEnabled: result.loginCaptchaEnabled,
      captchaBgUrl: result.captchaBgUrl ?? undefined,
      watermarkEnabled: result.watermarkEnabled,
      watermarkText: result.watermarkText ?? undefined,
      watermarkOpacity: result.watermarkOpacity,
      skillMatrix: (result.skillMatrix && typeof result.skillMatrix === 'object')
        ? (result.skillMatrix as SkillMatrix)
        : DEFAULT_SKILL_MATRIX,
      homeCta: (result.homeCta && typeof result.homeCta === 'object')
        ? (result.homeCta as HomeCtaConfig)
        : DEFAULT_HOME_CTA,
      antiDownloadEnabled: result.antiDownloadEnabled ?? true,
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
