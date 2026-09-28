import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { WorkExperienceService } from './work-experience.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, WorkExperienceService, AuthGuard],
})
export class ProfileModule {}
