import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  ChangeUsernameRequest,
  SliderCaptchaChallengeResponse,
  SliderCaptchaVerifyResponse,
} from '@shared/api.interface';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const res = await axiosForBackend.post('/api/auth/login', data);
    return res.data;
  } catch (e) {
    logger.error('login failed', e);
    throw e;
  }
}

export async function logout(): Promise<void> {
  try {
    await axiosForBackend.post('/api/auth/logout');
  } catch (e) {
    logger.error('logout failed', e);
    throw e;
  }
}

export async function getMe(): Promise<{ id: string; username: string } | null> {
  try {
    const res = await axiosForBackend.get('/api/auth/me', {
      validateStatus: (status: number) => status === 200 || status === 401,
    });
    if (res.status === 401) {
      return null;
    }
    return res.data;
  } catch (e) {
    logger.error('getMe failed', e);
    throw e;
  }
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  try {
    await axiosForBackend.post('/api/auth/change-password', data);
  } catch (e) {
    logger.error('changePassword failed', e);
    throw e;
  }
}

export async function changeUsername(data: ChangeUsernameRequest): Promise<void> {
  try {
    await axiosForBackend.patch('/api/auth/username', data);
  } catch (e) {
    logger.error('changeUsername failed', e);
    throw e;
  }
}

export async function getCaptcha(): Promise<SliderCaptchaChallengeResponse> {
  try {
    const res = await axiosForBackend.get('/api/auth/captcha');
    return res.data;
  } catch (e) {
    logger.error('getCaptcha failed', e);
    throw e;
  }
}

export async function verifySliderCaptcha(payload: {
  challenge: string;
  sliderRatio: number;
  durationMs: number;
  track: Array<{ x: number; t: number }>;
}): Promise<SliderCaptchaVerifyResponse> {
  try {
    const res = await axiosForBackend.post('/api/auth/captcha/verify', payload);
    return res.data;
  } catch (e) {
    logger.error('verifySliderCaptcha failed', e);
    throw e;
  }
}
