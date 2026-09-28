import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { WorksModule } from './modules/works/works.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MediaModule } from './modules/media/media.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WorkLikesModule } from './modules/work-likes/work-likes.module';
import { WorkFavoritesModule } from './modules/work-favorites/work-favorites.module';
import { CustomerMessagesModule } from './modules/customer-messages/customer-messages.module';
import { NewsModule } from './modules/news/news.module';
import { PublicModule } from './modules/public/public.module';
import { ViewModule } from './modules/view/view.module';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    AuthModule,
    WorksModule,
    CategoriesModule,
    TagsModule,
    ProfileModule,
    MediaModule,
    SettingsModule,
    WorkLikesModule,
    WorkFavoritesModule,
    CustomerMessagesModule,
    NewsModule,
    PublicModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
