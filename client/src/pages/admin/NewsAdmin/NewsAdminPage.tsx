import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { newsApi } from '@client/src/api';
import type { NewsItem, NewsStatus } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const newsFormSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  newsDate: z.string().min(1, '请选择日期'),
  status: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.number().int().default(0),
});

type NewsForm = z.infer<typeof newsFormSchema>;

const statusLabels: Record<NewsStatus, string> = {
  draft: '草稿',
  published: '已发布',
};

const formatDate = (d: string): string => {
  if (!d) return '';
  return d.slice(0, 10);
};

const NewsAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<NewsForm>({
    title: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    newsDate: new Date().toISOString().slice(0, 10),
    status: 'draft',
    sortOrder: 0,
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data: NewsItem[] = await newsApi.getAdminNewsList();
      setItems(data.sort((a: NewsItem, b: NewsItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (e) {
      logger.error('load news list failed', e);
      toast.error('加载动态列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({
      title: '',
      content: '',
      imageUrl: '',
      linkUrl: '',
      newsDate: new Date().toISOString().slice(0, 10),
      status: 'draft',
      sortOrder: 0,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (item: NewsItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      content: item.content || '',
      imageUrl: item.imageUrl || '',
      linkUrl: item.linkUrl || '',
      newsDate: formatDate(item.newsDate),
      status: item.status,
      sortOrder: item.sortOrder,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const updateField = <K extends keyof NewsForm>(key: K, value: NewsForm[K]) => {
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
    const result = newsFormSchema.safeParse(form);
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
      if (editingItem) {
        await newsApi.updateNews(editingItem.id, result.data);
        toast.success('动态已更新');
      } else {
        await newsApi.createNews(result.data);
        toast.success('动态已创建');
      }
      setDialogOpen(false);
      void loadList();
    } catch (e) {
      logger.error('save news failed', e);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: NewsItem) => {
    const nextStatus: NewsStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await newsApi.updateNews(item.id, { status: nextStatus });
      toast.success(`已切换为${statusLabels[nextStatus]}`);
      void loadList();
    } catch (e) {
      logger.error('toggle news status failed', e);
      toast.error('切换状态失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await newsApi.deleteNews(deleteId);
      toast.success('已删除');
      setDeleteId(null);
      void loadList();
    } catch (e) {
      logger.error('delete news failed', e);
      toast.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#5c5c5c]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">动态管理</h1>
          <p className="text-sm text-[#5c5c5c] mt-1">
            管理首页展示的最新动态，支持发布、草稿状态切换
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="h-8 px-4 text-sm rounded-md bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] font-medium shadow-sm"
        >
          <Plus className="size-4" />
          新增动态
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#ececec] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1b1b1b]">动态列表</h2>
            <p className="text-xs text-[#5c5c5c] mt-0.5">
              共 {items.length} 条动态
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                <th className="px-5 py-2.5">标题</th>
                <th className="px-5 py-2.5">日期</th>
                <th className="px-5 py-2.5">状态</th>
                <th className="px-5 py-2.5">排序</th>
                <th className="px-5 py-2.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileText className="size-10 text-[#c0c0c0] mb-3" />
                      <p className="text-sm font-semibold text-[#1b1b1b]">暂无动态</p>
                      <p className="text-xs text-[#8a8a8a] mt-1">
                        点击「新增动态」发布第一条消息
                      </p>
                      <Button
                        variant="outline"
                        onClick={openCreateDialog}
                        className="mt-4 h-8 px-4 text-sm rounded-md bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] font-medium"
                      >
                        <Plus className="size-4" />
                        新增动态
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {items.map((item: NewsItem) => (
                <tr
                  key={item.id}
                  className="h-11 border-b border-[#ececec] hover:bg-[#f5f5f5] transition-colors"
                >
                  <td className="px-5 py-0 font-medium text-[#1b1b1b]">
                    {item.title}
                  </td>
                  <td className="px-5 py-0 text-[#5c5c5c]">
                    {formatDate(item.newsDate)}
                  </td>
                  <td className="px-5 py-0">
                    {item.status === 'published' ? (
                      <span className="inline-flex items-center rounded-full bg-[#dff6dd] text-[#107c10] border border-[#b6e0b2] px-2 py-0.5 text-xs font-medium">
                        已发布
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#fff4ce] text-[#8a6500] border border-[#fde48a] px-2 py-0.5 text-xs font-medium">
                        草稿
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-0 text-[#5c5c5c]">{item.sortOrder}</td>
                  <td className="px-5 py-0 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(item)}
                        title={`切换为${item.status === 'published' ? '草稿' : '已发布'}`}
                        className="size-8 text-[#5c5c5c] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
                      >
                        {item.status === 'published' ? (
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
                            <circle cx="17" cy="12" r="3" fill="currentColor" stroke="none" />
                          </svg>
                        ) : (
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
                            <circle cx="7" cy="12" r="3" fill="currentColor" stroke="none" />
                          </svg>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                        title="编辑"
                        className="size-8 text-[#5c5c5c] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(item.id)}
                        title="删除"
                        className="size-8 text-[#5c5c5c] hover:text-[#c42b1c] hover:bg-[#fbe4e1] rounded-md"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑动态' : '新增动态'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">标题 *</Label>
              <Input
                id="news-title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="请输入动态标题"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-content">内容</Label>
              <Textarea
                id="news-content"
                rows={4}
                value={form.content}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder="动态正文内容..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="news-date">日期 *</Label>
                <Input
                  id="news-date"
                  type="date"
                  value={form.newsDate}
                  onChange={(e) => updateField('newsDate', e.target.value)}
                />
                {errors.newsDate && (
                  <p className="text-xs text-destructive">{errors.newsDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => updateField('status', val as NewsStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-image">图片 URL</Label>
              <Input
                id="news-image"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-link">链接 URL（可选）</Label>
              <Input
                id="news-link"
                value={form.linkUrl}
                onChange={(e) => updateField('linkUrl', e.target.value)}
                placeholder="点击跳转的链接..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-sort">排序权重</Label>
              <Input
                id="news-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => updateField('sortOrder', Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              <X className="size-4" />
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这条动态吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewsAdminPage;
