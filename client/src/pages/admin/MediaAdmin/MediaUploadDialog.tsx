import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Progress } from '@client/src/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { mediaApi } from '@client/src/api';
import type { MediaType } from '@shared/api.interface';
import { validateFile, type UploadType } from '@client/src/utils/uploadRules';
import { uploadFileWithMeta } from '@client/src/hooks/useFileUpload';

export interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

interface UploadTask {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

interface UrlForm {
  fileName: string;
  fileUrl: string;
  mediaType: MediaType;
}

const detectMediaType = (mimeType: string): MediaType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
};

const getUploadType = (mimeType: string): UploadType | null => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return null;
};

const MediaUploadDialog: React.FC<MediaUploadDialogProps> = ({
  open,
  onOpenChange,
  onUploadSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [form, setForm] = useState<UrlForm>({
    fileName: '',
    fileUrl: '',
    mediaType: 'image',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setForm({ fileName: '', fileUrl: '', mediaType: 'image' });
    setErrors({});
    setUploadTasks([]);
    setIsUploading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const updateField = <K extends keyof UrlForm>(key: K, value: UrlForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const handleUrlSubmit = async () => {
    if (!form.fileName.trim()) {
      setErrors({ fileName: '请输入文件名' });
      return;
    }
    if (!form.fileUrl.trim()) {
      setErrors({ fileUrl: '请输入文件 URL' });
      return;
    }
    try {
      await mediaApi.createMedia({
        ...form,
        filePath: form.fileUrl,
        fileSize: 0,
      });
      toast.success('添加成功');
      handleOpenChange(false);
      onUploadSuccess();
    } catch (e) {
      logger.error('create media failed', e);
      toast.error('添加失败');
    }
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const newTasks: UploadTask[] = [];
    const validFiles: File[] = [];
    const validTasks: UploadTask[] = [];

    for (const file of files) {
      const uploadType = getUploadType(file.type);
      const task: UploadTask = {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        status: 'pending',
        progress: 0,
      };
      newTasks.push(task);

      if (!uploadType) {
        task.status = 'error';
        task.error = '不支持的文件格式';
        continue;
      }
      const result = validateFile(file, uploadType);
      if (!result.valid) {
        task.status = 'error';
        task.error = result.error;
        continue;
      }
      validFiles.push(file);
      validTasks.push(task);
    }

    setUploadTasks((prev) => [...prev, ...newTasks]);

    if (validFiles.length > 0) {
      void startUpload(validFiles, validTasks);
    } else {
      toast.error('所有文件均不符合上传规格');
    }
  };

  const startUpload = async (files: File[], tasks: UploadTask[]) => {
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const task = tasks[i];

      setUploadTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'uploading', progress: 5 } : t,
        ),
      );

      try {
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'uploading', progress: 30 } : t,
          ),
        );

        const uploadResult = await uploadFileWithMeta(file);

        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'uploading', progress: 80 } : t,
          ),
        );

        const mediaType = detectMediaType(file.type);
        await mediaApi.createMedia({
          fileName: file.name,
          fileUrl: uploadResult.url,
          filePath: uploadResult.url,
          mediaType,
          mimeType: file.type,
          fileSize: file.size,
          thumbnailUrl: uploadResult.thumbnailUrl,
          width: uploadResult.width,
          height: uploadResult.height,
        });

        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'done', progress: 100 } : t,
          ),
        );
        successCount++;
      } catch (e) {
        logger.error('upload file failed', e);
        const msg = e instanceof Error ? e.message : '上传失败';
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'error', error: msg } : t,
          ),
        );
        failCount++;
      }
    }

    setIsUploading(false);
    if (successCount > 0 && failCount === 0) {
      toast.success(`成功上传 ${successCount} 个文件`);
      handleOpenChange(false);
      onUploadSuccess();
    } else if (successCount > 0 && failCount > 0) {
      toast.success(`成功 ${successCount} 个，失败 ${failCount} 个`);
      onUploadSuccess();
    } else {
      toast.error('上传失败，请检查后重试');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加媒体</DialogTitle>
          <DialogDescription>
            通过本地上传或链接地址将文件添加到媒体库。
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}
        >
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              <UploadCloud className="size-4" />
              本地上传
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              <FileText className="size-4" />
              链接地址
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="pt-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
             <div
               className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150 ease-out ${
                 isDragging
                   ? 'border-[#0067c0] bg-[#deecf9]/50 scale-[1.01]'
                   : 'border-[#d0d0d0] bg-[#f9f9f9] hover:border-[#0067c0]/60 hover:bg-[#f5f9fd]'
               }`}
               onClick={() => fileInputRef.current?.click()}
               onDragOver={(e) => {
                 e.preventDefault();
                 setIsDragging(true);
               }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={handleDrop}
             >
               <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
                 <Upload className="size-7 text-[#0067c0]" />
               </div>
               <p className="text-sm font-medium text-[#1b1b1b]">
                 点击或拖拽文件到此处上传
               </p>
                <p className="mt-1.5 text-xs text-[#5c5c5c]">
                  支持图片（10MB）、视频（200MB）、PDF（50MB），可多选
                </p>
             </div>

             {uploadTasks.length > 0 && (
               <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                 {uploadTasks.map((task) => (
                   <div key={task.id} className="rounded-md border border-[#e5e5e5] bg-white p-3 shadow-[0_2px_8px_rgba(0_0_0_0.04)]">
                     <div className="flex items-center gap-2">
                       {task.status === 'done' && (
                         <CheckCircle2 className="size-4 shrink-0 text-[#107c10]" />
                       )}
                       {task.status === 'error' && (
                         <XCircle className="size-4 shrink-0 text-[#c42b1c]" />
                       )}
                       {task.status === 'uploading' && (
                         <Loader2 className="size-4 shrink-0 animate-spin text-[#0067c0]" />
                       )}
                       {task.status === 'pending' && (
                         <div className="size-4 shrink-0 rounded-full border-2 border-[#e5e5e5]" />
                       )}
                       <span className="flex-1 truncate text-sm text-[#1b1b1b]">
                         {task.name}
                       </span>
                       <span className="text-xs text-[#5c5c5c]">
                         {(task.size / 1024).toFixed(1)} KB
                       </span>
                     </div>
                     {task.status === 'uploading' && (
                       <Progress value={task.progress} className="mt-2 h-1" />
                     )}
                     {task.status === 'error' && task.error && (
                       <p className="mt-1 text-xs text-[#a4262c]">{task.error}</p>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </TabsContent>

          <TabsContent value="url" className="pt-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="media-name">文件名 *</Label>
                <Input
                  id="media-name"
                  value={form.fileName}
                  onChange={(e) => updateField('fileName', e.target.value)}
                />
                {errors.fileName && (
                  <p className="text-xs text-destructive">{errors.fileName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="media-url">文件 URL *</Label>
                <Input
                  id="media-url"
                  placeholder="https://..."
                  value={form.fileUrl}
                  onChange={(e) => updateField('fileUrl', e.target.value)}
                />
                {errors.fileUrl && (
                  <p className="text-xs text-destructive">{errors.fileUrl}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>媒体类型</Label>
                <Select
                  value={form.mediaType}
                  onValueChange={(val) => updateField('mediaType', val as MediaType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          {activeTab === 'url' && <Button onClick={handleUrlSubmit}>添加</Button>}
          {activeTab === 'upload' && isUploading && (
            <Button disabled>
              <Loader2 className="size-4 animate-spin" />
              上传中...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaUploadDialog;
