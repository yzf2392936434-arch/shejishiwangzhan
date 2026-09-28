import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { MediaService } from './media.service';
import type { MediaItem, MediaListResponse, MediaType } from '@shared/api.interface';
import { AuthGuard } from '../auth/auth.guard';

const MEDIA_TYPES: MediaType[] = ['image', 'video', 'pdf', 'other'];

class MediaListQueryDto {
  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(MEDIA_TYPES)
  mediaType?: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

class CreateMediaDto {
  @IsString()
  fileName!: string;

  @IsString()
  filePath!: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsIn(MEDIA_TYPES)
  mediaType?: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

const ALLOWED_IMAGE_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/bmp', 'image/avif',
];
const ALLOWED_VIDEO_MIME = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
];
const ALLOWED_PDF_MIME = ['application/pdf'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_OTHER_SIZE = 50 * 1024 * 1024;

@Controller('api/admin/media')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async list(@Query() query: MediaListQueryDto): Promise<MediaListResponse> {
    return this.mediaService.findAll({
      mediaType: query.mediaType,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<MediaItem> {
    return this.mediaService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateMediaDto): Promise<MediaItem> {
    const mimeType = dto.mimeType?.toLowerCase() ?? '';
    const mediaType = dto.mediaType ?? 'other';
    const fileSize = dto.fileSize ?? 0;

    if (mediaType === 'image') {
      if (!ALLOWED_IMAGE_MIME.includes(mimeType)) {
        throw new BadRequestException('不支持的图片格式');
      }
      if (fileSize > MAX_IMAGE_SIZE) {
        throw new BadRequestException('图片大小不能超过 20MB');
      }
    } else if (mediaType === 'video') {
      if (!ALLOWED_VIDEO_MIME.includes(mimeType)) {
        throw new BadRequestException('不支持的视频格式');
      }
      if (fileSize > MAX_VIDEO_SIZE) {
        throw new BadRequestException('视频大小不能超过 200MB');
      }
    } else if (mediaType === 'pdf') {
      if (!ALLOWED_PDF_MIME.includes(mimeType)) {
        throw new BadRequestException('不支持的文件格式');
      }
      if (fileSize > MAX_PDF_SIZE) {
        throw new BadRequestException('PDF 大小不能超过 20MB');
      }
    } else if (fileSize > MAX_OTHER_SIZE) {
      throw new BadRequestException('文件大小不能超过 50MB');
    }

    if (!dto.filePath || !dto.fileUrl || !dto.fileName) {
      throw new BadRequestException('文件信息不完整');
    }

    return this.mediaService.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.mediaService.remove(id);
    return { success: true };
  }
}
