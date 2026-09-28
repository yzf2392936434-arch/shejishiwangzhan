import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService, AuthGuard],
  exports: [NewsService],
})
export class NewsModule {}
