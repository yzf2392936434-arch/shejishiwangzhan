/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { bigint, boolean, date, foreignKey, index, integer, jsonb, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const news = pgTable("news", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  newsDate: date("news_date").notNull().default('CURRENT_DATE'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_news_status").on(table.status),
  index("idx_news_date").on(table.newsDate),
  index("idx_news_sort").on(table.sortOrder, table.newsDate),
]);

export const workFavorites = pgTable("work_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").notNull(),
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_work_favorites_work_visitor").on(table.workId, table.visitorId),
  index("idx_work_favorites_work_id").on(table.workId),
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: "work_favorites_work_id_fkey",
  }).onDelete("cascade"),
]);

export const customerMessages = pgTable("customer_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  visitorName: varchar("visitor_name", { length: 100 }),
  content: text("content").notNull(),
  isAdminReply: boolean("is_admin_reply").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_customer_messages_session").on(table.sessionId),
  index("idx_customer_messages_read").on(table.isRead, table.isAdminReply),
]);

export const workLikes = pgTable("work_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").notNull(),
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_work_likes_work_visitor").on(table.workId, table.visitorId),
  index("idx_work_likes_work_id").on(table.workId),
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: "work_likes_work_id_fkey",
  }).onDelete("cascade"),
]);

export const workViews = pgTable("work_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  workId: uuid("work_id").notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 20 }),
  viewedAt: customTimestamptz("viewed_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_work_views_work_id").on(table.workId),
  index("idx_work_views_date").on(table.viewedAt),
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: "work_views_work_id_fkey",
  }).onDelete("cascade"),
]);

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteName: varchar("site_name", { length: 200 }).notNull().default('Portfolio'),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  homeTitle: varchar("home_title", { length: 255 }),
  homeSubtitle: text("home_subtitle"),
  homeIntro: text("home_intro"),
  footerText: text("footer_text"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  defaultShareImage: text("default_share_image"),
  navItems: jsonb("nav_items").notNull().default('[]'),
  homeSections: jsonb("home_sections").notNull().default('[]'),
  themeConfig: jsonb("theme_config").notNull().default('{}'),
  customerServiceEnabled: boolean("customer_service_enabled").notNull().default(false),
  bgmUrl: text("bgm_url"),
  bgmEnabled: boolean("bgm_enabled").notNull().default(false),
  bgmVolume: integer("bgm_volume").notNull().default(50),
  cursorStyle: varchar("cursor_style", { length: 50 }).notNull().default('none'),
  homeHotWorksEnabled: boolean("home_hot_works_enabled").notNull().default(false),
  homeHotWorksTitle: varchar("home_hot_works_title", { length: 100 }).notNull().default('热门作品'),
  homeHotWorksCount: integer("home_hot_works_count").notNull().default(6),
  homeHotWorksSortOrder: integer("home_hot_works_sort_order").notNull().default(5),
  autoPopupCsEnabled: boolean("auto_popup_cs_enabled").notNull().default(false),
  loginCaptchaEnabled: boolean("login_captcha_enabled").notNull().default(true),
  captchaBgUrl: text("captcha_bg_url"),
  watermarkEnabled: boolean("watermark_enabled").notNull().default(false),
  watermarkText: varchar("watermark_text", { length: 200 }),
  watermarkOpacity: integer("watermark_opacity").notNull().default(15),
  skillMatrix: jsonb("skill_matrix").notNull().default('{}'),
  homeCta: jsonb("home_cta").notNull().default('{}'),
  bgmAutoPlay: boolean("bgm_auto_play").notNull().default(false),
  antiDownloadEnabled: boolean("anti_download_enabled").notNull().default(true),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: bigint("file_size", { mode: 'number' }).notNull().default(0),
  mimeType: varchar("mime_type", { length: 100 }),
  mediaType: varchar("media_type", { length: 20 }).notNull().default('image'),
  width: integer("width"),
  height: integer("height"),
  thumbnailUrl: text("thumbnail_url"),
  usedIn: text("used_in"),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_media_type").on(table.mediaType),
]);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 50 }).default('software'),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_skills_sort").on(table.sortOrder),
]);

export const workExperiences = pgTable("work_experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 200 }).notNull(),
  position: varchar("position", { length: 200 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  description: text("description"),
  projects: text("projects"),
  sortOrder: integer("sort_order").notNull().default(0),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_work_experiences_sort").on(table.sortOrder, table.startDate),
]);

export const profile = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  avatarUrl: text("avatar_url"),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }),
  tagline: varchar("tagline", { length: 255 }),
  bio: text("bio"),
  fullBio: text("full_bio"),
  workYears: integer("work_years"),
  location: varchar("location", { length: 100 }),
  jobStatus: varchar("job_status", { length: 50 }).default('open'),
  specialties: text("specialties").array().notNull().default([]),
  software: jsonb("software").notNull().default('[]'),
  aiTools: jsonb("ai_tools").notNull().default('[]'),
  phone: varchar("phone", { length: 50 }),
  wechat: varchar("wechat", { length: 100 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  behance: varchar("behance", { length: 255 }),
  zcool: varchar("zcool", { length: 255 }),
  github: varchar("github", { length: 255 }),
  xiaohongshu: varchar("xiaohongshu", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  showPhone: boolean("show_phone").notNull().default(false),
  showWechat: boolean("show_wechat").notNull().default(false),
  showEmail: boolean("show_email").notNull().default(true),
  showWebsite: boolean("show_website").notNull().default(false),
  showBehance: boolean("show_behance").notNull().default(false),
  showZcool: boolean("show_zcool").notNull().default(false),
  showGithub: boolean("show_github").notNull().default(false),
  showXiaohongshu: boolean("show_xiaohongshu").notNull().default(false),
  showLinkedin: boolean("show_linkedin").notNull().default(false),
  resumeUrl: text("resume_url"),
  selfIntro: text("self_intro"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workTags = pgTable("work_tags", {
  workId: uuid("work_id").primaryKey(),
  tagId: uuid("tag_id").primaryKey(),
}, (table) => [
  index("idx_work_tags_tag_id").on(table.tagId),
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: "work_tags_work_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.tagId],
    foreignColumns: [tags.id],
    name: "work_tags_tag_id_fkey",
  }).onDelete("cascade"),
]);

export const workCategories = pgTable("work_categories", {
  workId: uuid("work_id").primaryKey(),
  categoryId: uuid("category_id").primaryKey(),
}, (table) => [
  index("idx_work_categories_category_id").on(table.categoryId),
  foreignKey({
    columns: [table.workId],
    foreignColumns: [works.id],
    name: "work_categories_work_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [categories.id],
    name: "work_categories_category_id_fkey",
  }).onDelete("cascade"),
]);

export const works = pgTable("works", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  coverUrl: text("cover_url"),
  images: jsonb("images").notNull().default('[]'),
  videoUrl: text("video_url"),
  videoCoverUrl: text("video_cover_url"),
  summary: text("summary"),
  background: text("background"),
  goal: text("goal"),
  designApproach: text("design_approach"),
  myRole: text("my_role"),
  results: text("results"),
  productionDate: date("production_date"),
  software: text("software").array().notNull().default([]),
  aiTools: text("ai_tools").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  password: varchar("password", { length: 100 }),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  year: integer("year"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  shareTitle: varchar("share_title", { length: 255 }),
  shareCoverUrl: text("share_cover_url"),
  showSummary: boolean("show_summary").notNull().default(true),
  showBackground: boolean("show_background").notNull().default(true),
  showGoal: boolean("show_goal").notNull().default(true),
  showDesignApproach: boolean("show_design_approach").notNull().default(true),
  showMyRole: boolean("show_my_role").notNull().default(true),
  showResults: boolean("show_results").notNull().default(true),
  showProductionDate: boolean("show_production_date").notNull().default(true),
  showSoftware: boolean("show_software").notNull().default(true),
  showAiTools: boolean("show_ai_tools").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  contentBlocks: jsonb("content_blocks").notNull().default('[]'),
  likeCount: integer("like_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  scheduledPublishedAt: customTimestamptz("scheduled_published_at", { precision: 3 }),
  client: varchar("client", { length: 255 }),
  projectType: varchar("project_type", { length: 100 }),
  teamSize: varchar("team_size", { length: 50 }),
  duration: varchar("duration", { length: 100 }),
  clientQuote: text("client_quote"),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("works_slug_key").on(table.slug),
  index("idx_works_status").on(table.status),
  index("idx_works_featured").on(table.isFeatured),
  index("idx_works_sort_order").on(table.sortOrder, table.createdAt),
  index("idx_works_year").on(table.year),
]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("tags_name_key").on(table.name),
]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  deletedAt: customTimestamptz("_deleted_at", { precision: 3 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("categories_slug_key").on(table.slug),
  index("idx_categories_sort_order").on(table.sortOrder),
]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: customTimestamptz("last_login_at", { precision: 6 }),
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("admin_users_username_key").on(table.username),
]);

export const adminUsersTable = adminUsers;
export const categoriesTable = categories;
export const customerMessagesTable = customerMessages;
export const mediaTable = media;
export const newsTable = news;
export const profileTable = profile;
export const siteSettingsTable = siteSettings;
export const skillsTable = skills;
export const tagsTable = tags;
export const workCategoriesTable = workCategories;
export const workExperiencesTable = workExperiences;
export const workFavoritesTable = workFavorites;
export const workLikesTable = workLikes;
export const workTagsTable = workTags;
export const workViewsTable = workViews;
export const worksTable = works;
