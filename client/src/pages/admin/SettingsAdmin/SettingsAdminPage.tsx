import React, { useCallback, useEffect, useState } from 'react';
import {
  Save,
  Globe,
  Palette,
  MessageSquare,
  Music,
  Sparkles,
  Store,
  Shield,
  Home,
  MousePointer2,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { THEME_PRESETS, applyThemeStyles } from '@client/src/contexts/ThemeContext';
import ColorPickerDialog from '@client/src/components/ui/color-picker-dialog';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { settingsApi, authApi } from '@client/src/api';
import type { SiteSettings, SiteSettingsUpdateRequest, ThemeConfig } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import FileUploadField from '@client/src/components/FileUploadField';

const settingsSchema = z.object({
  siteName: z.string().min(1, '请输入网站名称'),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  homeTitle: z.string().optional(),
  homeSubtitle: z.string().optional(),
  homeIntro: z.string().optional(),
  footerText: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  defaultShareImage: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const COLOR_LABELS: Record<string, string> = {
  primaryColor: '主色调',
  accentColor: '强调色',
  backgroundColor: '背景色',
  navColor: '导航色',
  textColor: '文字颜色',
  buttonColor: '按钮颜色',
  buttonTextColor: '按钮文字色',
  linkColor: '链接颜色',
  borderColor: '边框颜色',
};

function getColorLabel(key: string): string {
  return COLOR_LABELS[key] || key;
}

type TabKey =
  | 'basic'
  | 'home'
  | 'theme'
  | 'music'
  | 'cursor'
  | 'watermark'
  | 'customer-service'
  | 'seo'
  | 'footer'
  | 'security';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const SettingsAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    siteName: '',
    logoUrl: '',
    faviconUrl: '',
    homeTitle: '',
    homeSubtitle: '',
    homeIntro: '',
    footerText: '',
    seoTitle: '',
    seoDescription: '',
    defaultShareImage: '',
  });
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    preset: 'minimal',
    primaryColor: '',
    accentColor: '',
    backgroundColor: '',
    navColor: '',
    textColor: '',
    buttonColor: '',
    buttonTextColor: '',
    linkColor: '',
    borderColor: '',
  });
  const [customerServiceEnabled, setCustomerServiceEnabled] = useState(false);
  const [autoPopupCsEnabled, setAutoPopupCsEnabled] = useState(false);
  const [loginCaptchaEnabled, setLoginCaptchaEnabled] = useState(true);
  const [captchaBgUrl, setCaptchaBgUrl] = useState('');
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmUrl, setBgmUrl] = useState('');
  const [bgmVolume, setBgmVolume] = useState(50);
  const [bgmAutoPlay, setBgmAutoPlay] = useState(false);
  const [cursorStyle, setCursorStyle] = useState('none');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('Portfolio');
  const [antiDownloadEnabled, setAntiDownloadEnabled] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(15);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<keyof ThemeConfig | null>(null);
  const [pickerInitial, setPickerInitial] = useState('#000000');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const tabs: TabItem[] = [
    { key: 'basic', label: '基本信息', icon: <Globe className="size-4" /> },
    { key: 'home', label: '首页设置', icon: <Home className="size-4" /> },
    { key: 'theme', label: '主题外观', icon: <Palette className="size-4" /> },
    { key: 'music', label: '背景音乐', icon: <Music className="size-4" /> },
    { key: 'cursor', label: '个性光标', icon: <MousePointer2 className="size-4" /> },
    { key: 'watermark', label: '作品水印', icon: <Sparkles className="size-4" /> },
    { key: 'customer-service', label: '客服功能', icon: <MessageSquare className="size-4" /> },
    { key: 'seo', label: 'SEO 与分享', icon: <Globe className="size-4" /> },
    { key: 'footer', label: '页脚设置', icon: <Palette className="size-4" /> },
    { key: 'security', label: '账号安全', icon: <Shield className="size-4" /> },
  ];

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await authApi.getMe();
      if (user) setCurrentUsername(user.username);
    } catch (e) {
      logger.error('load current user failed', e);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data: SiteSettings = await settingsApi.getSettings();
       setForm({
         siteName: data.siteName,
         logoUrl: data.logoUrl || '',
         faviconUrl: data.faviconUrl || '',
         homeTitle: data.homeTitle || '',
         homeSubtitle: data.homeSubtitle || '',
         homeIntro: data.homeIntro || '',
         footerText: data.footerText || '',
         seoTitle: data.seoTitle || '',
         seoDescription: data.seoDescription || '',
         defaultShareImage: data.defaultShareImage || '',
       });
       if (data.themeConfig) {
         setThemeConfig(data.themeConfig);
       }
       setCustomerServiceEnabled(data.customerServiceEnabled ?? false);
       setAutoPopupCsEnabled(data.autoPopupCsEnabled ?? false);
       setLoginCaptchaEnabled(data.loginCaptchaEnabled ?? true);
       setCaptchaBgUrl(data.captchaBgUrl || '');
       setBgmEnabled(data.bgmEnabled ?? false);
       setBgmUrl(data.bgmUrl || '');
       setBgmVolume(data.bgmVolume ?? 50);
       setBgmAutoPlay(data.bgmAutoPlay ?? false);
       setCursorStyle(data.cursorStyle || 'none');
        setWatermarkEnabled(data.watermarkEnabled ?? false);
        setWatermarkText(data.watermarkText || 'Portfolio');
        setAntiDownloadEnabled(data.antiDownloadEnabled ?? false);
       setWatermarkOpacity(data.watermarkOpacity ?? 15);
    } catch (e) {
      logger.error('load settings failed', e);
      toast.error('加载网站设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void loadCurrentUser();
  }, [loadSettings, loadCurrentUser]);

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('请输入新用户名');
      return;
    }
    if (newUsername.length < 3 || newUsername.length > 50) {
      toast.error('用户名长度必须在3-50个字符之间');
      return;
    }
    if (!usernamePassword) {
      toast.error('请输入当前密码');
      return;
    }
    setChangingUsername(true);
    try {
      await authApi.changeUsername({
        newUsername: newUsername.trim(),
        password: usernamePassword,
      });
      setCurrentUsername(newUsername.trim());
      setNewUsername('');
      setUsernamePassword('');
      toast.success('用户名修改成功，下次登录请使用新用户名');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '修改失败';
      toast.error(msg);
    } finally {
      setChangingUsername(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入旧密码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({
        oldPassword,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('密码修改成功');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '修改失败';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const updateField = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const handleSave = async () => {
    const result = settingsSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errs[path]) errs[path] = issue.message;
      });
      setErrors(errs);
      toast.error('请检查表单');
      return;
    }

    setSaving(true);
    try {
      const payload: SiteSettingsUpdateRequest = {
        ...form,
        themeConfig,
        customerServiceEnabled,
        autoPopupCsEnabled,
        loginCaptchaEnabled,
        captchaBgUrl: captchaBgUrl || undefined,
        bgmEnabled,
        bgmUrl: bgmUrl || undefined,
        bgmVolume,
        bgmAutoPlay,
        cursorStyle,
        watermarkEnabled,
        watermarkText,
        watermarkOpacity,
        antiDownloadEnabled,
      };
      await settingsApi.updateSettings(payload);
      toast.success('保存成功');
    } catch (e) {
      logger.error('save settings failed', e);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#5c5c5c] text-sm">加载中...</div>
      </div>
    );
  }

  const inputClass =
    'h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150';
  const textareaClass =
    'px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                基本信息
              </CardTitle>
              <CardDescription className="text-xs text-[#5c5c5c]">
                网站名称与品牌标识
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="siteName" className="text-sm font-medium text-[#1b1b1b]">
                  网站名称 *
                </Label>
                <Input
                  id="siteName"
                  value={form.siteName}
                  onChange={(e) => updateField('siteName', e.target.value)}
                  className={inputClass}
                />
                {errors.siteName && (
                  <p className="text-xs text-[#c42b1c]">{errors.siteName}</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#1b1b1b]">Logo</Label>
                  <FileUploadField
                    value={form.logoUrl}
                    onChange={(val) => updateField('logoUrl', val)}
                    accept="image/*"
                    type="image"
                    placeholder="点击或拖拽上传 Logo 图片"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#1b1b1b]">
                    Favicon
                  </Label>
                  <FileUploadField
                    value={form.faviconUrl}
                    onChange={(val) => updateField('faviconUrl', val)}
                    accept="image/*"
                    type="image"
                    placeholder="点击或拖拽上传 Favicon 图标"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'home':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                首页设置
              </CardTitle>
              <CardDescription className="text-xs text-[#5c5c5c]">
                首页 Hero 区域展示内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="homeTitle" className="text-sm font-medium text-[#1b1b1b]">
                  首页主标题
                </Label>
                <Input
                  id="homeTitle"
                  value={form.homeTitle}
                  onChange={(e) => updateField('homeTitle', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="homeSubtitle" className="text-sm font-medium text-[#1b1b1b]">
                  首页副标题
                </Label>
                <Input
                  id="homeSubtitle"
                  value={form.homeSubtitle}
                  onChange={(e) => updateField('homeSubtitle', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="homeIntro" className="text-sm font-medium text-[#1b1b1b]">
                  首页介绍
                </Label>
                <Textarea
                  id="homeIntro"
                  rows={4}
                  value={form.homeIntro}
                  onChange={(e) => updateField('homeIntro', e.target.value)}
                  className={textareaClass}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'theme':
        return (
          <div className="space-y-4">
             <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
               <CardHeader className="pb-4">
                 <div className="flex items-center gap-2.5">
                   <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                     <Store className="size-4 text-[#5c5c5c]" />
                   </div>
                   <div>
                     <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                       主题商店
                     </CardTitle>
                     <CardDescription className="text-xs text-[#5c5c5c]">
                       选择一套精美主题，一键换装
                     </CardDescription>
                   </div>
                 </div>
               </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                    const isActive = themeConfig.preset === key;
                    return (
                      <div
                        key={key}
                         className={`relative rounded-xl border-2 transition-all overflow-hidden group ${
                           isActive
                             ? 'border-[#0067c0] shadow-md'
                             : 'border-[#e5e5e5] hover:border-[#d0d0d0] hover:shadow-sm'
                         }`}
                      >
                        <div
                          className="h-24 flex items-center justify-center transition-colors"
                          style={{ backgroundColor: preset.backgroundColor }}
                        >
                          <div className="flex gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-white/50"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-white/50"
                              style={{ backgroundColor: preset.accentColor }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: preset.textColor }}
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-white border-t border-[#ececec]">
                           <p className="text-sm font-semibold text-[#1b1b1b]">
                             {preset.name}
                           </p>
                           <p className="text-xs text-[#5c5c5c] mt-0.5 line-clamp-1">
                            {preset.description}
                          </p>
                          <Button
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                             className={`w-full mt-3 text-xs h-8 rounded-md ${
                               isActive
                                 ? 'bg-[#0067c0] text-white hover:bg-[#1076d0]'
                                 : 'border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9]'
                             }`}
                            onClick={() => {
                              const presetConfig: ThemeConfig = {
                                preset: preset.preset,
                                primaryColor: preset.primaryColor,
                                accentColor: preset.accentColor,
                                backgroundColor: preset.backgroundColor,
                                navColor: preset.navColor,
                                textColor: preset.textColor,
                                buttonColor: preset.buttonColor,
                                buttonTextColor: preset.buttonTextColor,
                                linkColor: preset.linkColor,
                                borderColor: preset.borderColor,
                              };
                              applyThemeStyles(presetConfig);
                              setPendingTheme(key);
                            }}
                          >
                            {isActive ? '当前使用' : '预览'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                 {pendingTheme && (
                   <div className="mt-4 p-4 rounded-md bg-[#deecf9] border border-[#b8d6f0] flex items-center justify-between">
                     <p className="text-sm text-[#005fb8]">
                       正在预览「
                       {THEME_PRESETS[pendingTheme]?.name}
                       」主题，是否保存为网站设置？
                     </p>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         className="h-8 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md"
                         onClick={() => {
                           applyThemeStyles(themeConfig);
                           setPendingTheme(null);
                         }}
                       >
                         取消
                       </Button>
                       <Button
                         size="sm"
                         className="h-8 px-3 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] rounded-md"
                         onClick={() => {
                          const preset = THEME_PRESETS[pendingTheme];
                          if (preset) {
                            setThemeConfig({
                              preset: preset.preset,
                              primaryColor: preset.primaryColor,
                              accentColor: preset.accentColor,
                              backgroundColor: preset.backgroundColor,
                              navColor: preset.navColor,
                              textColor: preset.textColor,
                              buttonColor: preset.buttonColor,
                              buttonTextColor: preset.buttonTextColor,
                              linkColor: preset.linkColor,
                              borderColor: preset.borderColor,
                            });
                          }
                          setPendingTheme(null);
                          toast.success('主题已应用，点击保存按钮生效');
                        }}
                      >
                        确认应用
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

             <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
               <CardHeader className="pb-4">
                 <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                   精选色板
                 </CardTitle>
                 <CardDescription className="text-xs text-[#5c5c5c]">
                   一键应用精选配色方案，应用后可继续在下方自定义微调
                 </CardDescription>
               </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                    const isActive = themeConfig.preset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const presetConfig: ThemeConfig = {
                            preset: preset.preset,
                            primaryColor: preset.primaryColor,
                            accentColor: preset.accentColor,
                            backgroundColor: preset.backgroundColor,
                            navColor: preset.navColor,
                            textColor: preset.textColor,
                            buttonColor: preset.buttonColor,
                            buttonTextColor: preset.buttonTextColor,
                            linkColor: preset.linkColor,
                            borderColor: preset.borderColor,
                          };
                          setThemeConfig(presetConfig);
                          applyThemeStyles(presetConfig);
                          toast.success(`已应用「${preset.name}」色板，记得保存`);
                        }}
                         className={`relative rounded-xl border-2 transition-all overflow-hidden text-left group ${
                           isActive
                             ? 'border-[#0067c0] ring-2 ring-[#0067c0]/30'
                             : 'border-[#e5e5e5] hover:border-[#d0d0d0] hover:shadow-sm'
                         }`}
                      >
                        <div
                          className="h-16 flex"
                          style={{ backgroundColor: preset.backgroundColor }}
                        >
                          <div className="flex-1 flex items-center justify-center gap-1.5">
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: preset.accentColor }}
                            />
                            <div
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: preset.buttonColor }}
                            />
                          </div>
                        </div>
                        <div
                          className="px-3 py-2 border-t border-[#ececec]/50"
                          style={{ backgroundColor: preset.backgroundColor }}
                        >
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: preset.textColor }}
                          >
                            {preset.name}
                          </p>
                        </div>
                         {isActive && (
                           <div className="absolute top-1.5 right-1.5 size-4.5 rounded-full bg-[#0067c0] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                             ✓
                           </div>
                         )}
                      </button>
                    );
                  })}
                </div>
                 <div className="mt-4 pt-4 border-t border-[#ececec] flex items-center justify-between">
                   <p className="text-xs text-[#5c5c5c]">
                     共 {Object.keys(THEME_PRESETS).length} 套精选色板，点击即可预览效果
                   </p>
                   <Button
                     variant="outline"
                     size="sm"
                     className="h-8 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md"
                    onClick={() => {
                      const defaultPreset = THEME_PRESETS.minimal;
                      if (defaultPreset) {
                        const presetConfig: ThemeConfig = {
                          preset: defaultPreset.preset,
                          primaryColor: defaultPreset.primaryColor,
                          accentColor: defaultPreset.accentColor,
                          backgroundColor: defaultPreset.backgroundColor,
                          navColor: defaultPreset.navColor,
                          textColor: defaultPreset.textColor,
                          buttonColor: defaultPreset.buttonColor,
                          buttonTextColor: defaultPreset.buttonTextColor,
                          linkColor: defaultPreset.linkColor,
                          borderColor: defaultPreset.borderColor,
                        };
                        setThemeConfig(presetConfig);
                        applyThemeStyles(presetConfig);
                        toast.success('已恢复默认黑白极简配色');
                      }
                    }}
                  >
                    恢复默认
                  </Button>
                </div>
              </CardContent>
            </Card>

             <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
               <CardHeader className="pb-4">
                 <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                   自定义微调
                 </CardTitle>
                 <CardDescription className="text-xs text-[#5c5c5c]">
                   在当前色板基础上进一步微调单个颜色
                 </CardDescription>
               </CardHeader>
              <CardContent>
                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: 'primaryColor' as const, label: '主色调', default: '#0a0a0a' },
                    { key: 'accentColor' as const, label: '强调色', default: '#f5f5f5' },
                    { key: 'backgroundColor' as const, label: '背景色', default: '#ffffff' },
                    { key: 'navColor' as const, label: '导航色', default: '#ffffff' },
                    { key: 'textColor' as const, label: '文字颜色', default: '#1a1a1a' },
                    { key: 'buttonColor' as const, label: '按钮颜色', default: '#0a0a0a' },
                    { key: 'buttonTextColor' as const, label: '按钮文字色', default: '#ffffff' },
                    { key: 'linkColor' as const, label: '链接颜色', default: '#0a0a0a' },
                    { key: 'borderColor' as const, label: '边框颜色', default: '#e5e7eb' },
                  ].map((field) => {
                    const value = themeConfig[field.key] || field.default;
                    return (
                      <div key={field.key} className="space-y-1.5">
                         <Label className="text-sm font-medium text-[#1b1b1b]">
                          {field.label}
                        </Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPickerTarget(field.key);
                              setPickerInitial(value);
                              setColorPickerOpen(true);
                            }}
                             className="h-9 w-12 rounded-md border border-[#e5e5e5] cursor-pointer hover:ring-2 hover:ring-[#0067c0]/30 transition-all shadow-sm p-0.5"
                            style={{ backgroundColor: value }}
                            title={`选择${field.label}`}
                          />
                          <Input
                            type="text"
                            value={themeConfig[field.key] || ''}
                            onChange={(e) => {
                              const next = {
                                ...themeConfig,
                                [field.key]: e.target.value,
                                preset: undefined,
                              };
                              setThemeConfig(next);
                              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                applyThemeStyles(next);
                              }
                            }}
                            className={`flex-1 font-mono text-sm ${inputClass}`}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'music':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <Music className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    背景音乐
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    前台右下角显示音乐播放按钮
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                <div>
                  <p className="text-sm font-medium text-[#1b1b1b]">启用背景音乐</p>
                  <p className="text-xs text-[#5c5c5c] mt-0.5">
                    开启后访客可点击右下角按钮播放背景音乐
                  </p>
                </div>
                <Switch
                  checked={bgmEnabled}
                  onCheckedChange={setBgmEnabled}
                />
              </div>
               <div className="space-y-1.5">
                 <Label className="text-sm font-medium text-[#1b1b1b]">音乐文件</Label>
                 <FileUploadField
                   value={bgmUrl}
                   onChange={setBgmUrl}
                   accept="audio/*"
                   type="audio"
                   placeholder="点击或拖拽上传 MP3 文件"
                 />
                 {bgmUrl ? (
                   <p className="text-xs text-[#5c5c5c] truncate">
                     当前文件：{bgmUrl.split('/').pop()}
                   </p>
                 ) : (
                   <p className="text-xs text-[#8a8a8a]">
                     请先上传背景音乐，前台才会显示播放按钮
                   </p>
                 )}
               </div>
               <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                 <div>
                   <p className="text-sm font-medium text-[#1b1b1b]">自动播放</p>
                   <p className="text-xs text-[#5c5c5c] mt-0.5">
                     进入页面后自动播放（多数浏览器会阻止，建议关闭）
                   </p>
                 </div>
                 <Switch
                   checked={bgmAutoPlay}
                   onCheckedChange={setBgmAutoPlay}
                 />
               </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#1b1b1b]">默认音量</Label>
                  <span className="text-xs text-[#5c5c5c] tabular-nums">
                    {bgmVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-full h-1.5 accent-[#0067c0] cursor-pointer rounded-full bg-[#e5e5e5] appearance-none"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'cursor':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <MousePointer2 className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    个性光标
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    为网站添加独特的鼠标光标效果（仅桌面端）
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { value: 'none', label: '默认', icon: '○' },
                  { value: 'ring', label: '圆环', icon: '◎' },
                  { value: 'heart', label: '爱心', icon: '♥' },
                  { value: 'star', label: '星星', icon: '★' },
                  { value: 'brush', label: '画笔', icon: '🖌' },
                  { value: 'neon', label: '霓虹', icon: '✦' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCursorStyle(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 ease-out ${
                      cursorStyle === opt.value
                        ? 'border-[#0067c0] bg-[#deecf9] shadow-sm'
                        : 'border-[#e5e5e5] bg-white hover:border-[#d0d0d0] hover:bg-[#f9f9f9]'
                    }`}
                  >
                    <span className="text-xl text-[#1b1b1b]">{opt.icon}</span>
                    <span className="text-xs font-medium text-[#5c5c5c]">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'watermark':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <Sparkles className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    作品水印
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    在前台作品详情页的图片上叠加半透明文字水印
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                <div>
                  <p className="text-sm font-medium text-[#1b1b1b]">启用水印</p>
                  <p className="text-xs text-[#5c5c5c] mt-0.5">
                    开启后前台作品图片上会显示半透明斜向平铺文字水印
                  </p>
                </div>
                <Switch
                  checked={watermarkEnabled}
                  onCheckedChange={setWatermarkEnabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="watermarkText" className="text-sm font-medium text-[#1b1b1b]">
                  水印文字
                </Label>
                <Input
                  id="watermarkText"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Portfolio"
                  maxLength={50}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#1b1b1b]">水印透明度</Label>
                  <span className="text-xs text-[#5c5c5c] tabular-nums">
                    {watermarkOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                  className="w-full h-1.5 accent-[#0067c0] cursor-pointer rounded-full bg-[#e5e5e5] appearance-none"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'customer-service':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <MessageSquare className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    客服功能
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    开启后前台右下角显示在线咨询悬浮按钮
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                <div>
                  <p className="text-sm font-medium text-[#1b1b1b]">启用客服留言</p>
                  <p className="text-xs text-[#5c5c5c] mt-0.5">
                    访客可通过悬浮客服面板发送消息，管理员可在后台回复
                  </p>
                </div>
                <Switch
                  checked={customerServiceEnabled}
                  onCheckedChange={setCustomerServiceEnabled}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                <div>
                  <p className="text-sm font-medium text-[#1b1b1b]">
                    进入主页自动弹出客服对话框
                  </p>
                  <p className="text-xs text-[#5c5c5c] mt-0.5">
                    开启后访客首次进入主页将自动弹出客服对话框
                  </p>
                </div>
                <Switch
                  checked={autoPopupCsEnabled}
                  onCheckedChange={setAutoPopupCsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'seo':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <Globe className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    SEO 与分享
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    搜索引擎与社交平台展示
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle" className="text-sm font-medium text-[#1b1b1b]">
                  SEO 标题
                </Label>
                <Input
                  id="seoTitle"
                  placeholder="浏览器标题栏 & 搜索结果标题"
                  value={form.seoTitle}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDescription" className="text-sm font-medium text-[#1b1b1b]">
                  SEO 描述
                </Label>
                <Textarea
                  id="seoDescription"
                  rows={3}
                  placeholder="搜索引擎结果页描述"
                  value={form.seoDescription}
                  onChange={(e) => updateField('seoDescription', e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1b1b1b]">默认分享图</Label>
                <FileUploadField
                  value={form.defaultShareImage}
                  onChange={(val) => updateField('defaultShareImage', val)}
                  accept="image/*"
                  type="image"
                  placeholder="点击或拖拽上传默认分享封面图"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'footer':
        return (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                页脚设置
              </CardTitle>
              <CardDescription className="text-xs text-[#5c5c5c]">
                网站底部显示的文字
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Label htmlFor="footerText" className="text-sm font-medium text-[#1b1b1b]">
                页脚文字
              </Label>
              <Input
                id="footerText"
                placeholder="© 2024 ... All rights reserved."
                value={form.footerText}
                onChange={(e) => updateField('footerText', e.target.value)}
                className={inputClass}
              />
            </CardContent>
          </Card>
        );

      case 'security':
        return (
          <div className="space-y-4">
             <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
               <CardHeader className="pb-4">
                 <div className="flex items-center gap-2.5">
                   <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                     <Shield className="size-4 text-[#5c5c5c]" />
                   </div>
                   <div>
                     <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                       登录安全
                     </CardTitle>
                     <CardDescription className="text-xs text-[#5c5c5c]">
                       登录与安全相关配置
                     </CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                     <div>
                       <p className="text-sm font-medium text-[#1b1b1b]">
                         登录滑动验证码
                       </p>
                       <p className="text-xs text-[#5c5c5c] mt-0.5">
                         开启后登录需要完成直线滑动验证，防止机器人暴力登录
                       </p>
                     </div>
                     <Switch
                       checked={loginCaptchaEnabled}
                       onCheckedChange={setLoginCaptchaEnabled}
                     />
                   </div>
                   <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
                     <div>
                       <p className="text-sm font-medium text-[#1b1b1b]">
                         图片/视频防下载保护
                       </p>
                       <p className="text-xs text-[#5c5c5c] mt-0.5">
                         禁用右键保存、拖拽下载、移动端长按保存（轻量防护，不阻止开发者工具）
                       </p>
                     </div>
                     <Switch
                       checked={antiDownloadEnabled}
                       onCheckedChange={setAntiDownloadEnabled}
                     />
                   </div>
                 </div>
              </CardContent>
            </Card>

             <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
               <CardHeader className="pb-4">
                 <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                   账号安全
                 </CardTitle>
                 <CardDescription className="text-xs text-[#5c5c5c]">
                   管理您的登录用户名和密码
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-8">
                 <div className="space-y-4">
                   <div>
                     <h3 className="text-sm font-semibold text-[#1b1b1b]">
                       修改登录用户名
                     </h3>
                     <p className="text-xs text-[#5c5c5c] mt-0.5">
                       当前用户名：
                       <span className="font-medium text-[#1b1b1b]">
                        {currentUsername || '加载中...'}
                      </span>
                    </p>
                  </div>
                   <div className="grid gap-4 md:grid-cols-2">
                     <div className="space-y-1.5">
                       <Label htmlFor="newUsername" className="text-sm font-medium text-[#1b1b1b]">
                        新用户名
                      </Label>
                      <Input
                        id="newUsername"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="3-50个字符"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                       <Label htmlFor="usernamePassword" className="text-sm font-medium text-[#1b1b1b]">
                        当前密码
                      </Label>
                      <Input
                        id="usernamePassword"
                        type="password"
                        value={usernamePassword}
                        onChange={(e) => setUsernamePassword(e.target.value)}
                        placeholder="请输入当前密码以验证身份"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <Button
                      onClick={handleChangeUsername}
                      disabled={changingUsername}
                      size="sm"
                      className="h-8 px-3 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] rounded-md transition-all duration-150 ease-out"
                    >
                      {changingUsername ? '修改中...' : '修改用户名'}
                    </Button>
                  </div>
                </div>

                 <div className="border-t border-[#ececec]" />

                <div className="space-y-4">
                  <div>
                     <h3 className="text-sm font-semibold text-[#1b1b1b]">
                      修改登录密码
                    </h3>
                     <p className="text-xs text-[#5c5c5c] mt-0.5">
                      定期更换密码可以提升账号安全性
                    </p>
                  </div>
                   <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                       <Label htmlFor="oldPassword" className="text-sm font-medium text-[#1b1b1b]">
                        旧密码
                      </Label>
                      <Input
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="请输入当前密码"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5" />
                    <div className="space-y-1.5">
                       <Label htmlFor="newPassword" className="text-sm font-medium text-[#1b1b1b]">
                        新密码
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少6位字符"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                       <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1b1b1b]">
                        确认新密码
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      size="sm"
                      className="h-8 px-3 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] rounded-md transition-all duration-150 ease-out"
                    >
                      {changingPassword ? '修改中...' : '修改密码'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">网站设置</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            配置网站的基础信息、外观与功能
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-8 px-4 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md shadow-sm transition-all duration-150 ease-out">
          <Save className="size-4" />
          保存更改
        </Button>
      </div>

      <div className="flex gap-4">
        <aside className="w-48 shrink-0">
          <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm p-2 sticky top-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150 ease-out ${
                  activeTab === tab.key
                    ? 'bg-[#0067c0] text-white font-medium'
                    : 'text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {renderTabContent()}
        </main>
      </div>

      <ColorPickerDialog
        open={colorPickerOpen}
        initialColor={pickerInitial}
        title={pickerTarget ? `${getColorLabel(pickerTarget)} - 拾色器` : '拾色器'}
        onConfirm={(color) => {
          if (pickerTarget) {
            const next = {
              ...themeConfig,
              [pickerTarget]: color,
              preset: undefined,
            };
            setThemeConfig(next);
            applyThemeStyles(next);
          }
          setColorPickerOpen(false);
        }}
        onCancel={() => setColorPickerOpen(false)}
      />
    </div>
  );
};

export default SettingsAdminPage;
