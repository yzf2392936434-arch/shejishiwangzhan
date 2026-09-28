import React, { useState, useRef } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Video,
  Type,
  GripVertical,
  X,
  Loader2,
  AlignLeft,
  GitBranch,
  TrendingUp,
  Quote,
  FileText,
  Minus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkContentBlock } from '@shared/api.interface';
import { uploadFile } from '@client/src/hooks/useFileUpload';
import { validateFile } from '@client/src/utils/uploadRules';
import { cn } from '@client/src/lib/utils';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Image } from '@client/src/components/ui/image';

interface ContentEditorProps {
  blocks: WorkContentBlock[];
  onChange: (blocks: WorkContentBlock[]) => void;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const blockTypeLabel = (type: WorkContentBlock['type']): string => {
  const labels: Record<WorkContentBlock['type'], string> = {
    text: '正文',
    heading: '标题',
    image: '图片',
    video: '视频',
    decision: '关键决策',
    metric: '成果数字',
    quote: '客户评价',
    background: '业务背景',
    divider: '分割线',
    pullquote: '杂志引言',
    dropcap: '首字下沉',
    twocolumn: '双栏排版',
  };
  return labels[type] || type;
};

const ContentEditor: React.FC<ContentEditorProps> = ({ blocks, onChange }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(null);

  const updateBlock = (index: number, patch: Partial<WorkContentBlock>) => {
    const next = [...blocks];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeBlock = (index: number) => {
    const next = blocks.filter((_, i) => i !== index);
    onChange(next);
  };

  const getDefaultBlock = (type: WorkContentBlock['type']): WorkContentBlock => {
    const base: WorkContentBlock = {
      id: genId(),
      type,
      text: '',
    };
    if (type === 'heading') base.level = 2;
    if (type === 'decision') {
      base.decision = '关键决策描述';
      base.reason = '为什么做出这个决策';
      base.rejectedOption = '被否决的方案';
      base.decisionNumber = 1;
    }
    if (type === 'metric') {
      base.metricValue = '100%';
      base.metricLabel = '转化率提升';
      base.metricSubtext = '对比上一版本';
    }
    if (type === 'quote') {
      base.quoteText = '这段设计非常出色，完美呈现了品牌的核心价值。';
      base.quoteAuthor = '客户姓名';
      base.quoteRole = '品牌总监';
    }
    if (type === 'background') {
      base.text = '这里介绍项目的业务背景、市场环境和面临的挑战...';
    }
    if (type === 'divider') {
      base.text = '';
    }
    return base;
  };

  const insertBlock = (index: number, type: WorkContentBlock['type']) => {
    const newBlock = getDefaultBlock(type);
    const next = [...blocks];
    next.splice(index, 0, newBlock);
    onChange(next);
    setActiveMenu(null);
  };

  const handleInsertImage = () => {
    setPendingInsertIndex(activeMenu ? Number(activeMenu) : blocks.length);
    fileInputRef.current?.click();
    setActiveMenu(null);
  };

  const handleInsertVideo = () => {
    setPendingInsertIndex(activeMenu ? Number(activeMenu) : blocks.length);
    videoInputRef.current?.click();
    setActiveMenu(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateFile(file, type);
    if (!result.valid) {
      toast.error(result.error || '文件不符合上传规格');
      if (type === 'image' && fileInputRef.current) fileInputRef.current.value = '';
      if (type === 'video' && videoInputRef.current) videoInputRef.current.value = '';
      return;
    }
    const insertIdx = pendingInsertIndex ?? blocks.length;
    const tempId = genId();
    setUploadingId(tempId);

    const tempBlock: WorkContentBlock = {
      id: tempId,
      type,
      url: '',
    };
    const next = [...blocks];
    next.splice(insertIdx, 0, tempBlock);
    onChange(next);

    try {
      const url = await uploadFile(file);
      const actualNext = [...next];
      actualNext[insertIdx] = { ...actualNext[insertIdx], url };
      onChange(actualNext);
    } catch {
      const rollback = blocks.filter((b) => b.id !== tempId);
      onChange(rollback);
    } finally {
      setUploadingId(null);
      setPendingInsertIndex(null);
      if (type === 'image' && fileInputRef.current) fileInputRef.current.value = '';
      if (type === 'video' && videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) {
      setDragOverIndex(null);
      dragIndex.current = null;
      return;
    }
    const next = [...blocks];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragOverIndex(null);
    dragIndex.current = null;
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const toggleMenu = (index: string) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const next = [...blocks];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const next = [...blocks];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    onChange(next);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'video')}
      />

      <div className="space-y-4">
         {blocks.length === 0 && (
           <div
             className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#e5e5e5] bg-[#f9f9f9] py-10 text-sm text-[#8a8a8a] transition-all hover:border-[#0067c0] hover:bg-[#deecf9] hover:text-[#0067c0]"
             onClick={() => insertBlock(0, 'text')}
           >
            <Plus className="size-4" />
            <span>添加内容块，开始创作</span>
          </div>
        )}

        {blocks.map((block, index) => (
          <div
            key={block.id}
             className={cn(
               'group relative rounded-xl border border-[#e5e5e5] bg-white shadow-sm transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]',
               dragOverIndex === index && 'ring-2 ring-[#0067c0]/30 border-[#0067c0]',
             )}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
             <div className="flex items-center justify-between border-b border-[#ececec] px-3 py-2">
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   className="flex size-7 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:bg-[#f2f2f2] hover:text-[#5c5c5c] cursor-grab active:cursor-grabbing"
                   title="拖拽排序"
                 >
                   <GripVertical className="size-4" />
                 </button>
                 <span className="text-xs font-medium text-[#5c5c5c]">
                   {blockTypeLabel(block.type)}
                 </span>
               </div>
               <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                   type="button"
                   className="flex size-7 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:bg-[#f2f2f2] hover:text-[#5c5c5c] disabled:opacity-30"
                   onClick={() => moveBlockUp(index)}
                   disabled={index === 0}
                   title="上移"
                 >
                   <ChevronUp className="size-4" />
                 </button>
                 <button
                   type="button"
                   className="flex size-7 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:bg-[#f2f2f2] hover:text-[#5c5c5c] disabled:opacity-30"
                   onClick={() => moveBlockDown(index)}
                   disabled={index === blocks.length - 1}
                   title="下移"
                 >
                   <ChevronDown className="size-4" />
                 </button>
                 <div className="mx-1 h-4 w-px bg-[#e5e5e5]" />
                 <div className="relative">
                   <button
                     type="button"
                     className="flex size-7 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:bg-[#f2f2f2] hover:text-[#5c5c5c]"
                     onClick={() => toggleMenu(String(index))}
                     title="插入块"
                   >
                     <Plus className="size-4" />
                   </button>
                   {activeMenu === String(index) && (
                     <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-[#e5e5e5] bg-white p-1 shadow-[0_8px_32px_rgba(0_0_0_0.08),0_4px_8px_rgba(0_0_0_0.04)]">
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={handleInsertImage}
                       >
                         <ImageIcon className="size-4 text-[#8a8a8a]" />
                         插入图片
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={handleInsertVideo}
                       >
                         <Video className="size-4 text-[#8a8a8a]" />
                         插入视频
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'text')}
                       >
                         <AlignLeft className="size-4 text-[#8a8a8a]" />
                         插入文字
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'heading')}
                       >
                         <Type className="size-4 text-[#8a8a8a]" />
                         插入标题
                       </button>
                       <div className="my-1 h-px bg-[#ececec]" />
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'decision')}
                       >
                         <GitBranch className="size-4 text-[#8a8a8a]" />
                         关键决策
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'metric')}
                       >
                         <TrendingUp className="size-4 text-[#8a8a8a]" />
                         成果数字
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'quote')}
                       >
                         <Quote className="size-4 text-[#8a8a8a]" />
                         客户评价
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'background')}
                       >
                         <FileText className="size-4 text-[#8a8a8a]" />
                         业务背景
                       </button>
                       <button
                         type="button"
                         className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-[#1b1b1b] transition-colors hover:bg-[#f5f5f5] text-left"
                         onClick={() => insertBlock(index + 1, 'divider')}
                       >
                         <Minus className="size-4 text-[#8a8a8a]" />
                         分割线
                       </button>
                     </div>
                   )}
                </div>
                 <button
                   type="button"
                   className="flex size-7 items-center justify-center rounded-md text-[#8a8a8a] transition-colors hover:bg-[#fbe4e1] hover:text-[#c42b1c]"
                   onClick={() => removeBlock(index)}
                   title="删除"
                 >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
               {block.type === 'text' && (
                 <textarea
                   value={block.text || ''}
                   onChange={(e) => updateBlock(index, { text: e.target.value })}
                   placeholder="输入正文内容..."
                   className="w-full resize-none bg-transparent text-base leading-relaxed text-[#1b1b1b] outline-none placeholder:text-[#c0c0c0] min-h-[24px]"
                   rows={Math.max(1, (block.text || '').split('\n').length)}
                 />
               )}

               {block.type === 'heading' && (
                 <input
                   type="text"
                   value={block.text || ''}
                   onChange={(e) => updateBlock(index, { text: e.target.value })}
                   placeholder="输入标题..."
                   className={cn(
                     'w-full bg-transparent outline-none placeholder:text-[#c0c0c0] font-bold text-[#1b1b1b]',
                     block.level === 1 && 'text-3xl',
                     block.level === 2 && 'text-2xl',
                     block.level === 3 && 'text-xl',
                   )}
                 />
               )}

               {block.type === 'image' && (
                 <div className="relative group/img">
                   {uploadingId === block.id ? (
                     <div className="flex aspect-video items-center justify-center rounded-md border border-[#e5e5e5] bg-[#f9f9f9]">
                       <Loader2 className="size-6 animate-spin text-[#8a8a8a]" />
                       <span className="ml-2 text-sm text-[#5c5c5c]">上传中...</span>
                     </div>
                   ) : block.url ? (
                     <div className="relative overflow-hidden rounded-md">
                       <Image
                         src={block.url}
                         alt={block.alt || ''}
                         className="w-full object-cover"
                       />
                       <button
                         type="button"
                         onClick={() => removeBlock(index)}
                         className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-[#c42b1c] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100 hover:bg-[#d13424]"
                       >
                        <X className="size-3" />
                        删除
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

               {block.type === 'video' && (
                 <div className="relative group/vid">
                   {uploadingId === block.id ? (
                     <div className="flex aspect-video items-center justify-center rounded-md border border-[#e5e5e5] bg-[#f9f9f9]">
                       <Loader2 className="size-6 animate-spin text-[#8a8a8a]" />
                       <span className="ml-2 text-sm text-[#5c5c5c]">视频上传中...</span>
                     </div>
                   ) : block.url ? (
                     <div className="relative overflow-hidden rounded-md bg-black">
                      <video
                        src={block.url}
                        controls
                        className="w-full"
                      />
                       <button
                         type="button"
                         onClick={() => removeBlock(index)}
                         className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-[#c42b1c] px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover/vid:opacity-100 hover:bg-[#d13424]"
                       >
                        <X className="size-3" />
                        删除
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

               {block.type === 'decision' && (
                 <div className="rounded-md border border-[#fde48a] bg-[#fff4ce]/50 p-4">
                   <div className="mb-3 flex items-center gap-2 text-[#8a6500]">
                     <GitBranch className="size-4" />
                     <span className="text-sm font-semibold">关键决策 #{block.decisionNumber || 1}</span>
                   </div>
                   <div className="space-y-3">
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#8a6500]">决策内容</Label>
                       <Input
                         value={block.decision || ''}
                         onChange={(e) => updateBlock(index, { decision: e.target.value })}
                         placeholder="输入决策内容..."
                         className="h-8 border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#8a6500]">决策理由</Label>
                       <Textarea
                         value={block.reason || ''}
                         onChange={(e) => updateBlock(index, { reason: e.target.value })}
                         placeholder="为什么做出这个决策..."
                         rows={2}
                         className="min-h-[40px] border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#8a6500]">被否决方案</Label>
                       <Textarea
                         value={block.rejectedOption || ''}
                         onChange={(e) => updateBlock(index, { rejectedOption: e.target.value })}
                         placeholder="考虑过但放弃的方案..."
                         rows={2}
                         className="min-h-[40px] border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#8a6500]">编号</Label>
                       <Input
                         type="number"
                         value={block.decisionNumber ?? 1}
                         onChange={(e) => updateBlock(index, { decisionNumber: Number(e.target.value) || 1 })}
                         className="h-8 w-24 border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                   </div>
                 </div>
               )}

               {block.type === 'metric' && (
                 <div className="rounded-md border border-[#e5e5e5] bg-gradient-to-br from-[#deecf9] to-white p-6">
                   <div className="space-y-3">
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#005fb8]">大数字</Label>
                       <Input
                         value={block.metricValue || ''}
                         onChange={(e) => updateBlock(index, { metricValue: e.target.value })}
                         placeholder="如：100%、200万、+50%"
                         className="h-10 text-2xl font-bold border-[#e5e5e5] focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium text-[#5c5c5c]">标签</Label>
                         <Input
                           value={block.metricLabel || ''}
                           onChange={(e) => updateBlock(index, { metricLabel: e.target.value })}
                           placeholder="如：转化率提升"
                           className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium text-[#5c5c5c]">副标题</Label>
                         <Input
                           value={block.metricSubtext || ''}
                           onChange={(e) => updateBlock(index, { metricSubtext: e.target.value })}
                           placeholder="如：对比上一版本"
                           className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {block.type === 'quote' && (
                 <div className="rounded-md border-l-4 border-[#0067c0] bg-[#deecf9]/50 p-5">
                   <div className="space-y-3">
                     <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-[#005fb8]">引用文字</Label>
                       <Textarea
                         value={block.quoteText || ''}
                         onChange={(e) => updateBlock(index, { quoteText: e.target.value })}
                         placeholder="客户的评价内容..."
                         rows={3}
                         className="min-h-[60px] border-[#e5e5e5] text-sm italic focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium text-[#5c5c5c]">作者</Label>
                         <Input
                           value={block.quoteAuthor || ''}
                           onChange={(e) => updateBlock(index, { quoteAuthor: e.target.value })}
                           placeholder="客户姓名"
                           className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                         />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-medium text-[#5c5c5c]">角色</Label>
                         <Input
                           value={block.quoteRole || ''}
                           onChange={(e) => updateBlock(index, { quoteRole: e.target.value })}
                           placeholder="职位/角色"
                           className="h-8 border-[#e5e5e5] text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {block.type === 'background' && (
                 <div className="rounded-md border border-[#b8d6f0] bg-[#deecf9]/50 p-4">
                   <div className="mb-2 flex items-center gap-2 text-[#005fb8]">
                     <FileText className="size-4" />
                     <span className="text-sm font-semibold">业务背景</span>
                   </div>
                   <Textarea
                     value={block.text || ''}
                     onChange={(e) => updateBlock(index, { text: e.target.value })}
                     placeholder="介绍项目的业务背景、市场环境和面临的挑战..."
                     rows={4}
                     className="min-h-[60px] border-[#e5e5e5] bg-white text-sm focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] rounded-md"
                   />
                 </div>
               )}

               {block.type === 'divider' && (
                 <div className="flex items-center gap-3 py-2">
                   <div className="h-px flex-1 bg-[#e5e5e5]" />
                   <Input
                     value={block.text || ''}
                     onChange={(e) => updateBlock(index, { text: e.target.value })}
                     placeholder="可选文字..."
                     className="h-7 w-auto max-w-[200px] border-0 bg-transparent text-center text-xs text-[#8a8a8a] focus:ring-0"
                   />
                   <div className="h-px flex-1 bg-[#e5e5e5]" />
                 </div>
               )}
            </div>
          </div>
        ))}
         {blocks.length > 0 && (
           <div className="flex justify-center pt-2">
             <button
               type="button"
               onClick={() => insertBlock(blocks.length, 'text')}
               className="inline-flex items-center gap-2 rounded-md border border-[#e5e5e5] bg-white px-4 py-2 text-sm font-medium text-[#5c5c5c] shadow-sm transition-all duration-150 hover:bg-[#f9f9f9] hover:text-[#1b1b1b] hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)]"
             >
              <Plus className="size-4" />
              添加内容块
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentEditor;
