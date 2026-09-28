import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService, type AdminSessionUser } from './auth.service';
import { CaptchaService, type CaptchaSession } from './captcha.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { SettingsService } from '../settings/settings.service';
import type {
  LoginResponse,
  SliderCaptchaChallengeResponse,
  SliderCaptchaVerifyResponse,
} from '@shared/api.interface';

interface AuthSession extends CaptchaSession {
  user?: AdminSessionUser;
  destroy(callback: (err: unknown) => void): void;
}

type AuthRequest = Request & { session: AuthSession };

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
    private readonly settingsService: SettingsService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: AuthRequest,
  ): Promise<LoginResponse> {
    const ip = this.getClientIp(req);

    if (this.captchaService.isLoginLocked(ip, dto.username)) {
      throw new HttpException('账号已被锁定，请 10 分钟后再试', HttpStatus.TOO_MANY_REQUESTS);
    }

    const settings = await this.settingsService.get();
    if (settings.loginCaptchaEnabled) {
      const captchaToken = dto.captchaToken;
      if (!captchaToken || !this.captchaService.verifyLoginToken(req.session, captchaToken)) {
        throw new BadRequestException('请先完成滑动验证');
      }
      this.captchaService.consumeToken(req.session);
    }

    try {
      const user = await this.authService.login(dto.username, dto.password, req.session);
      this.captchaService.clearLoginFailures(ip, dto.username);
      if (settings.loginCaptchaEnabled) {
        this.captchaService.clearVerification(req.session);
      }
      return {
        success: true,
        user: { id: user.id, username: user.username },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const locked = this.captchaService.recordLoginFailure(ip, dto.username);
        if (locked) {
          throw new HttpException('账号已被锁定，请 10 分钟后再试', HttpStatus.TOO_MANY_REQUESTS);
        }
      }
      throw error;
    }
  }

  @Post('logout')
  async logout(@Req() req: AuthRequest): Promise<{ success: boolean }> {
    await this.authService.logout(req.session);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    const user = this.authService.getCurrentUser(req.session);
    if (!user) {
      return { success: false };
    }
    await this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Patch('username')
  async changeUsername(
    @Body() dto: ChangeUsernameDto,
    @Req() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    const user = this.authService.getCurrentUser(req.session);
    if (!user) {
      return { success: false };
    }
    await this.authService.changeUsername(user.id, dto.newUsername, dto.password);
    req.session.user = { ...user, username: dto.newUsername };
    return { success: true };
  }

  @Get('captcha')
  async getCaptcha(@Req() req: AuthRequest): Promise<SliderCaptchaChallengeResponse> {
    return this.captchaService.generate(req.session);
  }

  @Post('captcha/verify')
  verifyCaptcha(
    @Body() body: {
      challenge: string;
      sliderRatio: number;
      durationMs: number;
      track: Array<{ x: number; t: number }>;
    },
    @Req() req: AuthRequest,
  ): SliderCaptchaVerifyResponse {
    return this.captchaService.verify(req.session, {
      challenge: body.challenge,
      sliderRatio: Number(body.sliderRatio),
      durationMs: Number(body.durationMs),
      track: Array.isArray(body.track) ? body.track : [],
    });
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: AuthRequest): Promise<{ id: string; username: string } | null> {
    return this.authService.getCurrentUser(req.session);
  }

  private getClientIp(req: AuthRequest): string {
    const xff = req.headers['x-forwarded-for'];
    if (xff) {
      const firstIp = Array.isArray(xff) ? xff[0] : xff.split(',')[0];
      return firstIp.trim();
    }
    return req.ip || 'unknown';
  }
}
