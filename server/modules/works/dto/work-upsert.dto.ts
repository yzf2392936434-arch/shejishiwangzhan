import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { WorkUpsertRequest, WorkStatus, WorkImage, WorkContentBlock } from '@shared/api.interface';

export class WorkUpsertDto implements WorkUpsertRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  slug!: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  contentBlocks?: WorkContentBlock[];

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  images?: WorkImage[];

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  videoCoverUrl?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  designApproach?: string;

  @IsOptional()
  @IsString()
  myRole?: string;

  @IsOptional()
  @IsString()
  results?: string;

  @IsOptional()
  @IsString()
  productionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  projectType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  teamSize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsOptional()
  @IsString()
  clientQuote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  software?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiTools?: string[];

  @IsOptional()
  @Type(() => String)
  @IsString()
  status?: WorkStatus;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  shareTitle?: string;

  @IsOptional()
  @IsString()
  shareCoverUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  showSummary?: boolean;

  @IsOptional()
  @IsBoolean()
  showBackground?: boolean;

  @IsOptional()
  @IsBoolean()
  showGoal?: boolean;

  @IsOptional()
  @IsBoolean()
  showDesignApproach?: boolean;

  @IsOptional()
  @IsBoolean()
  showMyRole?: boolean;

  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @IsOptional()
  @IsBoolean()
  showProductionDate?: boolean;

  @IsOptional()
  @IsBoolean()
  showSoftware?: boolean;

  @IsOptional()
  @IsBoolean()
  showAiTools?: boolean;

  @IsOptional()
  @IsString()
  scheduledPublishedAt?: string;
}
