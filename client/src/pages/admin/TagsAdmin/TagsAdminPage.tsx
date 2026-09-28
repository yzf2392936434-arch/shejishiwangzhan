import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Hash, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogTrigger,
} from '@client/src/components/ui/alert-dialog';
import { tagsApi } from '@client/src/api';
import type { Tag, TagUpsertRequest } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const tagSchema = z.object({
  name: z.string().min(1, '请输入标签名称'),
});

const TagsAdminPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (e) {
      logger.error('load tags failed', e);
      toast.error('加载标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const result = tagSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    const payload: TagUpsertRequest = { name };
    try {
      if (editingId) {
        await tagsApi.updateTag(editingId, payload);
        toast.success('更新成功');
      } else {
        await tagsApi.createTag(payload);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      void loadTags();
    } catch (e) {
      logger.error('save tag failed', e);
      toast.error('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await tagsApi.deleteTag(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      void loadTags();
    } catch (e) {
      logger.error('delete tag failed', e);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">标签管理</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            管理作品标签，用于快速筛选和分类内容
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
        >
          <Plus className="mr-1.5 size-4" />
          新增标签
        </Button>
      </div>

      <div className="rounded-xl bg-white border border-[#e5e5e5] p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)]">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#5c5c5c]">加载中...</div>
        ) : tags.length === 0 ? (
          <div className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <TagIcon className="size-10 text-[#c0c0c0]" />
              <h3 className="mt-3 text-sm font-semibold text-[#1b1b1b]">
                暂无标签
              </h3>
              <p className="mt-1 text-xs text-[#8a8a8a]">
                创建标签来为作品添加灵活的分类维度
              </p>
              <Button
                onClick={openCreate}
                className="mt-4 bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
                size="sm"
              >
                <Plus className="mr-1.5 size-4" />
                新增标签
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-sm text-[#1b1b1b] transition-all duration-150 ease-out hover:border-[#d0d0d0] hover:shadow-[0_2px_8px_rgba(0_0_0_0.06),_0_1px_2px_rgba(0_0_0_0.03)] hover:-translate-y-0.5"
              >
                <Hash className="size-3.5 text-[#8a8a8a]" />
                <span>{tag.name}</span>
                <div className="ml-0.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="rounded p-0.5 text-[#8a8a8a] transition-colors hover:bg-[#f2f2f2] hover:text-[#1b1b1b]"
                    onClick={() => openEdit(tag)}
                    title="编辑"
                  >
                    <Edit2 className="size-3" />
                  </button>
                  <AlertDialog
                    open={deleteId === tag.id}
                    onOpenChange={(open) => !open && setDeleteId(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="rounded p-0.5 text-[#8a8a8a] transition-colors hover:bg-[#fbe4e1] hover:text-[#a4262c]"
                        onClick={() => setDeleteId(tag.id)}
                        title="删除"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除标签「{tag.name}」后，作品的该标签关联将被移除。
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
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑标签' : '新增标签'}</DialogTitle>
            <DialogDescription>
              标签用于快速筛选作品，建议保持简短。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tag-name">标签名称 *</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
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

export default TagsAdminPage;
