import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Briefcase,
  FileText,
  Upload,
  Download,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Switch } from '@client/src/components/ui/switch';
import { Label } from '@client/src/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
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
import { Badge } from '@client/src/components/ui/badge';
import { profileApi } from '@client/src/api';
import type {
  WorkExperience,
  WorkExperienceUpsertRequest,
} from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const experienceSchema = z.object({
  company: z.string().min(1, '请输入公司名称'),
  position: z.string().min(1, '请输入职位'),
  startDate: z.string().min(1, '请输入开始时间'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  projects: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

type ExperienceForm = z.infer<typeof experienceSchema>;

const ResumeAdminPage: React.FC = () => {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ExperienceForm>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    projects: '',
    sortOrder: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await profileApi.getExperiences();
      setExperiences(data);
    } catch (e) {
      logger.error('load experiences failed', e);
      toast.error('加载工作经历失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExperiences();
  }, [loadExperiences]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      projects: '',
      sortOrder: 0,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (exp: WorkExperience) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || '',
      isCurrent: exp.isCurrent,
      description: exp.description || '',
      projects: exp.projects || '',
      sortOrder: exp.sortOrder,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const updateField = <K extends keyof ExperienceForm>(
    key: K,
    value: ExperienceForm[K],
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
    const result = experienceSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errs[path]) errs[path] = issue.message;
      });
      setErrors(errs);
      return;
    }

    const payload: WorkExperienceUpsertRequest = {
      company: form.company,
      position: form.position,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      isCurrent: form.isCurrent,
      description: form.description,
      projects: form.projects,
      sortOrder: form.sortOrder,
    };
    try {
      if (editingId) {
        await profileApi.updateExperience(editingId, payload);
        toast.success('更新成功');
      } else {
        await profileApi.createExperience(payload);
        toast.success('创建成功');
      }
      setDialogOpen(false);
      void loadExperiences();
    } catch (e) {
      logger.error('save experience failed', e);
      toast.error('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await profileApi.deleteExperience(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      void loadExperiences();
    } catch (e) {
      logger.error('delete experience failed', e);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">简历管理</h1>
          <p className="mt-1 text-xs text-[#5c5c5c]">
            管理你的简历文件与工作经历
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 px-4 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
          >
            <Download className="size-4" />
            下载简历
          </Button>
          <Button
            onClick={openCreate}
            className="h-8 px-4 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md shadow-sm transition-all duration-150 ease-out"
          >
            <Plus className="size-4" />
            新增工作经历
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 ease-out hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#f2f2f2]">
              <FileText className="size-4 text-[#5c5c5c]" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                PDF 简历
              </CardTitle>
              <CardDescription className="text-xs text-[#5c5c5c]">
                上传简历文件，供访客下载
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-white border border-[#e5e5e5] shadow-sm">
              <FileText className="size-7 text-[#8a8a8a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1b1b1b] truncate">
                暂无简历文件
              </p>
              <p className="mt-0.5 text-xs text-[#5c5c5c]">
                请到「个人资料」页面上传简历 PDF
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] rounded-md"
              >
                <Upload className="size-3.5" />
                上传
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-8 px-3 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] rounded-md"
              >
                <Download className="size-3.5" />
                下载
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1b1b1b]">工作经历</h2>
            <p className="mt-0.5 text-xs text-[#5c5c5c]">
              按时间倒序展示你的职业履历
            </p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#5c5c5c] border border-[#e0e0e0]"
          >
            {experiences.length} 段经历
          </Badge>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#5c5c5c]">加载中...</div>
        ) : experiences.length === 0 ? (
          <Card className="bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#f0f0f0]">
                <Inbox className="size-5 text-[#c0c0c0]" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#1b1b1b]">
                暂无工作经历
              </h3>
              <p className="mt-1 text-xs text-[#8a8a8a]">
                添加你的第一份工作经历吧
              </p>
              <Button
                onClick={openCreate}
                variant="outline"
                className="mt-5 h-8 px-4 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
              >
                <Plus className="size-4" />
                添加第一份工作
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
             {experiences.map((exp) => (
               <Card
                 key={exp.id}
                 className="bg-white rounded-xl border border-[#e5e5e5] shadow-sm transition-all duration-150 ease-out hover:shadow-md hover:-translate-y-px"
               >
                 <CardContent className="p-5">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-4 flex-1 min-w-0">
                       <div className="flex shrink-0 flex-col items-center">
                         <div className="flex size-10 items-center justify-center rounded-full bg-[#f2f2f2] border border-[#e5e5e5]">
                           <Briefcase className="size-5 text-[#5c5c5c]" />
                         </div>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                           <h3 className="text-base font-semibold text-[#1b1b1b]">
                             {exp.position}
                           </h3>
                           <span className="text-sm text-[#5c5c5c]">
                             @ {exp.company}
                           </span>
                           {exp.isCurrent && (
                             <Badge className="rounded-full bg-[#dff6dd] text-[#107c10] border border-[#b6e0b2] px-2 py-0 text-[11px] font-medium">
                               在职
                             </Badge>
                           )}
                         </div>
                         <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5c5c5c]">
                           <Calendar className="size-3.5" />
                           <span>
                             {exp.startDate} -{' '}
                             {exp.isCurrent ? '至今' : exp.endDate || ''}
                           </span>
                         </div>
                         {exp.description && (
                           <p className="mt-3 text-sm text-[#1b1b1b] leading-relaxed">
                             {exp.description}
                           </p>
                         )}
                         {exp.projects && (
                           <div className="mt-3 rounded-md bg-[#f9f9f9] border border-[#ececec] p-3">
                             <p className="text-xs font-semibold text-[#5c5c5c] mb-1.5">
                               项目经验
                             </p>
                             <p className="text-sm text-[#1b1b1b] whitespace-pre-line leading-relaxed">
                               {exp.projects}
                             </p>
                           </div>
                         )}
                       </div>
                     </div>
                     <div className="flex items-center gap-1 shrink-0">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => openEdit(exp)}
                         title="编辑"
                         className="h-8 w-8 text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                       >
                         <Edit2 className="size-4" />
                       </Button>
                       <AlertDialog
                         open={deleteId === exp.id}
                         onOpenChange={(open) => !open && setDeleteId(null)}
                       >
                         <AlertDialogTrigger asChild>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => setDeleteId(exp.id)}
                             title="删除"
                             className="h-8 w-8 text-[#5c5c5c] hover:bg-[#fbe4e1] hover:text-[#c42b1c] rounded-md"
                           >
                             <Trash2 className="size-4" />
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="rounded-xl border border-[#e5e5e5] shadow-[0_8px_32px_rgba(0_0_0_0.08),_0_4px_8px_rgba(0_0_0_0.04)]">
                           <AlertDialogHeader>
                             <AlertDialogTitle className="text-base font-semibold text-[#1b1b1b]">
                               确认删除工作经历？
                             </AlertDialogTitle>
                             <AlertDialogDescription className="text-sm text-[#5c5c5c]">
                               删除后该经历将无法恢复。
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel className="h-8 px-4 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md">
                               取消
                             </AlertDialogCancel>
                             <AlertDialogAction
                               className="h-8 px-4 text-sm font-medium bg-[#c42b1c] text-white hover:bg-[#d13424] rounded-md"
                               onClick={handleDelete}
                             >
                               删除
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border border-[#e5e5e5] shadow-[0_8px_32px_rgba(0_0_0_0.08),_0_4px_8px_rgba(0_0_0_0.04)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#1b1b1b]">
              {editingId ? '编辑工作经历' : '新增工作经历'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5c5c5c]">
              填写工作经历信息，将在前台简历页展示。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exp-company" className="text-sm font-medium text-[#1b1b1b]">
                  公司名称 *
                </Label>
                <Input
                  id="exp-company"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                {errors.company && (
                  <p className="text-xs text-[#c42b1c]">{errors.company}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-position" className="text-sm font-medium text-[#1b1b1b]">
                  职位 *
                </Label>
                <Input
                  id="exp-position"
                  value={form.position}
                  onChange={(e) => updateField('position', e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                {errors.position && (
                  <p className="text-xs text-[#c42b1c]">{errors.position}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exp-start" className="text-sm font-medium text-[#1b1b1b]">
                  开始时间 *
                </Label>
                <Input
                  id="exp-start"
                  type="month"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
                {errors.startDate && (
                  <p className="text-xs text-[#c42b1c]">{errors.startDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exp-end" className="text-sm font-medium text-[#1b1b1b]">
                  结束时间
                </Label>
                <Input
                  id="exp-end"
                  type="month"
                  value={form.endDate || ''}
                  disabled={form.isCurrent}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[#e5e5e5] bg-[#f9f9f9] p-4">
              <div>
                <p className="text-sm font-medium text-[#1b1b1b]">目前在职</p>
                <p className="text-xs text-[#5c5c5c] mt-0.5">
                  开启后结束时间将显示为「至今」
                </p>
              </div>
              <Switch
                checked={form.isCurrent}
                onCheckedChange={(val) => updateField('isCurrent', val)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-desc" className="text-sm font-medium text-[#1b1b1b]">
                工作描述
              </Label>
              <Textarea
                id="exp-desc"
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-projects" className="text-sm font-medium text-[#1b1b1b]">
                项目经验
              </Label>
              <Textarea
                id="exp-projects"
                rows={4}
                placeholder="每行一个项目或成就"
                value={form.projects}
                onChange={(e) => updateField('projects', e.target.value)}
                className="px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-sort" className="text-sm font-medium text-[#1b1b1b]">
                排序权重
              </Label>
              <Input
                id="exp-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  updateField('sortOrder', Number(e.target.value) || 0)
                }
                className="h-9 px-3 text-sm rounded-md border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-8 px-4 text-sm font-medium bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md transition-all duration-150 ease-out"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="h-8 px-4 text-sm font-medium bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md shadow-sm transition-all duration-150 ease-out"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeAdminPage;
