import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, AuthGuard],
  exports: [MediaService],
})
export class MediaModule {}
