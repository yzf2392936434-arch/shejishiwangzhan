import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import { profile } from '@server/database/schema';
import type { Profile, ProfileUpdateRequest, SkillItem } from '@shared/api.interface';

const DEFAULT_PROFILE: Omit<Profile, 'id'> = {
  avatarUrl: undefined,
  name: '',
  title: undefined,
  tagline: undefined,
  bio: undefined,
  fullBio: undefined,
  selfIntro: undefined,
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
  updatedAt: new Date().toISOString(),
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async get(): Promise<Profile> {
    const rows = await this.db.select().from(profile).limit(1);

    if (rows.length === 0) {
      return { id: 'default', ...DEFAULT_PROFILE };
    }

    return this.toProfile(rows[0]);
  }

  async update(dto: ProfileUpdateRequest): Promise<Profile> {
    const patch: Partial<typeof profile.$inferInsert> = {
      name: dto.name,
    };

    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.tagline !== undefined) patch.tagline = dto.tagline;
    if (dto.bio !== undefined) patch.bio = dto.bio;
    if (dto.fullBio !== undefined) patch.fullBio = dto.fullBio;
    if (dto.selfIntro !== undefined) patch.selfIntro = dto.selfIntro;
    if (dto.workYears !== undefined) patch.workYears = dto.workYears;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.jobStatus !== undefined) patch.jobStatus = dto.jobStatus;
    if (dto.specialties !== undefined) patch.specialties = dto.specialties;
    if (dto.software !== undefined) patch.software = dto.software as unknown as Record<string, unknown>[];
    if (dto.aiTools !== undefined) patch.aiTools = dto.aiTools as unknown as Record<string, unknown>[];
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.wechat !== undefined) patch.wechat = dto.wechat;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.website !== undefined) patch.website = dto.website;
    if (dto.behance !== undefined) patch.behance = dto.behance;
    if (dto.zcool !== undefined) patch.zcool = dto.zcool;
    if (dto.github !== undefined) patch.github = dto.github;
    if (dto.xiaohongshu !== undefined) patch.xiaohongshu = dto.xiaohongshu;
    if (dto.linkedin !== undefined) patch.linkedin = dto.linkedin;
    if (dto.showPhone !== undefined) patch.showPhone = dto.showPhone;
    if (dto.showWechat !== undefined) patch.showWechat = dto.showWechat;
    if (dto.showEmail !== undefined) patch.showEmail = dto.showEmail;
    if (dto.showWebsite !== undefined) patch.showWebsite = dto.showWebsite;
    if (dto.showBehance !== undefined) patch.showBehance = dto.showBehance;
    if (dto.showZcool !== undefined) patch.showZcool = dto.showZcool;
    if (dto.showGithub !== undefined) patch.showGithub = dto.showGithub;
    if (dto.showXiaohongshu !== undefined) patch.showXiaohongshu = dto.showXiaohongshu;
    if (dto.showLinkedin !== undefined) patch.showLinkedin = dto.showLinkedin;
    if (dto.resumeUrl !== undefined) patch.resumeUrl = dto.resumeUrl;

    const existing = await this.db.select({ id: profile.id }).from(profile).limit(1);

    let resultRow: typeof profile.$inferSelect;
    if (existing.length > 0) {
      const updated = await this.db
        .update(profile)
        .set(patch)
        .where(eq(profile.id, existing[0].id))
        .returning();
      resultRow = updated[0];
      this.logger.log('更新个人资料');
    } else {
      const inserted = await this.db
        .insert(profile)
        .values(patch as typeof profile.$inferInsert)
        .returning();
      resultRow = inserted[0];
      this.logger.log('创建个人资料');
    }

    return this.toProfile(resultRow);
  }

  private toProfile(row: typeof profile.$inferSelect): Profile {
    return {
      id: row.id,
      avatarUrl: row.avatarUrl ?? undefined,
      name: row.name,
      title: row.title ?? undefined,
      tagline: row.tagline ?? undefined,
      bio: row.bio ?? undefined,
      fullBio: row.fullBio ?? undefined,
      selfIntro: row.selfIntro ?? undefined,
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
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }
}
