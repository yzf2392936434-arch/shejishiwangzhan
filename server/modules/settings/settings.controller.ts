import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsBoolean, MaxLength, IsObject, IsNumber, Min, Max } from 'class-validator';

import { SettingsService } from './settings.service';
import type { HomeCtaConfig, SiteSettings, SiteSettingsUpdateRequest, SkillMatrix, ThemeConfig } from '@shared/api.interface';
import { AuthGuard } from '../auth/auth.guard';

class SiteSettingsUpdateDto implements SiteSettingsUpdateRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  siteName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  homeTitle?: string;

  @IsOptional()
  @IsString()
  homeSubtitle?: string;

  @IsOptional()
  @IsString()
  homeIntro?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  defaultShareImage?: string;

  @IsOptional()
  @IsObject()
  themeConfig?: ThemeConfig;

  @IsOptional()
  @IsBoolean()
  customerServiceEnabled?: boolean;

  @IsOptional()
  @IsString()
  bgmUrl?: string;

  @IsOptional()
  @IsBoolean()
  bgmEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bgmVolume?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cursorStyle?: string;

  @IsOptional()
  @IsBoolean()
  homeHotWorksEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  homeHotWorksTitle?: string;

  @IsOptional()
  @IsNumber()
  homeHotWorksCount?: number;

  @IsOptional()
  @IsNumber()
  homeHotWorksSortOrder?: number;

  @IsOptional()
  @IsBoolean()
  autoPopupCsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  loginCaptchaEnabled?: boolean;

  @IsOptional()
  @IsString()
  captchaBgUrl?: string;

  @IsOptional()
  @IsBoolean()
  watermarkEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  watermarkText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  watermarkOpacity?: number;

  @IsOptional()
  @IsObject()
  skillMatrix?: SkillMatrix;

  @IsOptional()
  @IsObject()
  homeCta?: HomeCtaConfig;

  @IsOptional()
  @IsBoolean()
  antiDownloadEnabled?: boolean;
}

@Controller('api/admin/settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<SiteSettings> {
    return this.settingsService.get();
  }

  @Put()
  async updateSettings(@Body() dto: SiteSettingsUpdateDto): Promise<SiteSettings> {
    return this.settingsService.update(dto);
  }
}
