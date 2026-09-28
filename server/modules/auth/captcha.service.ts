import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

const CAPTCHA_TOKEN_TTL_MS = 5 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_DURATION_MS = 10 * 60 * 1000;

const MIN_DRAG_DURATION_MS = 100;
const MAX_DRAG_DURATION_MS = 15000;
const MIN_TRACK_POINTS = 3;
const EXPECTED_MAX_RATIO = 0.95;

interface LoginFailureRecord {
  count: number;
  lockUntil: number;
}

export interface CaptchaSession {
  sliderToken?: string;
  sliderTokenExpiresAt?: number;
  sliderTokenUsed?: boolean;
  sliderChallengeStartTime?: number;
  destroy(callback: (err: unknown) => void): void;
}

@Injectable()
export class CaptchaService {
  private readonly loginFailures = new Map<string, LoginFailureRecord>();

  private getLoginFailureKey(ip: string, username: string): string {
    return `${ip}:${username.toLowerCase()}`;
  }

  isLoginLocked(ip: string, username: string): boolean {
    const key = this.getLoginFailureKey(ip, username);
    const record = this.loginFailures.get(key);
    if (!record) return false;
    if (record.lockUntil > Date.now()) return true;
    this.loginFailures.delete(key);
    return false;
  }

  recordLoginFailure(ip: string, username: string): boolean {
    const key = this.getLoginFailureKey(ip, username);
    const existing = this.loginFailures.get(key);
    const now = Date.now();

    if (existing && existing.lockUntil > now) {
      return true;
    }

    const currentCount = existing && existing.lockUntil <= now ? 0 : (existing?.count ?? 0);
    const newCount = currentCount + 1;

    if (newCount >= LOGIN_MAX_FAILURES) {
      this.loginFailures.set(key, {
        count: newCount,
        lockUntil: now + LOGIN_LOCK_DURATION_MS,
      });
      return true;
    }

    this.loginFailures.set(key, {
      count: newCount,
      lockUntil: 0,
    });
    return false;
  }

  clearLoginFailures(ip: string, username: string): void {
    const key = this.getLoginFailureKey(ip, username);
    this.loginFailures.delete(key);
  }

  generate(session: CaptchaSession): { challenge: string } {
    const challenge = randomBytes(16).toString('hex');
    session.sliderToken = challenge;
    session.sliderTokenExpiresAt = Date.now() + CAPTCHA_TOKEN_TTL_MS;
    session.sliderTokenUsed = false;
    session.sliderChallengeStartTime = Date.now();
    return { challenge };
  }

  verify(
    session: CaptchaSession,
    payload: {
      challenge: string;
      sliderRatio: number;
      durationMs: number;
      track: Array<{ x: number; t: number }>;
    },
  ): {
    success: boolean;
    message?: string;
    token?: string;
  } {
    const storedChallenge = session.sliderToken;
    const expiresAt = session.sliderTokenExpiresAt;
    const used = session.sliderTokenUsed;

    if (!storedChallenge || !expiresAt) {
      return { success: false, message: '验证已失效，请刷新页面重试' };
    }

    if (Date.now() > expiresAt) {
      this.clear(session);
      return { success: false, message: '验证已过期，请刷新页面重试' };
    }

    if (used) {
      this.clear(session);
      return { success: false, message: '验证已失效，请刷新页面重试' };
    }

    if (payload.challenge !== storedChallenge) {
      return { success: false, message: '验证标识不匹配，请刷新' };
    }

    const ratio = Number(payload.sliderRatio);
    const duration = Number(payload.durationMs);
    const track = Array.isArray(payload.track) ? payload.track : [];

    if (!Number.isFinite(ratio) || ratio < EXPECTED_MAX_RATIO) {
      return { success: false, message: '请将滑块拖动到最右侧' };
    }

    if (!Number.isFinite(duration) || duration < MIN_DRAG_DURATION_MS) {
      return { success: false, message: '验证异常，请重新拖动' };
    }

    if (duration > MAX_DRAG_DURATION_MS) {
      return { success: false, message: '验证超时，请重新拖动' };
    }

    if (track.length < MIN_TRACK_POINTS) {
      return { success: false, message: '验证异常，请重新拖动' };
    }

    if (!this.isHumanTrack(track, duration)) {
      return { success: false, message: '验证异常，请重新拖动' };
    }

    const verifyToken = this.generateVerifyToken();
    session.sliderToken = verifyToken;
    session.sliderTokenExpiresAt = Date.now() + CAPTCHA_TOKEN_TTL_MS;
    session.sliderTokenUsed = false;

    return {
      success: true,
      message: '验证通过',
      token: verifyToken,
    };
  }

  verifyLoginToken(session: CaptchaSession, token: string): boolean {
    if (!token) return false;
    if (!session.sliderToken || !session.sliderTokenExpiresAt) return false;
    if (session.sliderTokenUsed) return false;
    if (Date.now() > session.sliderTokenExpiresAt) return false;
    if (session.sliderToken !== token) return false;
    return true;
  }

  consumeToken(session: CaptchaSession): void {
    session.sliderTokenUsed = true;
    session.sliderToken = undefined;
    session.sliderTokenExpiresAt = undefined;
    session.sliderChallengeStartTime = undefined;
  }

  isVerified(): boolean {
    return false;
  }

  clearVerification(session: CaptchaSession): void {
    this.consumeToken(session);
  }

  private clear(session: CaptchaSession): void {
    session.sliderToken = undefined;
    session.sliderTokenExpiresAt = undefined;
    session.sliderTokenUsed = undefined;
    session.sliderChallengeStartTime = undefined;
  }

  private generateVerifyToken(): string {
    return randomBytes(24).toString('hex');
  }

  private isHumanTrack(
    track: Array<{ x: number; t: number }>,
    totalDuration: number,
  ): boolean {
    if (track.length < MIN_TRACK_POINTS) return false;

    const sorted = [...track].sort((a, b) => a.t - b.t);
    if (sorted[0].x > 0.1) return false;
    if (sorted[sorted.length - 1].x < EXPECTED_MAX_RATIO) return false;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].t <= sorted[i - 1].t) return false;
    }

    const segments: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const dt = sorted[i].t - sorted[i - 1].t;
      const dx = sorted[i].x - sorted[i - 1].x;
      if (dt <= 0) return false;
      segments.push(dx / dt);
    }

    const avg = segments.reduce((s, v) => s + v, 0) / segments.length;
    if (avg <= 0) return false;

    let variance = 0;
    for (const v of segments) {
      variance += (v - avg) ** 2;
    }
    variance /= segments.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avg;

    if (cv < 0.005 && track.length > 10) return false;
    if (cv > 20) return false;

    if (totalDuration < 80) return false;

    return true;
  }
}
