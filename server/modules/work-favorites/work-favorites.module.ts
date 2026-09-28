import { Module } from '@nestjs/common';
import { WorkFavoritesService } from './work-favorites.service';
import { PublicWorkFavoritesController } from './public-work-favorites.controller';

@Module({
  controllers: [PublicWorkFavoritesController],
  providers: [WorkFavoritesService],
  exports: [WorkFavoritesService],
})
export class WorkFavoritesModule {}
