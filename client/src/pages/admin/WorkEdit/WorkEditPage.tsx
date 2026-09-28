import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Save,
  Eye,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  Sparkles,
  Pin,
  Star,
  Calendar,
  Hash,
  Image as ImageIcon,
  LayoutGrid,
  Settings2,
  Search,
  Share2,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import { Badge } from '@client/src/components/ui/badge';
import FileUploadField from '@client/src/components/FileUploadField';
import ContentEditor from '@client/src/components/ContentEditor';
import { worksApi, categoriesApi, tagsApi } from '@client/src/api';
import type {
  Work,
  WorkStatus,
  Category,
  Tag,
  WorkContentBlock,
  WorkUpsertRequest,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { uploadFile } from '@client/src/hooks/useFileUpload';
import WordCount from '@client/src/components/WordCount';
import { WORK_WORD_LIMITS } from '@client/src/utils/uploadRules';

const workSchema = z.object({
  title: z.string().min(1, '请输入作品标题'),
  slug: z.string().min(1, '请输入作品别名'),
  coverUrl: z.string().optional(),
  status: z.enum(['draft', 'published', 'hidden', 'password']),
  password: z.string().optional(),
  contentBlocks: z.array(z.any()).default([]),
  productionDate: z.string().optional(),
  year: z.number().int().optional(),
  software: z.array(z.string()).default([]),
  aiTools: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  scheduledPublishedAt: z.string().optional(),
  sortOrder: z.number().int().default(0),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  shareTitle: z.string().optional(),
  shareCoverUrl: z.string().optional(),
  summary: z.string().optional(),
});

type WorkFormState = z.infer<typeof workSchema>;

const defaultState: WorkFormState = {
  title: '',
  slug: '',
  coverUrl: '',
  status: 'draft',
  password: '',
  contentBlocks: [],
  productionDate: '',
  year: undefined,
  software: [],
  aiTools: [],
  isFeatured: false,
  isPinned: false,
  scheduledPublishedAt: '',
  sortOrder: 0,
  categoryIds: [],
  tagIds: [],
  seoTitle: '',
  seoDescription: '',
  shareTitle: '',
  shareCoverUrl: '',
  summary: '',
};

function migrateLegacyFields(work: Work): WorkContentBlock[] {
  const blocks: WorkContentBlock[] = [];
  let idCounter = 0;
  const gid = () => `mig_${Date.now()}_${idCounter++}`;

  if (work.summary) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '作品简介' });
    blocks.push({ id: gid(), type: 'text', text: work.summary });
  }
  if (work.background) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '项目背景' });
    blocks.push({ id: gid(), type: 'text', text: work.background });
  }
  if (work.goal) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '项目目标' });
    blocks.push({ id: gid(), type: 'text', text: work.goal });
  }
  if (work.designApproach) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '设计思路' });
    blocks.push({ id: gid(), type: 'text', text: work.designApproach });
  }
  if (work.myRole) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '我的职责' });
    blocks.push({ id: gid(), type: 'text', text: work.myRole });
  }
  if (work.results) {
    blocks.push({ id: gid(), type: 'heading', level: 2, text: '最终成果' });
    blocks.push({ id: gid(), type: 'text', text: work.results });
  }
  if (work.images && work.images.length > 0) {
    for (const img of work.images) {
      blocks.push({
        id: gid(),
        type: 'image',
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
      });
    }
  }
  if (work.videoUrl) {
    blocks.push({
      id: gid(),
      type: 'video',
      url: work.videoUrl,
      coverUrl: work.videoCoverUrl,
    });
  }
  return blocks;
}

const WorkEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState<WorkFormState>(defaultState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [moreSettingsOpen, setMoreSettingsOpen] = useState(false);
  const [seoSettingsOpen, setSeoSettingsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [softwareInput, setSoftwareInput] = useState('');
  const [aiToolInput, setAiToolInput] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const lastSavedSnapshotRef = useRef<string>('');
  const autoSaveTimerRef = useRef<number | null>(null);

  const updateField = <K extends keyof WorkFormState>(
    key: K,
    value: WorkFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updateContentBlocks = (blocks: WorkContentBlock[]) => {
    updateField('contentBlocks', blocks);
  };

  const toggleCategory = (catId: string) => {
    const current = form.categoryIds || [];
    const next = current.includes(catId)
      ? current.filter((id) => id !== catId)
      : [...current, catId];
    updateField('categoryIds', next);
  };

  const addTag = () => {
    const name = tagInput.trim();
    if (!name) return;
    const current = form.tagIds || [];
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!current.includes(existing.id)) {
        updateField('tagIds', [...current, existing.id]);
      }
    } else {
      updateField('tagIds', [...current, name]);
    }
    setTagInput('');
  };

  const removeTag = (tagIdOrName: string) => {
    updateField(
      'tagIds',
      (form.tagIds || []).filter((t) => t !== tagIdOrName),
    );
  };

  const addSoftware = () => {
    const name = softwareInput.trim();
    if (!name) return;
    if (!form.software.includes(name)) {
      updateField('software', [...form.software, name]);
    }
    setSoftwareInput('');
  };

  const removeSoftware = (name: string) => {
    updateField(
      'software',
      form.software.filter((s) => s !== name),
    );
  };

  const addAiTool = () => {
    const name = aiToolInput.trim();
    if (!name) return;
    if (!form.aiTools.includes(name)) {
      updateField('aiTools', [...form.aiTools, name]);
    }
    setAiToolInput('');
  };

  const removeAiTool = (name: string) => {
    updateField(
      'aiTools',
      form.aiTools.filter((s) => s !== name),
    );
  };

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (e) {
      logger.error('load categories failed', e);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (e) {
      logger.error('load tags failed', e);
    }
  }, []);

  const loadWork = useCallback(async () => {
    if (!id) return;
    try {
      const data = await worksApi.getWork(id);
      const workData = data as Work & { password?: string };
      const contentBlocks = workData.contentBlocks?.length
        ? data.contentBlocks
        : migrateLegacyFields(data);

      const loadedForm: WorkFormState = {
        title: data.title,
        slug: data.slug,
        coverUrl: data.coverUrl || '',
        status: data.status,
        password: workData.password || '',
        contentBlocks,
        productionDate: data.productionDate || '',
        year: data.year,
        software: data.software || [],
        aiTools: data.aiTools || [],
        isFeatured: data.isFeatured,
        isPinned: data.isPinned,
        scheduledPublishedAt: (data as Work & { scheduledPublishedAt?: string }).scheduledPublishedAt || '',
        sortOrder: data.sortOrder,
        categoryIds: data.categories.map((c) => c.id),
        tagIds: data.tags.map((t) => t.id),
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        shareTitle: data.shareTitle || '',
        shareCoverUrl: data.shareCoverUrl || '',
        summary: data.summary || '',
      };

      setForm(loadedForm);
      lastSavedSnapshotRef.current = JSON.stringify(loadedForm);
      setAutoSaveStatus('saved');
    } catch (e) {
      logger.error('load work failed', e);
      toast.error('加载作品失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCategories();
    loadTags();
    if (isEdit) {
      loadWork();
    } else {
      setLoading(false);
    }
  }, [loadCategories, loadTags, loadWork, isEdit]);

  const validate = (): boolean => {
    try {
      workSchema.parse(form);
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const issue of e.issues) {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        }
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async (targetStatus?: WorkStatus) => {
    if (!validate()) {
      toast.error('请检查表单错误');
      return;
    }
    setSaving(true);
    try {
      const payload: WorkUpsertRequest = {
        title: form.title,
        slug: form.slug,
        coverUrl: form.coverUrl,
        status: targetStatus || form.status,
        password: form.password,
        contentBlocks: form.contentBlocks,
        productionDate: form.productionDate,
        year: form.year,
        software: form.software,
        aiTools: form.aiTools,
        isFeatured: form.isFeatured,
        isPinned: form.isPinned,
        scheduledPublishedAt: form.scheduledPublishedAt || undefined,
        sortOrder: form.sortOrder,
        categoryIds: form.categoryIds,
        tagIds: form.tagIds,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        shareTitle: form.shareTitle,
        shareCoverUrl: form.shareCoverUrl,
        summary: form.summary,
      };

      if (isEdit) {
        await worksApi.updateWork(id!, payload);
        toast.success('保存成功');
        lastSavedSnapshotRef.current = JSON.stringify(form);
        setAutoSaveStatus('saved');
      } else {
        const result = await worksApi.createWork(payload);
        toast.success('创建成功');
        navigate(`/admin/works/${result.id}/edit`, { replace: true });
      }
      setLastSaved(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      logger.error('save work failed', e);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const performAutoSave = useCallback(async () => {
    if (!isEdit || !id) return;

    const currentSnapshot = JSON.stringify(form);
    if (currentSnapshot === lastSavedSnapshotRef.current) return;

    setAutoSaveStatus('saving');
    try {
      const payload: Partial<WorkUpsertRequest> = {
        title: form.title,
        slug: form.slug,
        coverUrl: form.coverUrl,
        contentBlocks: form.contentBlocks,
        productionDate: form.productionDate,
        year: form.year,
        software: form.software,
        aiTools: form.aiTools,
        isFeatured: form.isFeatured,
        isPinned: form.isPinned,
        scheduledPublishedAt: form.scheduledPublishedAt || undefined,
        sortOrder: form.sortOrder,
        categoryIds: form.categoryIds,
        tagIds: form.tagIds,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        shareTitle: form.shareTitle,
        shareCoverUrl: form.shareCoverUrl,
        summary: form.summary,
      };

      await worksApi.updateWork(id, payload);
      lastSavedSnapshotRef.current = currentSnapshot;
      setAutoSaveStatus('saved');
      setLastSaved(
        new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    } catch (e) {
      logger.error('auto save failed', e);
      setAutoSaveStatus('error');
    }
  }, [isEdit, id, form]);

  useEffect(() => {
    if (!isEdit || loading) return;
    if (!lastSavedSnapshotRef.current) return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    const currentSnapshot = JSON.stringify(form);
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setAutoSaveStatus('idle');
    autoSaveTimerRef.current = window.setTimeout(() => {
      performAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, isEdit, loading, performAutoSave]);

  useEffect(() => {
    if (!isEdit) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentSnapshot = JSON.stringify(form);
      if (currentSnapshot !== lastSavedSnapshotRef.current && lastSavedSnapshotRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form, isEdit]);

  const tagNameById = (tagId: string): string => {
    return tags.find((t) => t.id === tagId)?.name || tagId;
  };

  const statusBadgeClass = (status: string): string => {
    switch (status) {
      case 'published':
        return 'bg-[#dff6dd] text-[#107c10] border border-[#b6e0b2]';
      case 'draft':
        return 'bg-[#fff4ce] text-[#8a6500] border border-[#fde48a]';
      case 'hidden':
        return 'bg-[#f0f0f0] text-[#5c5c5c] border border-[#e0e0e0]';
      case 'password':
        return 'bg-[#deecf9] text-[#005fb8] border border-[#b8d6f0]';
      default:
        return 'bg-[#f0f0f0] text-[#5c5c5c] border border-[#e0e0e0]';
    }
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'published': return '已发布';
      case 'draft': return '草稿';
      case 'hidden': return '隐藏';
      case 'password': return '密码访问';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="text-center text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#f3f3f3]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white/75 backdrop-blur-xl backdrop-saturate-150 px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/works')}
            className="text-[#5c5c5c] hover:bg-[#f2f2f2] rounded-md"
          >
            <ArrowLeft className="size-4" />
            返回
          </Button>
          <div className="h-5 w-px bg-[#e5e5e5]" />
          <h1 className="text-sm font-semibold text-[#1b1b1b]">
            {isEdit ? '编辑作品' : '新建作品'}
          </h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(form.status)}`}>
            {statusLabel(form.status)}
          </span>
          {errors.title && (
            <span className="text-xs text-[#c42b1c]">{errors.title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <span className="mr-2 flex items-center gap-1.5 text-xs text-[#5c5c5c]">
              {autoSaveStatus === 'saving' && (
                <>
                  <span className="inline-block size-2 animate-pulse rounded-full bg-[#f4b400]" />
                  正在保存...
                </>
              )}
              {autoSaveStatus === 'saved' && lastSaved && (
                <>
                  <span className="inline-block size-2 rounded-full bg-[#107c10]" />
                  已保存于 {lastSaved}
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <span className="inline-block size-2 rounded-full bg-[#c42b1c]" />
                  保存失败
                </>
              )}
              {autoSaveStatus === 'idle' && lastSaved && (
                <>
                  <span className="inline-block size-2 rounded-full bg-[#c0c0c0]" />
                  有未保存的更改
                </>
              )}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="text-[#5c5c5c] hover:bg-[#f2f2f2] rounded-md"
          >
            <Eye className="size-4" />
            预览
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md shadow-sm"
          >
            <Save className="size-4" />
            保存草稿
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md shadow-sm"
          >
            <Send className="size-4" />
            {isEdit ? '更新发布' : '发布作品'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex gap-4 px-6 py-6">
          <div className="min-w-0 flex-[2]">
            <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)]">
              <div className="px-10 py-8">
                <div className="mb-8">
                  <div className="relative">
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="输入作品标题"
                      maxLength={WORK_WORD_LIMITS.title.max}
                      className="w-full border-0 border-b border-[#e5e5e5] bg-transparent pb-3 text-xl font-semibold text-[#1b1b1b] outline-none transition-colors placeholder:text-[#c0c0c0] focus:border-[#0067c0]"
                    />
                    <WordCount
                      current={form.title.length}
                      max={WORK_WORD_LIMITS.title.max}
                      className="absolute right-0 top-2 text-xs"
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1.5 text-xs text-[#c42b1c]">{errors.title}</p>
                  )}
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8a8a8a]">作品别名</span>
                    <div className="relative flex-1">
                      <Input
                        value={form.slug}
                        onChange={(e) => updateField('slug', e.target.value)}
                        placeholder="url-safe-slug"
                        className="h-8 flex-1 border-[#e5e5e5] text-sm pr-16 focus:border-[#0067c0] focus:ring-2 focus:ring-[#0067c0]/30 rounded-md"
                      />
                      <WordCount
                        current={form.slug.length}
                        max={WORK_WORD_LIMITS.slug.max}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>
                  {errors.slug && (
                    <p className="mt-1.5 text-xs text-[#c42b1c]">{errors.slug}</p>
                  )}
                </div>

                <ContentEditor
                  blocks={form.contentBlocks}
                  onChange={updateContentBlocks}
                />
              </div>
            </div>
          </div>

          <div className="w-80 shrink-0 space-y-4">
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)]">
              <div className="mb-4 flex items-center gap-2">
                <ImageIcon className="size-4 text-[#8a8a8a]" />
                <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider">
                  作品封面
                </h3>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1b1b1b]">
                  封面图 <span className="text-[#c42b1c]">*</span>
                </Label>
                <FileUploadField
                  value={form.coverUrl || ''}
                  onChange={(val) => updateField('coverUrl', val)}
                  accept="image/*"
                  type="image"
                  placeholder="点击或拖拽上传封面"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)]">
              <div className="mb-4 flex items-center gap-2">
                <LayoutGrid className="size-4 text-[#8a8a8a]" />
                <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider">
                  分类与标签
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1b1b1b]">分类</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-2 min-h-[40px]">
                  {(form.categoryIds || []).length === 0 && (
                    <span className="text-xs text-[#8a8a8a]">请选择分类</span>
                  )}
                  {categories
                    .filter((c) => (form.categoryIds || []).includes(c.id))
                    .map((cat) => (
                      <Badge
                        key={cat.id}
                        variant="secondary"
                        className="cursor-pointer gap-1 border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-full"
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.name}
                        <X className="size-3" />
                      </Badge>
                    ))}
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md border border-[#e5e5e5] bg-white">
                  {categories.map((cat) => {
                    const selected = (form.categoryIds || []).includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-[#f5f5f5] ${
                          selected ? 'bg-[#f5f5f5] font-medium text-[#1b1b1b]' : 'text-[#5c5c5c]'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selected && <span className="text-[#0067c0]">✓</span>}
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="px-3 py-2 text-xs text-[#8a8a8a]">
                      暂无分类
                    </div>
                  )}
                </div>
              </div>

              <div className="my-4 h-px bg-[#ececec]" />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#1b1b1b]">标签</Label>
                  <span className="text-xs text-[#8a8a8a]">
                    还可添加{Math.max(0, 20 - (form.tagIds || []).length)}个
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-2 min-h-[40px]">
                  {(form.tagIds || []).length === 0 && (
                    <span className="text-xs text-[#8a8a8a]">添加标签</span>
                  )}
                  {(form.tagIds || []).map((tagId) => (
                    <Badge
                      key={tagId}
                      variant="secondary"
                      className="cursor-pointer gap-1 border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-full"
                      onClick={() => removeTag(tagId)}
                    >
                      {tagNameById(tagId)}
                      <X className="size-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="输入标签后回车添加"
                    className="h-8 border-[#e5e5e5] text-sm focus:border-[#0067c0] focus:ring-2 focus:ring-[#0067c0]/30 rounded-md"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addTag}
                    className="border-[#e5e5e5] text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md"
                  >
                    添加
                  </Button>
                </div>
                <p className="text-xs text-[#8a8a8a]">
                  添加标签可以帮助作品被更多人发现
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)]">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="size-4 text-[#8a8a8a]" />
                <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider">
                  发布设置
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#1b1b1b]">作品状态</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) =>
                      updateField('status', val as WorkStatus)
                    }
                  >
                    <SelectTrigger className="h-9 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="published">已发布</SelectItem>
                      <SelectItem value="hidden">隐藏</SelectItem>
                      <SelectItem value="password">密码访问</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.status === 'password' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1b1b1b]">访问密码</Label>
                    <Input
                      type="password"
                      value={form.password || ''}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="h-9 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                      placeholder="设置访问密码"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#1b1b1b]">制作时间</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8a8a]" />
                    <Input
                      type="date"
                      value={form.productionDate || ''}
                      onChange={(e) =>
                        updateField('productionDate', e.target.value)
                      }
                      className="h-9 border-[#e5e5e5] pl-9 text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label className="text-sm font-medium text-[#1b1b1b]">定时发布</Label>
                     <Switch
                       checked={!!form.scheduledPublishedAt}
                       onCheckedChange={(val) => {
                        if (val) {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setMinutes(0, 0, 0);
                          const local = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16);
                          updateField('scheduledPublishedAt', local);
                        } else {
                          updateField('scheduledPublishedAt', '');
                        }
                      }}
                    />
                  </div>
                   {form.scheduledPublishedAt && (
                     <div className="space-y-1.5">
                       <Input
                         type="datetime-local"
                         value={form.scheduledPublishedAt}
                         onChange={(e) =>
                           updateField('scheduledPublishedAt', e.target.value)
                         }
                         className="h-9 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                       <p className="text-xs text-[#8a8a8a]">
                         设置后作品将在指定时间自动发布
                       </p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)]">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="size-4 text-[#8a8a8a]" />
                <h3 className="text-xs font-semibold text-[#5c5c5c] uppercase tracking-wider">
                  推荐设置
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 transition-colors hover:bg-[#f5f5f5]">
                  <div className="flex items-center gap-2">
                    <Star className="size-4 text-[#f4b400]" />
                    <Label className="text-sm font-medium text-[#1b1b1b]">精选作品</Label>
                  </div>
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(val) =>
                      updateField('isFeatured', val)
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-2.5 transition-colors hover:bg-[#f5f5f5]">
                  <div className="flex items-center gap-2">
                    <Pin className="size-4 text-[#5c5c5c]" />
                    <Label className="text-sm font-medium text-[#1b1b1b]">置顶展示</Label>
                  </div>
                  <Switch
                    checked={form.isPinned}
                    onCheckedChange={(val) => updateField('isPinned', val)}
                  />
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <Hash className="size-4 text-[#8a8a8a]" />
                    <Label className="text-sm font-medium text-[#1b1b1b]">排序权重</Label>
                  </div>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      updateField(
                        'sortOrder',
                        Number(e.target.value) || 0,
                      )
                    }
                    className="h-9 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] overflow-hidden">
              <button
                type="button"
                onClick={() => setMoreSettingsOpen(!moreSettingsOpen)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-[#1b1b1b] transition-colors hover:bg-[#f9f9f9]"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="size-4 text-[#8a8a8a]" />
                  软件与 AI 工具
                </span>
                {moreSettingsOpen ? (
                  <ChevronUp className="size-4 text-[#8a8a8a]" />
                ) : (
                  <ChevronDown className="size-4 text-[#8a8a8a]" />
                )}
              </button>
              {moreSettingsOpen && (
                <div className="space-y-4 border-t border-[#ececec] p-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1b1b1b]">使用软件</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {form.software.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="cursor-pointer gap-1 border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-full"
                          onClick={() => removeSoftware(s)}
                        >
                          {s}
                          <X className="size-3" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        value={softwareInput}
                        onChange={(e) => setSoftwareInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSoftware();
                          }
                        }}
                        placeholder="输入软件名后回车"
                        className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1b1b1b]">AI 工具</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {form.aiTools.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="cursor-pointer gap-1 border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-full"
                          onClick={() => removeAiTool(s)}
                        >
                          {s}
                          <X className="size-3" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        value={aiToolInput}
                        onChange={(e) => setAiToolInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addAiTool();
                          }
                        }}
                        placeholder="输入工具名后回车"
                        className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#e5e5e5] bg-white shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] overflow-hidden">
              <button
                type="button"
                onClick={() => setSeoSettingsOpen(!seoSettingsOpen)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-[#1b1b1b] transition-colors hover:bg-[#f9f9f9]"
              >
                <span className="flex items-center gap-2">
                  <Search className="size-4 text-[#8a8a8a]" />
                  SEO 与分享设置
                </span>
                {seoSettingsOpen ? (
                  <ChevronUp className="size-4 text-[#8a8a8a]" />
                ) : (
                  <ChevronDown className="size-4 text-[#8a8a8a]" />
                )}
              </button>
              {seoSettingsOpen && (
                <div className="space-y-4 border-t border-[#ececec] p-5">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1b1b1b]">SEO 标题</Label>
                    <div className="relative">
                      <Input
                        value={form.seoTitle || ''}
                        onChange={(e) => updateField('seoTitle', e.target.value)}
                        className="h-9 border-[#e5e5e5] text-sm pr-20 focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                        placeholder="搜索结果标题"
                      />
                      <WordCount
                        current={(form.seoTitle || '').length}
                        max={WORK_WORD_LIMITS.seoTitle.max}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1b1b1b]">SEO 描述</Label>
                    <div className="relative">
                      <Textarea
                        value={form.seoDescription || ''}
                        onChange={(e) =>
                          updateField('seoDescription', e.target.value)
                        }
                        rows={3}
                        className="border-[#e5e5e5] text-sm pb-5 focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                        placeholder="搜索结果描述"
                      />
                      <WordCount
                        current={(form.seoDescription || '').length}
                        max={WORK_WORD_LIMITS.seoDescription.max}
                        className="absolute right-2 bottom-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1b1b1b]">分享标题</Label>
                    <div className="relative">
                      <Input
                        value={form.shareTitle || ''}
                        onChange={(e) => updateField('shareTitle', e.target.value)}
                        className="h-9 border-[#e5e5e5] text-sm pr-20 focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                        placeholder="社交平台分享标题"
                      />
                      <WordCount
                        current={(form.shareTitle || '').length}
                        max={WORK_WORD_LIMITS.shareTitle.max}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Share2 className="size-4 text-[#8a8a8a]" />
                      <Label className="text-sm font-medium text-[#1b1b1b]">分享封面</Label>
                    </div>
                    <FileUploadField
                      value={form.shareCoverUrl || ''}
                      onChange={(val) => updateField('shareCoverUrl', val)}
                      accept="image/*"
                      type="image"
                      placeholder="点击或拖拽上传"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#1b1b1b]">作品简介</Label>
                    <div className="relative">
                      <Textarea
                        value={form.summary || ''}
                        onChange={(e) => updateField('summary', e.target.value)}
                        rows={2}
                        className="border-[#e5e5e5] text-sm pb-5 focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                        placeholder="列表页展示的简短介绍"
                      />
                      <WordCount
                        current={(form.summary || '').length}
                        max={WORK_WORD_LIMITS.summary.max}
                        className="absolute right-2 bottom-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkEditPage;
