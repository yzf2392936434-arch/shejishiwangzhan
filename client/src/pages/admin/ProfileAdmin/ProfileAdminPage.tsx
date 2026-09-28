import React, { useCallback, useEffect, useState } from 'react';
import { Save, Plus, X, User, Contact2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { profileApi } from '@client/src/api';
import type { Profile, ProfileUpdateRequest, SkillItem, JobStatus } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import FileUploadField from '@client/src/components/FileUploadField';

const profileSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  title: z.string().optional(),
  tagline: z.string().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  fullBio: z.string().optional(),
  workYears: z.number().int().optional(),
  location: z.string().optional(),
  jobStatus: z.enum(['open', 'closed', 'freelance']).default('closed'),
  specialties: z.array(z.string()).default([]),
  software: z.array(z.object({ name: z.string(), icon: z.string().optional(), description: z.string().optional() })).default([]),
  aiTools: z.array(z.object({ name: z.string(), icon: z.string().optional(), description: z.string().optional() })).default([]),
  phone: z.string().optional(),
  wechat: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  behance: z.string().optional(),
  zcool: z.string().optional(),
  github: z.string().optional(),
  xiaohongshu: z.string().optional(),
  linkedin: z.string().optional(),
  showPhone: z.boolean().default(false),
  showWechat: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  showWebsite: z.boolean().default(true),
  showBehance: z.boolean().default(true),
  showZcool: z.boolean().default(true),
  showGithub: z.boolean().default(true),
  showXiaohongshu: z.boolean().default(false),
  showLinkedin: z.boolean().default(false),
  resumeUrl: z.string().optional(),
  selfIntro: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const jobStatusOptions: { value: JobStatus; label: string }[] = [
  { value: 'open', label: '正在找工作' },
  { value: 'closed', label: '暂不找工作' },
  { value: 'freelance', label: '接受自由职业' },
];

const ProfileAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    title: '',
    tagline: '',
    avatarUrl: '',
    bio: '',
    fullBio: '',
    workYears: undefined,
    location: '',
    jobStatus: 'closed',
    specialties: [],
    software: [],
    aiTools: [],
    phone: '',
    wechat: '',
    email: '',
    website: '',
    behance: '',
    zcool: '',
    github: '',
    xiaohongshu: '',
    linkedin: '',
    showPhone: false,
    showWechat: false,
    showEmail: false,
    showWebsite: true,
    showBehance: true,
    showZcool: true,
    showGithub: true,
    showXiaohongshu: false,
    showLinkedin: false,
    resumeUrl: '',
    selfIntro: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [specialtyInput, setSpecialtyInput] = useState('');
  const [softwareInput, setSoftwareInput] = useState('');
  const [aiToolInput, setAiToolInput] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data: Profile = await profileApi.getProfile();
      setForm({
        name: data.name,
        title: data.title || '',
        tagline: data.tagline || '',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
        fullBio: data.fullBio || '',
        workYears: data.workYears,
        location: data.location || '',
        jobStatus: data.jobStatus,
        specialties: data.specialties || [],
        software: data.software || [],
        aiTools: data.aiTools || [],
        phone: data.phone || '',
        wechat: data.wechat || '',
        email: data.email || '',
        website: data.website || '',
        behance: data.behance || '',
        zcool: data.zcool || '',
        github: data.github || '',
        xiaohongshu: data.xiaohongshu || '',
        linkedin: data.linkedin || '',
        showPhone: data.showPhone,
        showWechat: data.showWechat,
        showEmail: data.showEmail,
        showWebsite: data.showWebsite,
        showBehance: data.showBehance,
        showZcool: data.showZcool,
        showGithub: data.showGithub,
        showXiaohongshu: data.showXiaohongshu,
        showLinkedin: data.showLinkedin,
        resumeUrl: data.resumeUrl || '',
        selfIntro: data.selfIntro || '',
      });
    } catch (e) {
      logger.error('load profile failed', e);
      toast.error('加载个人资料失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
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

  const addSpecialty = () => {
    const val = specialtyInput.trim();
    if (!val) return;
    if (form.specialties.includes(val)) {
      toast.warning('已存在');
      return;
    }
    updateField('specialties', [...form.specialties, val]);
    setSpecialtyInput('');
  };

  const removeSpecialty = (s: string) => {
    updateField('specialties', form.specialties.filter((x) => x !== s));
  };

  const addSoftware = () => {
    const val = softwareInput.trim();
    if (!val) return;
    if (form.software.some((s) => s.name === val)) {
      toast.warning('已存在');
      return;
    }
    updateField('software', [...form.software, { name: val }]);
    setSoftwareInput('');
  };

  const removeSoftware = (name: string) => {
    updateField('software', form.software.filter((s) => s.name !== name));
  };

  const addAiTool = () => {
    const val = aiToolInput.trim();
    if (!val) return;
    if (form.aiTools.some((s) => s.name === val)) {
      toast.warning('已存在');
      return;
    }
    updateField('aiTools', [...form.aiTools, { name: val }]);
    setAiToolInput('');
  };

  const removeAiTool = (name: string) => {
    updateField('aiTools', form.aiTools.filter((s) => s.name !== name));
  };

  const handleSave = async () => {
    const result = profileSchema.safeParse(form);
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
      const payload: ProfileUpdateRequest = form;
      await profileApi.updateProfile(payload);
      toast.success('保存成功');
    } catch (e) {
      logger.error('save profile failed', e);
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

  const contactFields: {
    key: keyof ProfileForm;
    label: string;
    showKey: keyof ProfileForm;
  }[] = [
    { key: 'phone', label: '电话', showKey: 'showPhone' },
    { key: 'wechat', label: '微信', showKey: 'showWechat' },
    { key: 'email', label: '邮箱', showKey: 'showEmail' },
    { key: 'website', label: '个人网站', showKey: 'showWebsite' },
    { key: 'behance', label: 'Behance', showKey: 'showBehance' },
    { key: 'zcool', label: '站酷', showKey: 'showZcool' },
    { key: 'github', label: 'GitHub', showKey: 'showGithub' },
    { key: 'xiaohongshu', label: '小红书', showKey: 'showXiaohongshu' },
    { key: 'linkedin', label: 'LinkedIn', showKey: 'showLinkedin' },
  ];

  return (
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">个人资料</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            管理你的个人信息、联系方式与技能展示
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-8 px-4 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md shadow-sm transition-all duration-150 ease-out">
          <Save className="size-4" />
          保存更改
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <User className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    基本信息
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    前台展示的个人身份信息
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1b1b1b]">头像</Label>
                <FileUploadField
                  value={form.avatarUrl}
                  onChange={(val) => updateField('avatarUrl', val)}
                  accept="image/*"
                  type="image"
                  placeholder="点击或拖拽上传头像图片"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-[#1b1b1b]">
                    姓名 *
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                  />
                  {errors.name && (
                    <p className="text-xs text-[#c42b1c]">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm font-medium text-[#1b1b1b]">
                    职业
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagline" className="text-sm font-medium text-[#1b1b1b]">
                  一句话介绍
                </Label>
                <Input
                  id="tagline"
                  value={form.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="workYears" className="text-sm font-medium text-[#1b1b1b]">
                    工作年限
                  </Label>
                  <Input
                    id="workYears"
                    type="number"
                    value={form.workYears ?? ''}
                    onChange={(e) =>
                      updateField(
                        'workYears',
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-sm font-medium text-[#1b1b1b]">
                    所在地
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1b1b1b]">求职状态</Label>
                <Select
                  value={form.jobStatus}
                  onValueChange={(val) =>
                    updateField('jobStatus', val as JobStatus)
                  }
                >
                  <SelectTrigger className="h-9 w-full px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-[#e5e5e5] shadow-[0_8px_32px_rgba(0_0_0_0.08),_0_4px_8px_rgba(0_0_0_0.04)]">
                    {jobStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm font-medium text-[#1b1b1b]">
                  简介
                </Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  className="px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullBio" className="text-sm font-medium text-[#1b1b1b]">
                  完整简介
                </Label>
                <Textarea
                  id="fullBio"
                  rows={5}
                  value={form.fullBio}
                  onChange={(e) => updateField('fullBio', e.target.value)}
                  className="px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="selfIntro" className="text-sm font-medium text-[#1b1b1b]">
                  个人自述
                </Label>
                <Textarea
                  id="selfIntro"
                  rows={4}
                  value={form.selfIntro}
                  onChange={(e) => updateField('selfIntro', e.target.value)}
                  placeholder="一段更具个人风格的自我描述，可用于关于页或首页展示..."
                  className="px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#1b1b1b]">简历 PDF</Label>
                <FileUploadField
                  value={form.resumeUrl}
                  onChange={(val) => updateField('resumeUrl', val)}
                  accept=".pdf"
                  type="pdf"
                  placeholder="点击或拖拽上传简历 PDF 文件"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <Contact2 className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    联系方式
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5c5c5c]">
                    控制各联系方式是否在前台展示
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {contactFields.map((field) => (
                  <div
                    key={field.key as string}
                    className="rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4 transition-all duration-150 ease-out hover:border-[#d0d0d0]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm font-medium text-[#1b1b1b] !mt-0">
                        {field.label}
                      </Label>
                      <Switch
                        checked={Boolean(form[field.showKey])}
                        onCheckedChange={(val) =>
                          updateField(field.showKey, val as never)
                        }
                      />
                    </div>
                    <Input
                      value={(form as unknown as Record<string, string>)[field.key as string] || ''}
                      onChange={(e) =>
                        updateField(field.key, e.target.value as never)
                      }
                      className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
                  <Wrench className="size-4 text-[#5c5c5c]" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                    擅长领域
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="输入后回车添加"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                <Button
                  variant="outline"
                  onClick={addSpecialty}
                  className="h-9 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.specialties.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a]">暂无</p>
                ) : (
                  form.specialties.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="flex items-center gap-1 rounded-full bg-[#f0f0f0] px-2 py-1 text-xs font-medium text-[#5c5c5c] border border-[#e0e0e0]"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(s)}
                        className="text-[#8a8a8a] transition-colors hover:text-[#c42b1c]"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                软件技能
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="输入软件名称后回车添加"
                  value={softwareInput}
                  onChange={(e) => setSoftwareInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSoftware();
                    }
                  }}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                <Button
                  variant="outline"
                  onClick={addSoftware}
                  className="h-9 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.software.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a]">暂无</p>
                ) : (
                  form.software.map((s: SkillItem) => (
                    <Badge
                      key={s.name}
                      variant="outline"
                      className="flex items-center gap-1 rounded-full border border-[#e0e0e0] bg-[#f0f0f0] px-2 py-1 text-xs font-medium text-[#5c5c5c]"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => removeSoftware(s.name)}
                        className="text-[#8a8a8a] transition-colors hover:text-[#c42b1c]"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                AI 工具
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="输入 AI 工具名称后回车添加"
                  value={aiToolInput}
                  onChange={(e) => setAiToolInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAiTool();
                    }
                  }}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                <Button
                  variant="outline"
                  onClick={addAiTool}
                  className="h-9 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.aiTools.length === 0 ? (
                  <p className="text-xs text-[#8a8a8a]">暂无</p>
                ) : (
                  form.aiTools.map((t: SkillItem) => (
                    <Badge
                      key={t.name}
                      variant="outline"
                      className="flex items-center gap-1 rounded-full border border-[#e0e0e0] bg-[#f0f0f0] px-2 py-1 text-xs font-medium text-[#5c5c5c]"
                    >
                      {t.name}
                      <button
                        type="button"
                        onClick={() => removeAiTool(t.name)}
                        className="text-[#8a8a8a] transition-colors hover:text-[#c42b1c]"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileAdminPage;
