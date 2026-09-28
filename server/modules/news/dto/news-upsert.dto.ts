import {
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import type { NewsItem } from '@shared/api.interface';

export class NewsUpsertDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsString()
  @IsNotEmpty()
  newsDate!: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'published'])
  @Type(() => String)
  status?: NewsItem['status'];

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
