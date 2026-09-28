import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CategoriesController } from './categories.controller';
import { PublicCategoriesController } from './public-categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController, PublicCategoriesController],
  providers: [CategoriesService, AuthGuard],
  exports: [CategoriesService],
})
export class CategoriesModule {}
