import { Module } from '@nestjs/common';
import { WorkLikesService } from './work-likes.service';
import { PublicWorkLikesController } from './public-work-likes.controller';

@Module({
  controllers: [PublicWorkLikesController],
  providers: [WorkLikesService],
  exports: [WorkLikesService],
})
export class WorkLikesModule {}
