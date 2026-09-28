import { IsOptional, IsInt, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { WorksFilterParams, WorkStatus } from '@shared/api.interface';

export class WorksFilterDto implements WorksFilterParams {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  software?: string;

  @IsOptional()
  @IsString()
  aiTool?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(['draft', 'published', 'hidden', 'password'])
  status?: WorkStatus;
}
