import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import type {
  JobStatus,
  ProfileUpdateRequest,
  SkillItem,
  WorkExperienceUpsertRequest,
} from '@shared/api.interface';

export class ProfileUpdateDto implements ProfileUpdateRequest {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  fullBio?: string;

  @IsOptional()
  @IsString()
  selfIntro?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  workYears?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(['open', 'closed', 'freelance'])
  jobStatus?: JobStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  software?: SkillItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  aiTools?: SkillItem[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  wechat?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsUrl()
  behance?: string;

  @IsOptional()
  @IsUrl()
  zcool?: string;

  @IsOptional()
  @IsUrl()
  github?: string;

  @IsOptional()
  @IsUrl()
  xiaohongshu?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showWechat?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showWebsite?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showBehance?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showZcool?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showGithub?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showXiaohongshu?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  showLinkedin?: boolean;

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}

export class SkillItemDto implements SkillItem {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class WorkExperienceUpsertDto implements WorkExperienceUpsertRequest {
  @IsString()
  company!: string;

  @IsString()
  position!: string;

  @IsString()
  startDate!: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  projects?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class ReorderItemDto {
  @IsUUID()
  id!: string;

  @IsInt()
  @Type(() => Number)
  sortOrder!: number;
}

export class ReorderExperiencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: { id: string; sortOrder: number }[];
}
