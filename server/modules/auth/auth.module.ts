import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import session from 'express-session';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CaptchaService } from './captcha.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, CaptchaService],
  exports: [AuthService, CaptchaService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        session({
          secret: process.env.SESSION_SECRET || 'portfolio-admin-session-secret',
          resave: false,
          saveUninitialized: false,
          cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
          },
        }),
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
