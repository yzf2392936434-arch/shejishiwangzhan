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

import { WorkFavoritesService } from './work-favorites.service';

class FavoriteToggleDto {
  @IsString()
  @IsNotEmpty()
  visitorId!: string;
}

@Controller('api/public/works')
export class PublicWorkFavoritesController {
  constructor(private readonly workFavoritesService: WorkFavoritesService) {}

  @Post(':id/favorite')
  async toggleFavorite(
    @Param('id') workId: string,
    @Body() dto: FavoriteToggleDto,
  ): Promise<{ favorited: boolean; favoriteCount: number }> {
    if (!dto.visitorId || dto.visitorId.trim().length === 0) {
      throw new BadRequestException('visitorId 不能为空');
    }
    return this.workFavoritesService.toggleFavorite(workId, dto.visitorId);
  }

  @Get(':id/favorite-status')
  async getFavoriteStatus(
    @Param('id') workId: string,
    @Query('visitorId') visitorId: string,
  ): Promise<{ favorited: boolean; favoriteCount: number }> {
    return this.workFavoritesService.getFavoriteStatus(workId, visitorId ?? '');
  }
}
