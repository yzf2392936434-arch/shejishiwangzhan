import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { WorkExperienceService } from './work-experience.service';
import {
  ProfileUpdateDto,
  ReorderExperiencesDto,
  WorkExperienceUpsertDto,
} from './profile.dto';
import type { Profile, WorkExperience } from '@shared/api.interface';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/admin/profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly workExperienceService: WorkExperienceService,
  ) {}

  @Get()
  async getProfile(): Promise<Profile> {
    return this.profileService.get();
  }

  @Put()
  async updateProfile(@Body() dto: ProfileUpdateDto): Promise<Profile> {
    return this.profileService.update(dto);
  }

  @Get('experiences')
  async getExperiences(): Promise<WorkExperience[]> {
    return this.workExperienceService.findAll();
  }

  @Post('experiences')
  async createExperience(@Body() dto: WorkExperienceUpsertDto): Promise<WorkExperience> {
    return this.workExperienceService.create(dto);
  }

  @Patch('experiences/:id')
  async updateExperience(
    @Param('id') id: string,
    @Body() dto: WorkExperienceUpsertDto,
  ): Promise<WorkExperience> {
    return this.workExperienceService.update(id, dto);
  }

  @Delete('experiences/:id')
  async deleteExperience(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.workExperienceService.remove(id);
    return { success: true };
  }

  @Post('experiences/reorder')
  async reorderExperiences(@Body() dto: ReorderExperiencesDto): Promise<{ success: boolean }> {
    await this.workExperienceService.reorder(dto.items);
    return { success: true };
  }
}
