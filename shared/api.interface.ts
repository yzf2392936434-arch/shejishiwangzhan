// 作品状态
export type WorkStatus = 'draft' | 'published' | 'hidden' | 'password';

// 求职状态
export type JobStatus = 'open' | 'closed' | 'freelance';

// 媒体类型
export type MediaType = 'image' | 'video' | 'pdf' | 'other';

// 作品图片
export interface WorkImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export type WorkContentBlockType = 'text' | 'image' | 'video' | 'heading' | 'decision' | 'metric' | 'quote' | 'background' | 'divider' | 'pullquote' | 'dropcap' | 'twocolumn';

export interface WorkContentBlock {
  id: string;
  type: WorkContentBlockType;
  text?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  coverUrl?: string;
  level?: 1 | 2 | 3;
  decision?: string;
  reason?: string;
  rejectedOption?: string;
  decisionNumber?: number;
  metricValue?: string;
  metricLabel?: string;
  metricSubtext?: string;
  quoteText?: string;
  quoteAuthor?: string;
  quoteRole?: string;
  anchorId?: string;
  anchorTitle?: string;
}

export interface SkillItem {
  name: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  images: WorkImage[];
  videoUrl?: string;
  videoCoverUrl?: string;
  summary?: string;
  background?: string;
  goal?: string;
  designApproach?: string;
  myRole?: string;
  results?: string;
  productionDate?: string;
  client?: string;
  projectType?: string;
  teamSize?: string;
  duration?: string;
  clientQuote?: string;
  software: string[];
  aiTools: string[];
  status: WorkStatus;
  isFeatured: boolean;
  isPinned: boolean;
  sortOrder: number;
  year?: number;
  seoTitle?: string;
  seoDescription?: string;
  shareTitle?: string;
  shareCoverUrl?: string;
  contentBlocks: WorkContentBlock[];
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  categories: Category[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  showSummary: boolean;
  showBackground: boolean;
  showGoal: boolean;
  showDesignApproach: boolean;
  showMyRole: boolean;
  showResults: boolean;
  showProductionDate: boolean;
  showSoftware: boolean;
  showAiTools: boolean;
  scheduledPublishedAt?: string;
}

export interface WorkListItem {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string;
  summary?: string;
  status: WorkStatus;
  isFeatured: boolean;
  isPinned: boolean;
  year?: number;
  likeCount: number;
  viewCount: number;
  favoriteCount: number;
  categories: Category[];
  tags: Tag[];
  software: string[];
  aiTools: string[];
  createdAt: string;
}

export interface WorksListResponse {
  items: WorkListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Profile {
  id: string;
  avatarUrl?: string;
  name: string;
  title?: string;
  tagline?: string;
  bio?: string;
  fullBio?: string;
  selfIntro?: string;
  workYears?: number;
  location?: string;
  jobStatus: JobStatus;
  specialties: string[];
  software: SkillItem[];
  aiTools: SkillItem[];
  phone?: string;
  wechat?: string;
  email?: string;
  website?: string;
  behance?: string;
  zcool?: string;
  github?: string;
  xiaohongshu?: string;
  linkedin?: string;
  showPhone: boolean;
  showWechat: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showBehance: boolean;
  showZcool: boolean;
  showGithub: boolean;
  showXiaohongshu: boolean;
  showLinkedin: boolean;
  resumeUrl?: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  projects?: string;
  sortOrder: number;
}

export interface Skill {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  category: 'software' | 'ai' | 'other';
  sortOrder: number;
}

export type NewsStatus = 'draft' | 'published';

export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  newsDate: string;
  status: NewsStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType?: string;
  mediaType: MediaType;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  usedIn?: string;
  createdAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  isVisible: boolean;
  sortOrder: number;
  isCustom?: boolean;
  icon?: string;
}

export interface HomeSection {
  id: string;
  type: string;
  isVisible: boolean;
  sortOrder: number;
  title?: string;
}

export interface SkillMatrixCell {
  rowId: string;
  colId: string;
  level: 0 | 1 | 2;
}

export interface SkillMatrix {
  rows: { id: string; label: string }[];
  cols: { id: string; label: string }[];
  cells: SkillMatrixCell[];
}

export interface HomeCtaConfig {
  resumeButtonText?: string;
  contactButtonText?: string;
  resumeMode?: 'download' | 'view';
}

export interface SiteSettings {
  id: string;
  siteName: string;
  logoUrl?: string;
  faviconUrl?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  homeIntro?: string;
  footerText?: string;
  seoTitle?: string;
  seoDescription?: string;
  defaultShareImage?: string;
  navItems: NavItem[];
  homeSections: HomeSection[];
  themeConfig: ThemeConfig;
  customerServiceEnabled: boolean;
  bgmUrl?: string;
  bgmEnabled: boolean;
  bgmVolume: number;
  bgmAutoPlay: boolean;
  cursorStyle: string;
  homeHotWorksEnabled: boolean;
  homeHotWorksTitle: string;
  homeHotWorksCount: number;
  homeHotWorksSortOrder: number;
  autoPopupCsEnabled: boolean;
  loginCaptchaEnabled: boolean;
  captchaBgUrl?: string;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  skillMatrix: SkillMatrix;
  homeCta: HomeCtaConfig;
  antiDownloadEnabled: boolean;
  updatedAt: string;
}

export interface ThemeConfig {
  preset?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  navColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  linkColor?: string;
  borderColor?: string;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VisitStats {
  totalVisits: number;
  last7Days: number;
  last30Days: number;
  today: number;
  deviceStats: { mobile: number; desktop: number; tablet: number; };
  popularWorks: { workId: string; workTitle: string; views: number; }[];
  dailyTrend: { date: string; views: number; }[];
}

export interface DashboardStats {
  totalWorks: number;
  publishedWorks: number;
  draftWorks: number;
  hiddenWorks: number;
  passwordWorks: number;
  totalCategories: number;
  totalMedia: number;
  totalViews: number;
  totalLikes: number;
  totalFavorites: number;
  unreadMessages: number;
  recentWorks: WorkListItem[];
  popularWorks: WorkListItem[];
  visitStats: VisitStats;
}

export interface PublicWorksFilterParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  year?: number;
  keyword?: string;
  software?: string;
  aiTool?: string;
}

export interface ChangeUsernameRequest {
  newUsername: string;
  password: string;
}

export interface HomeData {
  settings: SiteSettings;
  profile: Profile;
  featuredWorks: WorkListItem[];
  categories: Category[];
}

export interface SearchResponse {
  items: WorkListItem[];
  total: number;
  keyword: string;
}

export interface CustomerMessage {
  id: string;
  sessionId: string;
  visitorName?: string;
  content: string;
  isAdminReply: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerSession {
  sessionId: string;
  visitorName?: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: CustomerMessage[];
}

export interface CustomerMessageAdminItem {
  id: string;
  sessionId: string;
  visitorName?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captchaToken?: string;
}

export interface SliderCaptchaChallengeResponse {
  challenge: string;
}

export interface SliderCaptchaVerifyResponse {
  success: boolean;
  message?: string;
  refresh?: boolean;
  token?: string;
}

export interface LoginResponse {
  success: boolean;
  user: { id: string; username: string; };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface WorkUpsertRequest {
  title: string;
  slug: string;
  coverUrl?: string;
  images?: WorkImage[];
  videoUrl?: string;
  videoCoverUrl?: string;
  summary?: string;
  background?: string;
  goal?: string;
  designApproach?: string;
  myRole?: string;
  results?: string;
  productionDate?: string;
  client?: string;
  projectType?: string;
  teamSize?: string;
  duration?: string;
  clientQuote?: string;
  software?: string[];
  aiTools?: string[];
  status?: WorkStatus;
  password?: string;
  isFeatured?: boolean;
  isPinned?: boolean;
  sortOrder?: number;
  year?: number;
  seoTitle?: string;
  seoDescription?: string;
  shareTitle?: string;
  shareCoverUrl?: string;
  contentBlocks?: WorkContentBlock[];
  categoryIds?: string[];
  tagIds?: string[];
  showSummary?: boolean;
  showBackground?: boolean;
  showGoal?: boolean;
  showDesignApproach?: boolean;
  showMyRole?: boolean;
  showResults?: boolean;
  showProductionDate?: boolean;
  showSoftware?: boolean;
  showAiTools?: boolean;
  scheduledPublishedAt?: string;
}

export interface CategoryUpsertRequest {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface TagUpsertRequest {
  name: string;
}

export interface ProfileUpdateRequest {
  avatarUrl?: string;
  name: string;
  title?: string;
  tagline?: string;
  bio?: string;
  fullBio?: string;
  workYears?: number;
  location?: string;
  jobStatus?: JobStatus;
  specialties?: string[];
  software?: SkillItem[];
  aiTools?: SkillItem[];
  phone?: string;
  wechat?: string;
  email?: string;
  website?: string;
  behance?: string;
  zcool?: string;
  github?: string;
  xiaohongshu?: string;
  linkedin?: string;
  showPhone?: boolean;
  showWechat?: boolean;
  showEmail?: boolean;
  showWebsite?: boolean;
  showBehance?: boolean;
  showZcool?: boolean;
  showGithub?: boolean;
  showXiaohongshu?: boolean;
  showLinkedin?: boolean;
  resumeUrl?: string;
  selfIntro?: string;
}

export interface WorkExperienceUpsertRequest {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  projects?: string;
  sortOrder?: number;
}

export interface SiteSettingsUpdateRequest {
  siteName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  homeIntro?: string;
  footerText?: string;
  seoTitle?: string;
  seoDescription?: string;
  defaultShareImage?: string;
  navItems?: NavItem[];
  homeSections?: HomeSection[];
  themeConfig?: ThemeConfig;
  customerServiceEnabled?: boolean;
  bgmUrl?: string;
  bgmEnabled?: boolean;
  bgmVolume?: number;
  bgmAutoPlay?: boolean;
  cursorStyle?: string;
  homeHotWorksEnabled?: boolean;
  homeHotWorksTitle?: string;
  homeHotWorksCount?: number;
  homeHotWorksSortOrder?: number;
  autoPopupCsEnabled?: boolean;
  loginCaptchaEnabled?: boolean;
  captchaBgUrl?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  skillMatrix?: SkillMatrix;
  homeCta?: HomeCtaConfig;
  antiDownloadEnabled?: boolean;
}

export interface WorksFilterParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  year?: number;
  keyword?: string;
  status?: WorkStatus;
  software?: string;
  aiTool?: string;
}

export interface PasswordVerifyRequest {
  password: string;
}

export interface ExportDataResponse {
  exportedAt: string;
  version: string;
  works: Work[];
  categories: Category[];
  tags: Tag[];
  profile: Profile | null;
  siteSettings: SiteSettings | null;
  mediaList: { id: string; fileName: string; fileUrl: string; fileSize: number; mimeType?: string; mediaType: string; }[];
}
