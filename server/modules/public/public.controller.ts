import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { PublicService } from './public.service';
import type {
   Category,
   HomeData,
   Profile,
   PublicWorksFilterParams,
   SiteSettings,
   Skill,
   Tag,
   Work,
   WorkExperience,
   WorksListResponse,
   WorkListItem,
 } from '@shared/api.interface';

@Controller('api/public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('home')
  async getHomeData(): Promise<HomeData> {
    return this.publicService.getHomeData();
  }

  @Get('settings')
  async getSettings(): Promise<SiteSettings> {
    return this.publicService.getSettings();
  }

  @Get('profile')
  async getProfile(): Promise<Profile> {
    return this.publicService.getProfile();
  }

  @Get('categories')
  async getCategories(): Promise<Category[]> {
    return this.publicService.getVisibleCategories();
  }

  @Get('work-experiences')
  async getWorkExperiences(): Promise<WorkExperience[]> {
    return this.publicService.getWorkExperiences();
  }

  @Get('skills')
   async getSkills(): Promise<Skill[]> {
     return this.publicService.getSkills();
   }

  @Get('tags')
  async getTags(): Promise<Tag[]> {
    return this.publicService.getTags();
  }

  @Get('works')
  async getWorks(@Query() query: PublicWorksFilterParams): Promise<WorksListResponse> {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 12;
    const year = query.year ? Number(query.year) : undefined;
    return this.publicService.getPublicWorks({
      page,
      pageSize,
      year,
      category: query.category,
      tag: query.tag,
      keyword: query.keyword,
      software: query.software,
      aiTool: query.aiTool,
    });
  }

  @Get('works/hot')
  async getHotWorks(@Query('limit') limit?: string): Promise<WorkListItem[]> {
    const num = limit ? parseInt(limit, 10) : 8;
    return this.publicService.getHotWorks(Math.min(Math.max(num, 1), 50));
  }

  @Get('works/:slug')
  async getWorkBySlug(@Param('slug') slug: string, @Req() req: Request): Promise<Work> {
    const work = await this.publicService.getWorkBySlug(slug);
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    this.publicService.recordView(work.id, ip).catch(() => {});
    return work;
  }

  @Post('works/:id/view')
  async incrementView(@Param('id') id: string, @Req() req: Request): Promise<{ success: boolean }> {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    await this.publicService.recordView(id, ip);
    return { success: true };
  }

  @Get('works/:slug/related')
  async getRelatedWorks(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ): Promise<WorkListItem[]> {
    const num = limit ? parseInt(limit, 10) : 6;
    return this.publicService.getRelatedWorksBySlug(slug, num);
  }

  @Post('works/:slug/verify-password')
  async verifyWorkPassword(
    @Param('slug') slug: string,
    @Body('password') password: string,
  ): Promise<{ success: boolean; work?: Work }> {
    return this.publicService.verifyWorkPassword(slug, password);
  }
}
