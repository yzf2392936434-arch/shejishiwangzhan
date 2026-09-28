import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { WorksService } from './works.service';
import { WorksFilterDto } from './dto/works-filter.dto';
import { PasswordVerifyDto } from './dto/password-verify.dto';
import type {
  Work,
  WorkListItem,
  WorksListResponse,
  SearchResponse,
} from '@shared/api.interface';

@Controller('api/public/works')
export class PublicWorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  async findAll(@Query() params: WorksFilterDto): Promise<WorksListResponse> {
    return this.worksService.findPublic(params);
  }

  @Get('search')
  async search(@Query('keyword') keyword: string): Promise<SearchResponse> {
    return this.worksService.searchPublic(keyword ?? '');
  }

  @Get('hot')
  async getHotWorks(@Query('limit') limit?: string): Promise<WorkListItem[]> {
    const num = limit ? parseInt(limit, 10) : 8;
    return this.worksService.getHotWorks(Math.min(Math.max(num, 1), 50));
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Req() req: Request): Promise<Work> {
    const work = await this.worksService.findBySlug(slug);
    if (!work) {
      throw new NotFoundException('作品不存在或未发布');
    }
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    this.worksService.recordView(work.id, ip).catch(() => {});
    return work;
  }

  @Post(':slug/verify-password')
  async verifyPassword(
    @Param('slug') slug: string,
    @Body() dto: PasswordVerifyDto,
  ): Promise<Work> {
    const work = await this.worksService.findBySlugWithPasswordCheck(slug, dto.password);
    if (!work) {
      throw new NotFoundException('作品不存在或未发布');
    }
    return work;
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  async incrementView(@Param('id') id: string): Promise<void> {
    await this.worksService.incrementViewCount(id);
  }

  @Get(':slug/related')
  async getRelatedWorks(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ): Promise<WorkListItem[]> {
    const work = await this.worksService.findBySlug(slug);
    if (!work) {
      throw new NotFoundException('作品不存在或未发布');
    }
    const num = limit ? parseInt(limit, 10) : 6;
    return this.worksService.getRelatedWorks(work.id, Math.min(Math.max(num, 1), 20));
  }
}
