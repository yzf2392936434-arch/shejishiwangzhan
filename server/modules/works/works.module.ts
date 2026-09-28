import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { WorksController } from './works.controller';
import { PublicWorksController } from './public-works.controller';
import { WorksService } from './works.service';

@Module({
  controllers: [WorksController, PublicWorksController],
  providers: [WorksService, AuthGuard],
  exports: [WorksService],
})
export class WorksModule {}
