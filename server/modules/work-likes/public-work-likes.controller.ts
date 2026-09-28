import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';

import { WorkLikesService } from './work-likes.service';

class LikeToggleDto {
  @IsString()
  @IsNotEmpty()
  visitorId!: string;
}

@Controller('api/public/works')
export class PublicWorkLikesController {
  constructor(private readonly workLikesService: WorkLikesService) {}

  @Post(':id/like')
  async toggleLike(
    @Param('id') workId: string,
    @Body() dto: LikeToggleDto,
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (!dto.visitorId || dto.visitorId.trim().length === 0) {
      throw new BadRequestException('visitorId 不能为空');
    }
    return this.workLikesService.toggleLike(workId, dto.visitorId);
  }

  @Get(':id/like-status')
  async getLikeStatus(
    @Param('id') workId: string,
    @Query('visitorId') visitorId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    return this.workLikesService.getLikeStatus(workId, visitorId ?? '');
  }
}
