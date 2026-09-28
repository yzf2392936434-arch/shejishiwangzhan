import React, { useRef, useState } from 'react';
import { Upload, Loader2, X, Image as ImageIcon, FileText, Music } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { toast } from 'sonner';
import { uploadFile } from '@client/src/hooks/useFileUpload';
import { cn } from '@client/src/lib/utils';
import { Image } from '@client/src/components/ui/image';
import { validateFile, type UploadType } from '@client/src/utils/uploadRules';
import UploadHint from '@client/src/components/UploadHint';

interface FileUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
  type?: 'image' | 'video' | 'pdf' | 'audio' | 'file';
  showHint?: boolean;
  className?: string;
}

const VALIDATED_TYPES: UploadType[] = ['image', 'video', 'pdf', 'audio'];

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  value,
  onChange,
  accept = 'image/*',
  label,
  placeholder = '点击选择文件或拖拽到此处',
  type = 'image',
  showHint = true,
  className,
}) => {
  const isValidateType = VALIDATED_TYPES.includes(type as UploadType);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (isValidateType) {
      const result = validateFile(file, type as UploadType);
      if (!result.valid) {
        toast.error(result.error || '文件不符合上传规格');
        return;
      }
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const renderPreview = () => {
    if (!value) return null;
    if (type === 'image') {
      return (<Image src={value} alt="preview" className="max-h-32 max-w-full object-contain" />);
    }
    if (type === 'pdf') {
      return (<div className="flex items-center gap-2 text-sm"><FileText className="size-5 text-muted-foreground" /><span className="truncate max-w-xs">{value.split('/').pop() || 'PDF 文件'}</span></div>);
    }
    if (type === 'video') {
      return (<div className="flex items-center gap-2 text-sm"><ImageIcon className="size-5 text-muted-foreground" /><span className="truncate max-w-xs">视频文件已上传</span></div>);
    }
    if (type === 'audio') {
      return (<div className="flex items-center gap-2 text-sm"><Music className="size-5 text-muted-foreground" /><span className="truncate max-w-xs">{value.split('/').pop() || '音频文件'}</span></div>);
    }
    return null;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium leading-none">{label}</label>}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer min-h-[80px] flex items-center justify-center',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30',
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} disabled={uploading} />
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" /><span>上传中...</span></div>
        ) : value ? (
          <div className="flex w-full items-center justify-between gap-3">
            {renderPreview()}
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="shrink-0">
              <X className="size-4" /> 移除
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground pointer-events-none">
            <Upload className="size-6 mb-1" />
            <span>{placeholder}</span>
            <span className="text-xs">支持 {accept.replace(/\*/g, '')} 格式</span>
          </div>
        )}
       </div>
       {isValidateType && showHint && (<UploadHint type={type as UploadType} />)}
      </div>
    );
  );
};

export default FileUploadField;
