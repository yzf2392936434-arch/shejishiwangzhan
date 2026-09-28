import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, User, Check, X, ArrowRight, Image } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import { useAuth } from '@client/src/hooks/useAuth';
import { authApi, publicApi } from '@client/src/api';
import type { SiteSettings, SliderCaptchaChallengeResponse, SliderCaptchaVerifyResponse } from '@shared/api.interface';

const schema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormValues = z.infer<typeof schema>;

const TRACK_HEIGHT = 44;
const TRACK_HEIGHT_MOBILE = 52;
const SUCCESS_RATIO_THRESHOLD = 0.95;

type CaptchaStatus = 'idle' | 'dragging' | 'verifying' | 'success' | 'fail';

interface SliderCaptchaProps {
  onVerifiedChange: (verified: boolean, token: string | null) => void;
  onRefresh: () => void;
  refreshing: boolean;
  challenge: string | null;
}

interface TrackPoint {
  x: number;
  t: number;
}

const SliderCaptcha: React.FC<SliderCaptchaProps> = ({
  onVerifiedChange,
  onRefresh,
  refreshing,
  challenge,
}) => {
  const [ratio, setRatio] = useState(0);
  const [status, setStatus] = useState<CaptchaStatus>('idle');
  const [isMobile, setIsMobile] = useState(false);
  const ratioRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startClientXRef = useRef(0);
  const startTimeRef = useRef(0);
  const trackPointsRef = useRef<TrackPoint[]>([]);
  const trackWidthRef = useRef(0);
  const statusRef = useRef<CaptchaStatus>('idle');

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setRatio(0);
    ratioRef.current = 0;
    setStatus('idle');
    trackPointsRef.current = [];
    onVerifiedChange(false, null);
  }, [challenge, onVerifiedChange]);

  const trackHeight = isMobile ? TRACK_HEIGHT_MOBILE : TRACK_HEIGHT;
  const sliderSize = trackHeight - 8;

  const handleStart = useCallback(
    (clientX: number) => {
      if (statusRef.current === 'success') return;
      if (refreshing || !challenge) return;

      const trackEl = trackRef.current;
      if (!trackEl) return;

      trackWidthRef.current = trackEl.offsetWidth;
      startClientXRef.current = clientX;
      startTimeRef.current = Date.now();
      trackPointsRef.current = [{ x: ratio, t: 0 }];
      setStatus('dragging');
    },
    [refreshing, challenge, ratio],
  );

  const handleMove = useCallback(
    (clientX: number) => {
      if (statusRef.current !== 'dragging') return;
      const deltaPx = clientX - startClientXRef.current;
      const newRatio = Math.max(0, Math.min(1, deltaPx / (trackWidthRef.current - sliderSize)));
      setRatio(newRatio);
      ratioRef.current = newRatio;

      const t = Date.now() - startTimeRef.current;
      const points = trackPointsRef.current;
      const last = points[points.length - 1];
      if (!last || t - last.t >= 16) {
        points.push({ x: newRatio, t });
      }
    },
    [sliderSize],
  );

  const handleEnd = useCallback(async () => {
    if (statusRef.current !== 'dragging') return;
    const finalRatio = ratioRef.current;
    const durationMs = Date.now() - startTimeRef.current;

    if (finalRatio < SUCCESS_RATIO_THRESHOLD) {
      setStatus('fail');
      onVerifiedChange(false, null);
      setTimeout(() => {
        setRatio(0);
        ratioRef.current = 0;
        setStatus('idle');
      }, 500);
      return;
    }

    setStatus('verifying');
    try {
      const res: SliderCaptchaVerifyResponse = await authApi.verifySliderCaptcha({
        challenge: challenge!,
        sliderRatio: finalRatio,
        durationMs,
        track: trackPointsRef.current,
      });

      if (res.success && res.token) {
        setRatio(1);
        setStatus('success');
        onVerifiedChange(true, res.token);
      } else {
        setStatus('fail');
        onVerifiedChange(false, null);
        setTimeout(() => {
          setRatio(0);
          ratioRef.current = 0;
          setStatus('idle');
          if (res.refresh) {
            onRefresh();
          }
        }, 600);
      }
    } catch (e) {
      logger.error('slider captcha verify failed', e);
      setStatus('fail');
      setTimeout(() => {
        setRatio(0);
        ratioRef.current = 0;
        setStatus('idle');
        onRefresh();
      }, 600);
    }
  }, [ratio, challenge, onVerifiedChange, onRefresh]);

  useEffect(() => {
    if (status !== 'dragging') return;
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => handleEnd();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [status, handleMove, handleEnd]);

  useEffect(() => {
    if (status !== 'dragging') return;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = () => handleEnd();
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, handleMove, handleEnd]);

  const progressWidth = ratio * (trackWidthRef.current - sliderSize) + sliderSize / 2;

  const trackBgClass =
    status === 'success'
      ? 'bg-[#dff6dd] border-[#b6e0b2]'
      : status === 'fail'
        ? 'bg-[#fbe4e1] border-[#f6c5bf]'
        : 'bg-[#f5f5f5] border-[#e5e5e5]';

  const progressBgClass =
    status === 'success'
      ? 'bg-[#107c10]'
      : status === 'fail'
        ? 'bg-[#c42b1c]'
        : 'bg-[#0067c0]/30';

  const sliderBtnClass =
    status === 'success'
      ? 'bg-[#107c10] border-[#107c10] text-white shadow-sm'
      : status === 'fail'
        ? 'bg-[#c42b1c] border-[#c42b1c] text-white shadow-sm'
        : status === 'dragging'
          ? 'bg-[#0067c0] border-[#0067c0] text-white shadow-sm'
          : 'bg-white border-[#e5e5e5] text-[#5c5c5c] hover:border-[#c0c0c0] hover:shadow-sm';

  const hintColor =
    status === 'success'
      ? 'text-[#107c10]'
      : status === 'fail'
        ? 'text-[#c42b1c]'
        : 'text-[#5c5c5c]';

  const hintText =
    status === 'success'
      ? '验证通过'
      : status === 'fail'
        ? '验证失败，请重试'
        : status === 'verifying'
          ? '验证中...'
          : '按住滑块，拖动到最右边';

  const trackTransition = status === 'dragging' ? 'none' : 'width 0.3s ease-out';
  const sliderTransition = status === 'dragging' ? 'none' : 'left 0.3s ease-out';

  return (
    <div className="select-none w-full">
      <div
        ref={trackRef}
        className={`relative w-full rounded-md border ${trackBgClass} transition-all duration-150 ease-out`}
        style={{ height: trackHeight }}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-l-md ${progressBgClass} transition-all duration-150 ease-out`}
          style={{ width: progressWidth, transition: trackTransition }}
        />

        <div className={`absolute inset-0 flex items-center justify-center text-sm font-normal ${hintColor} pointer-events-none`}>
          {status === 'success' ? (
            <span className="flex items-center gap-1.5">
              <Check className="size-4" />
              {hintText}
            </span>
          ) : status === 'fail' ? (
            <span className="flex items-center gap-1.5">
              <X className="size-4" />
              {hintText}
            </span>
          ) : (
            hintText
          )}
        </div>

        <button
          type="button"
          className={`absolute top-1/2 -translate-y-1/2 rounded-md border-2 flex items-center justify-center shadow-sm ${sliderBtnClass} transition-all duration-150 ease-out`}
          style={{
            left: ratio * (trackWidthRef.current - sliderSize),
            width: sliderSize,
            height: sliderSize,
            transition: sliderTransition,
            cursor: status === 'success' ? 'default' : 'grab',
          }}
          onMouseDown={(e) => handleStart(e.clientX)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0 && status === 'dragging') {
              e.preventDefault();
            }
          }}
          disabled={status === 'success' || refreshing || !challenge}
          aria-label="拖动滑块验证"
        >
          {status === 'success' ? (
            <Check className="size-5" />
          ) : status === 'fail' ? (
            <X className="size-5" />
          ) : (
            <ArrowRight className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [captchaChallenge, setCaptchaChallenge] = useState<string | null>(null);
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const captchaEnabled = settings?.loginCaptchaEnabled ?? true;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const from = (location.state as { from?: string })?.from || '/admin';

  const refreshCaptcha = useCallback(async () => {
    setRefreshingCaptcha(true);
    try {
      const res: SliderCaptchaChallengeResponse = await authApi.getCaptcha();
      setCaptchaChallenge(res.challenge);
    } catch (e) {
      logger.error('refresh captcha failed', e);
    } finally {
      setRefreshingCaptcha(false);
    }
  }, []);

  const handleVerifiedChange = useCallback((verified: boolean, token: string | null) => {
    setCaptchaVerified(verified);
    setCaptchaToken(token);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await publicApi.getSettings();
        if (mounted) {
          setSettings(s);
          if (s.loginCaptchaEnabled) {
            const res = await authApi.getCaptcha();
            if (mounted) setCaptchaChallenge(res.challenge);
          }
        }
      } catch (e) {
        logger.error('load login settings failed', e);
      } finally {
        if (mounted) setSettingsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  if (isAuthenticated && !authLoading) {
    return <Navigate to={from} replace />;
  }

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    if (captchaEnabled && !captchaVerified) {
      toast.error('请先完成安全验证');
      return;
    }
    if (captchaEnabled && !captchaToken) {
      toast.error('验证已失效，请重新滑动验证');
      void refreshCaptcha();
      return;
    }

    setSubmitting(true);
    try {
      await login(values.username, values.password, captchaToken ?? undefined);
      toast.success('登录成功');
      navigate(from, { replace: true });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('滑动验证') || msg.includes('验证码') || msg.includes('安全验证')) {
        toast.error(msg || '请先完成安全验证');
      } else {
        toast.error('登录失败，请检查用户名和密码');
      }
      setCaptchaVerified(false);
      setCaptchaToken(null);
      void refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4 font-[family-name:var(--font-fluent)]">
        <div className="text-[#8a8a8a]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e8f0fa] via-[#f3f3f3] to-[#e8eef8] font-[family-name:var(--font-fluent)] p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0067c0]/10 backdrop-blur-sm">
            <Image size={18} className="text-[#0067c0]" />
          </div>
          <span className="text-sm font-semibold text-[#5c5c5c]">Portfolio Admin</span>
        </div>

        <div className="backdrop-blur-xl backdrop-saturate-180 bg-white/70 border border-white/40 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0_0_0_0.08),_0_4px_12px_rgba(0_0_0_0.04)]">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-[#1b1b1b]">管理员登录</h1>
            <p className="mt-1.5 text-sm text-[#5c5c5c]">请输入您的账号密码以进入后台</p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1b1b1b]">用户名</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
                        <Input
                          className="h-10 pl-10 rounded-md border-[#e5e5e5] bg-white text-sm focus-visible:ring-[#0067c0]/30 focus-visible:ring-2 focus-visible:border-[#0067c0] focus-visible:outline-none transition-all duration-150"
                          placeholder="请输入用户名"
                          autoComplete="username"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#1b1b1b]">密码</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
                        <Input
                          type="password"
                          className="h-10 pl-10 rounded-md border-[#e5e5e5] bg-white text-sm focus-visible:ring-[#0067c0]/30 focus-visible:ring-2 focus-visible:border-[#0067c0] focus-visible:outline-none transition-all duration-150"
                          placeholder="请输入密码"
                          autoComplete="current-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {captchaEnabled && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1b1b1b] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    安全验证
                  </label>
                  <SliderCaptcha
                    challenge={captchaChallenge}
                    refreshing={refreshingCaptcha}
                    onVerifiedChange={handleVerifiedChange}
                    onRefresh={refreshCaptcha}
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-10 bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm transition-all duration-150"
                disabled={submitting || authLoading || refreshingCaptcha}
              >
                {submitting ? '登录中...' : '登 录'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="mt-6 text-center text-xs text-[#8a8a8a]">
          © {new Date().getFullYear()} Portfolio Admin. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
