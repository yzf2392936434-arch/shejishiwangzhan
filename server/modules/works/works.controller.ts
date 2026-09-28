import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { WorksService } from './works.service';
import { WorksFilterDto } from './dto/works-filter.dto';
import { WorkUpsertDto } from './dto/work-upsert.dto';
import { WorkStatusDto } from './dto/work-status.dto';
import { WorkFeaturedDto } from './dto/work-featured.dto';
import { WorkPinnedDto } from './dto/work-pinned.dto';
import { WorkReorderDto } from './dto/work-reorder.dto';
import type {
  Work,
  WorksListResponse,
  DashboardStats,
  ExportDataResponse,
} from '@shared/api.interface';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/admin/works')
@UseGuards(AuthGuard)
export class WorksController {
  private readonly logger = new Logger(WorksController.name);

  constructor(private readonly worksService: WorksService) {}

  @Get()
  async findAll(@Query() params: WorksFilterDto): Promise<WorksListResponse> {
    return this.worksService.findAllAdmin(params);
  }

  @Get('stats/count')
  async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    hidden: number;
    password: number;
  }> {
    return this.worksService.getStats();
  }

  @Get('dashboard/stats')
  async getDashboardStats(): Promise<DashboardStats> {
    return this.worksService.getDashboardStats();
  }

  @Get('export/data')
  async exportData(): Promise<ExportDataResponse> {
    return this.worksService.exportAllData();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Work> {
    return this.worksService.findById(id);
  }

  @Post()
  async create(@Body() dto: WorkUpsertDto): Promise<Work> {
    return this.worksService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: WorkUpsertDto): Promise<Work> {
    return this.worksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.worksService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  async restore(@Param('id') id: string): Promise<void> {
    await this.worksService.restore(id);
  }

  @Post(':id/featured')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setFeatured(
    @Param('id') id: string,
    @Body() dto: WorkFeaturedDto,
  ): Promise<void> {
    await this.worksService.setFeatured(id, dto.featured);
  }

  @Post(':id/pinned')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setPinned(
    @Param('id') id: string,
    @Body() dto: WorkPinnedDto,
  ): Promise<void> {
    await this.worksService.setPinned(id, dto.pinned);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: WorkStatusDto,
  ): Promise<void> {
    await this.worksService.updateStatus(id, dto.status);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(@Body() dto: WorkReorderDto): Promise<void> {
    await this.worksService.reorder(dto.items);
  }
}
