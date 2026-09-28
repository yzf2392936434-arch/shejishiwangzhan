import React, { useCallback, useEffect, useState } from 'react';
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
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
import { Image } from '@client/src/components/ui/image';
import { mediaApi } from '@client/src/api';
import type { MediaItem, MediaType } from '@shared/api.interface';
import MediaUploadDialog from './MediaUploadDialog';

const MediaAdminPage: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<MediaType | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const pageSize = 20;

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaApi.getMedia({
        page,
        pageSize,
        mediaType: typeFilter || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      logger.error('load media failed', e);
      toast.error('加载媒体库失败');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const openUpload = () => {
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await mediaApi.deleteMedia(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      void loadMedia();
    } catch (e) {
      logger.error('delete media failed', e);
      toast.error('删除失败');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const typeIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="size-4" />;
      case 'video':
        return <Film className="size-4" />;
      case 'pdf':
        return <FileText className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  const typeLabel = (type: MediaType) => {
    const map: Record<MediaType, string> = {
      image: '图片',
      video: '视频',
      pdf: 'PDF',
      other: '其他',
    };
    return map[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">媒体库</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            管理所有上传的图片、视频和文档文件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-[#e5e5e5] bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ease-out ${
                viewMode === 'grid'
                  ? 'bg-[#0067c0] text-white shadow-sm'
                  : 'text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b]'
              }`}
              title="网格视图"
            >
              <Grid3X3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ease-out ${
                viewMode === 'list'
                  ? 'bg-[#0067c0] text-white shadow-sm'
                  : 'text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b]'
              }`}
              title="列表视图"
            >
              <List className="size-4" />
            </button>
          </div>
          <Button
            onClick={openUpload}
            className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
          >
            <Upload className="mr-1.5 size-4" />
            上传媒体
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white border border-[#e5e5e5] p-4 shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)]">
        <Filter className="size-4 text-[#8a8a8a]" />
        <Select
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val as MediaType | '');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9 rounded-md border border-[#e5e5e5] bg-white text-sm text-[#1b1b1b] focus:ring-[#0067c0]/30 focus:border-[#0067c0]">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部类型</SelectItem>
            <SelectItem value="image">图片</SelectItem>
            <SelectItem value="video">视频</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-[#5c5c5c]">
          共 <span className="font-medium text-[#1b1b1b]">{total}</span> 个文件
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#5c5c5c]">加载中...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white border border-[#e5e5e5] py-20 shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
          <div className="flex flex-col items-center justify-center text-center">
            <ImageIcon className="size-10 text-[#c0c0c0]" />
            <h3 className="mt-3 text-sm font-semibold text-[#1b1b1b]">
              暂无媒体文件
            </h3>
            <p className="mt-1 text-xs text-[#8a8a8a]">
              上传你的第一个文件，开始构建媒体库
            </p>
            <Button
              onClick={openUpload}
              className="mt-4 bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm transition-all duration-150 ease-out active:scale-[0.98]"
            >
              <Upload className="mr-1.5 size-4" />
              上传媒体
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-[#f5f5f5] border border-[#e5e5e5] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),_0_2px_4px_rgba(0_0_0_0.03)] hover:-translate-y-0.5"
            >
              {item.mediaType === 'image' ? (
                <Image
                  src={item.thumbnailUrl || item.fileUrl}
                  alt={item.fileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                  {typeIcon(item.mediaType)}
                  <span className="text-xs">{typeLabel(item.mediaType)}</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-all duration-150 ease-out group-hover:opacity-100">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-white/90 text-[#1b1b1b] shadow-sm transition-all duration-150 ease-out hover:bg-white hover:scale-105"
                  onClick={() => {
                    if (item.fileUrl) window.open(item.fileUrl, '_blank');
                  }}
                  title="查看"
                >
                  <Eye className="size-4" />
                </button>
                <AlertDialog
                  open={deleteId === item.id}
                  onOpenChange={(open) => !open && setDeleteId(null)}
                >
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-full bg-white/90 text-[#c42b1c] shadow-sm transition-all duration-150 ease-out hover:bg-white hover:scale-105"
                      onClick={() => setDeleteId(item.id)}
                      title="删除"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除？</AlertDialogTitle>
                      <AlertDialogDescription>
                        删除后该文件将从媒体库移除。
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                <p className="truncate text-xs font-medium text-white">
                  {item.fileName}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)] overflow-hidden">
          <div className="divide-y divide-[#ececec]">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[#f5f5f5]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f5]">
                  {item.mediaType === 'image' ? (
                    <Image
                      src={item.thumbnailUrl || item.fileUrl}
                      alt={item.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400">{typeIcon(item.mediaType)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#1b1b1b]">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-[#5c5c5c]">
                    {typeLabel(item.mediaType)}
                    {item.fileSize ? ` · ${(item.fileSize / 1024).toFixed(1)} KB` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-[#5c5c5c] transition-colors hover:bg-[#f2f2f2] hover:text-[#1b1b1b]"
                    onClick={() => {
                      if (item.fileUrl) window.open(item.fileUrl, '_blank');
                    }}
                    title="查看"
                  >
                    <Eye className="size-4" />
                  </button>
                  <AlertDialog
                    open={deleteId === item.id}
                    onOpenChange={(open) => !open && setDeleteId(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-[#5c5c5c] transition-colors hover:bg-[#fbe4e1] hover:text-[#a4262c]"
                        onClick={() => setDeleteId(item.id)}
                        title="删除"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除？</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后该文件将从媒体库移除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg font-medium shadow-sm">取消</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium"
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
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-white border border-[#e5e5e5] px-4 py-3 shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
          <p className="text-sm text-[#5c5c5c]">
            共 <span className="font-medium text-[#1b1b1b]">{total}</span> 个，第 {page} / {totalPages} 页
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md font-medium shadow-sm h-8 w-8"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md font-medium shadow-sm h-8 w-8"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <MediaUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUploadSuccess={() => void loadMedia()}
      />
    </div>
  );
};

export default MediaAdminPage;
