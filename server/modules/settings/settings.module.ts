import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AuthGuard],
  exports: [SettingsService],
})
export class SettingsModule {}
