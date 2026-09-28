import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import FileUploadField from '@client/src/components/FileUploadField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@client/src/components/ui/alert-dialog';
import { categoriesApi } from '@client/src/api';
import type { Category, CategoryUpsertRequest } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const categorySchema = z.object({
  name: z.string().min(1, '请输入分类名称'),
  slug: z.string().min(1, '请输入分类别名'),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

const CategoriesAdminPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    coverUrl: '',
    sortOrder: 0,
    isVisible: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (e) {
      logger.error('load categories failed', e);
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      coverUrl: '',
      sortOrder: 0,
      isVisible: true,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      coverUrl: cat.coverUrl || '',
      sortOrder: cat.sortOrder,
      isVisible: cat.isVisible,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const updateField = <K extends keyof CategoryForm>(
    key: K,
    value: CategoryForm[K],
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

  const handleSubmit = async () => {
    const result = categorySchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errs[path]) errs[path] = issue.message;
      });
      setErrors(errs);
      return;
    }

    const payload: CategoryUpsertRequest = form;
    try {
      if (editingId) {
        await categoriesApi.updateCategory(editingId, payload);
        toast.success('更新成功');
      } else {
        await categoriesApi.createCategory(payload);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      void loadCategories();
    } catch (e) {
      logger.error('save category failed', e);
      toast.error('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await categoriesApi.deleteCategory(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      void loadCategories();
    } catch (e) {
      logger.error('delete category failed', e);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">分类管理</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            管理作品分类，用于组织和筛选作品集内容
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
        >
          <Plus className="mr-1.5 size-4" />
          新增分类
        </Button>
      </div>

      <div className="rounded-xl bg-white border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#ececec] hover:bg-transparent bg-[#f9f9f9]">
              <TableHead className="w-10 px-4 text-xs font-semibold text-[#5c5c5c]"></TableHead>
              <TableHead className="px-4 text-xs font-semibold text-[#5c5c5c]">名称</TableHead>
              <TableHead className="hidden px-4 text-xs font-semibold text-[#5c5c5c] md:table-cell">别名</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-[#5c5c5c]">排序</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-[#5c5c5c]">显示状态</TableHead>
              <TableHead className="px-4 text-right text-xs font-semibold text-[#5c5c5c]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-11 px-4 py-12 text-center text-sm text-[#5c5c5c]">
                  加载中...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <FolderOpen className="size-10 text-[#c0c0c0]" />
                    <h3 className="mt-3 text-sm font-semibold text-[#1b1b1b]">
                      暂无分类
                    </h3>
                    <p className="mt-1 text-xs text-[#8a8a8a]">
                      创建第一个分类，开始组织你的作品
                    </p>
                    <Button
                      onClick={openCreate}
                      className="mt-4 bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
                      size="sm"
                    >
                      <Plus className="mr-1.5 size-4" />
                      新增分类
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow
                  key={cat.id}
                  className="h-11 border-b border-[#ececec] transition-colors hover:bg-[#f5f5f5]"
                >
                  <TableCell className="px-4">
                    <GripVertical className="size-4 text-[#c0c0c0]" />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="text-sm text-[#1b1b1b]">{cat.name}</div>
                    {cat.description && (
                      <div className="max-w-[200px] truncate text-xs text-[#5c5c5c]">
                        {cat.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden px-4 md:table-cell">
                    <code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-xs text-[#5c5c5c]">{cat.slug}</code>
                  </TableCell>
                  <TableCell className="px-4 text-sm text-[#1b1b1b]">
                    {cat.sortOrder}
                  </TableCell>
                  <TableCell className="px-4">
                    {cat.isVisible ? (
                      <span className="inline-flex items-center rounded-full border border-[#b6e0b2] bg-[#dff6dd] px-2 py-0.5 text-xs font-medium text-[#107c10]">
                        显示
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-[#e0e0e0] bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#5c5c5c]">
                        隐藏
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(cat)}
                        title="编辑"
                        className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md transition-all duration-150 ease-out"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <AlertDialog
                        open={deleteId === cat.id}
                        onOpenChange={(open) => !open && setDeleteId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(cat.id)}
                            title="删除"
                            className="text-[#5c5c5c] hover:bg-[#fbe4e1] hover:text-[#a4262c] rounded-md transition-all duration-150 ease-out"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除分类？</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除分类不会删除作品，但作品将失去该分类关联。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md font-medium">取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-[#c42b1c] text-white hover:bg-[#d13424] rounded-md font-medium"
                              onClick={handleDelete}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>
              填写分类信息，分类用于组织和筛选作品。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">分类名称 *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">分类别名 (slug) *</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">描述</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>封面图</Label>
              <FileUploadField
                value={form.coverUrl}
                onChange={(val) => updateField('coverUrl', val)}
                accept="image/*"
                type="image"
                placeholder="点击或拖拽上传分类封面图"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-sort">排序权重</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    updateField('sortOrder', Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="!mt-0">是否显示</Label>
                <Switch
                  checked={form.isVisible}
                  onCheckedChange={(val) => updateField('isVisible', val)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesAdminPage;
