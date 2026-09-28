import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService, AuthGuard],
  exports: [TagsService],
})
export class TagsModule {}
