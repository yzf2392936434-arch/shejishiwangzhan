import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Star,
  Pin,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Image,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@client/src/components/ui/table';
import { Badge } from '@client/src/components/ui/badge';
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
import { worksApi, categoriesApi } from '@client/src/api';
import type {
  WorkListItem,
  WorkStatus,
  Category,
  WorksListResponse,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Image as UIImage } from '@client/src/components/ui/image';

const statusMap: Record<
  WorkStatus,
  { label: string; className: string }
> = {
  draft: {
    label: '草稿',
    className:
      'bg-[#fff4ce] text-[#8a6500] border-[#fde48a]',
  },
  published: {
    label: '已发布',
    className:
      'bg-[#dff6dd] text-[#107c10] border-[#b6e0b2]',
  },
  hidden: {
    label: '隐藏',
    className:
      'bg-[#f0f0f0] text-[#5c5c5c] border-[#e0e0e0]',
  },
  password: {
    label: '密码保护',
    className:
      'bg-[#deecf9] text-[#005fb8] border-[#b8d6f0]',
  },
};

const WorksAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;
  const keyword = searchParams.get('keyword') || '';
  const statusFilter = (searchParams.get('status') || '') as WorkStatus | '';
  const categoryFilter = searchParams.get('category') || '';

  const loadWorks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res: WorksListResponse = await worksApi.getAdminWorks(params);
      setWorks(res.items);
      setTotal(res.total);
    } catch (e) {
      logger.error('load works failed', e);
      toast.error('加载作品列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesApi.getCategories();
      setCategories(data);
    } catch (e) {
      logger.error('load categories failed', e);
    }
  }, []);

  useEffect(() => {
    void loadWorks();
  }, [loadWorks]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await worksApi.deleteWork(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      void loadWorks();
    } catch (e) {
      logger.error('delete work failed', e);
      toast.error('删除失败');
    }
  };

  const handleToggleFeatured = async (work: WorkListItem) => {
    try {
      await worksApi.setFeatured(work.id, !work.isFeatured);
      toast.success(work.isFeatured ? '已取消精选' : '已设为精选');
      void loadWorks();
    } catch (e) {
      logger.error('toggle featured failed', e);
      toast.error('操作失败');
    }
  };

  const handleTogglePinned = async (work: WorkListItem) => {
    try {
      await worksApi.setPinned(work.id, !work.isPinned);
      toast.success(work.isPinned ? '已取消置顶' : '已置顶');
      void loadWorks();
    } catch (e) {
      logger.error('toggle pinned failed', e);
      toast.error('操作失败');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const showEmpty = !loading && works.length === 0;

  return (
    <div className="space-y-4 bg-[#f3f3f3] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[#1b1b1b]">作品管理</h1>
          <Badge
            variant="outline"
            className="rounded-full border-[#e0e0e0] bg-[#f0f0f0] text-[#5c5c5c]"
          >
            共 {total} 个作品
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8a8a]" />
            <Input
              className="h-9 rounded-md border-[#e5e5e5] pl-10 bg-white focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] text-sm"
              placeholder="搜索作品标题..."
              value={keyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateParams({ keyword: e.target.value })
              }
            />
          </div>
          <Button
            asChild
            className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] shadow-sm rounded-md font-medium h-8 px-4 text-sm"
          >
            <Link to="/admin/works/new">
              <Plus className="size-4" />
              新建作品
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val: string) => updateParams({ status: val })}
        >
          <SelectTrigger className="h-9 w-[140px] rounded-md border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部状态</SelectItem>
            {Object.entries(statusMap).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(val: string) => updateParams({ category: val })}
        >
          <SelectTrigger className="h-9 w-[140px] rounded-md border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
        {showEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="mb-3 size-10 text-[#c0c0c0]" />
            <p className="text-sm font-semibold text-[#1b1b1b]">暂无作品</p>
            <p className="mt-1 text-xs text-[#8a8a8a]">
              还没有作品，去创建第一个作品吧
            </p>
            <Button
              asChild
              className="mt-4 bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm"
            >
              <Link to="/admin/works/new">
                <Plus className="size-4" />
                新建作品
              </Link>
            </Button>
          </div>
        ) : (
           <Table>
             <TableHeader className="bg-[#f9f9f9]">
               <TableRow className="border-b border-[#ececec] hover:bg-transparent">
                 <TableHead className="h-11 text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   作品
                 </TableHead>
                 <TableHead className="h-11 text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   状态
                 </TableHead>
                 <TableHead className="hidden h-11 md:table-cell text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   分类
                 </TableHead>
                 <TableHead className="hidden h-11 md:table-cell text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   年份
                 </TableHead>
                 <TableHead className="hidden h-11 lg:table-cell text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   点赞数
                 </TableHead>
                 <TableHead className="h-11 text-right text-xs font-semibold text-[#5c5c5c] bg-[#f9f9f9]">
                   操作
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow className="border-b border-[#ececec] hover:bg-transparent">
                   <TableCell
                     colSpan={6}
                     className="py-10 text-center text-[#5c5c5c]"
                   >
                     加载中...
                   </TableCell>
                 </TableRow>
               ) : (
                 works.map((work) => (
                   <TableRow
                     key={work.id}
                     className="h-11 border-b border-[#ececec] transition-colors hover:bg-[#f5f5f5]"
                   >
                    <TableCell>
                       <div className="flex items-center gap-3">
                         {work.coverUrl ? (
                           <UIImage
                             src={work.coverUrl}
                             alt={work.title}
                             className="h-10 w-10 rounded-md object-cover"
                           />
                         ) : (
                           <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f0f0f0]">
                             <Image className="size-4 text-[#8a8a8a]" />
                           </div>
                         )}
                         <div className="min-w-0">
                           <p className="max-w-[260px] truncate font-medium text-[#1b1b1b]">
                             {work.title}
                             {work.isPinned && (
                               <Pin className="ml-1 inline size-3.5 text-[#f4b400]" />
                             )}
                             {work.isFeatured && (
                               <Star className="ml-1 inline size-3.5 fill-[#f4b400] text-[#f4b400]" />
                             )}
                           </p>
                           <p className="max-w-[260px] truncate text-xs text-[#5c5c5c]">
                             {work.summary || '无简介'}
                           </p>
                         </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <Badge
                         variant="outline"
                         className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusMap[work.status]?.className || 'bg-[#f0f0f0] text-[#5c5c5c] border-[#e0e0e0]'}`}
                       >
                        {statusMap[work.status]?.label || work.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="hidden md:table-cell">
                       <div className="flex flex-wrap gap-1">
                         {work.categories.slice(0, 2).map((c) => (
                           <Badge
                             key={c.id}
                             variant="outline"
                             className="rounded-full border-[#e0e0e0] bg-[#f0f0f0] text-xs text-[#5c5c5c]"
                           >
                             {c.name}
                           </Badge>
                         ))}
                         {work.categories.length > 2 && (
                           <Badge
                             variant="outline"
                             className="rounded-full border-[#e0e0e0] bg-[#f0f0f0] text-xs text-[#5c5c5c]"
                           >
                             +{work.categories.length - 2}
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="hidden md:table-cell text-sm text-[#5c5c5c]">
                       {work.year || '-'}
                     </TableCell>
                     <TableCell className="hidden lg:table-cell text-sm text-[#5c5c5c]">
                       {work.likeCount || 0}
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="inline-flex gap-0.5">
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => handleToggleFeatured(work)}
                           title={work.isFeatured ? '取消精选' : '设为精选'}
                           className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                         >
                           <Star
                             className={`size-4 ${work.isFeatured ? 'text-[#f4b400] fill-[#f4b400]' : 'text-[#c0c0c0]'}`}
                           />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => handleTogglePinned(work)}
                           title={work.isPinned ? '取消置顶' : '置顶'}
                           className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                         >
                           <Pin
                             className={`size-4 ${work.isPinned ? 'text-[#f4b400]' : 'text-[#c0c0c0]'}`}
                           />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() =>
                             navigate(`/admin/works/${work.id}/edit`)
                           }
                           title="编辑"
                           className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                         >
                           <Edit className="size-4" />
                         </Button>
                         <AlertDialog
                           open={deleteId === work.id}
                           onOpenChange={(open: boolean) =>
                             !open && setDeleteId(null)
                           }
                         >
                           <AlertDialogTrigger asChild>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => setDeleteId(work.id)}
                               title="删除"
                               className="text-[#c42b1c] hover:bg-[#fbe4e1] hover:text-[#a4262c] rounded-md"
                             >
                               <Trash2 className="size-4" />
                             </Button>
                           </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                确认删除作品？
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                删除后作品将移至回收站，可在30天内恢复。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                               <AlertDialogAction
                                 className="bg-[#c42b1c] text-white hover:bg-[#d13424]"
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
        )}

         {totalPages > 1 && (
           <div className="flex items-center justify-between border-t border-[#ececec] px-4 py-3">
             <p className="text-sm text-[#5c5c5c]">
               共 {total} 条，第 {page} / {totalPages} 页
             </p>
             <div className="flex gap-1">
               <Button
                 variant="outline"
                 size="icon"
                 className="h-8 w-8 rounded-md border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9]"
                 disabled={page <= 1}
                 onClick={() => goToPage(page - 1)}
               >
                 <ChevronLeft className="size-4" />
               </Button>
               <Button
                 variant="outline"
                 size="icon"
                 className="h-8 w-8 rounded-md border-[#e5e5e5] bg-white text-[#1b1b1b] hover:bg-[#f9f9f9]"
                 disabled={page >= totalPages}
                 onClick={() => goToPage(page + 1)}
               >
                 <ChevronRight className="size-4" />
               </Button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default WorksAdminPage;
