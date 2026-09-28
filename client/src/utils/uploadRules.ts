export const UPLOAD_RULES = {
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 10,
    maxWidth: 4096,
    description: '支持 JPG / PNG / WebP，单张最大 10MB，建议宽度不超过 4096px',
  },
  video: {
    allowedTypes: ['video/mp4', 'video/webm'],
    maxSizeMB: 200,
    maxResolution: '1920x1080',
    description: '支持 MP4 / WebM，单个最大 200MB，建议分辨率不超过 1920×1080',
  },
  pdf: {
    allowedTypes: ['application/pdf'],
    maxSizeMB: 50,
    description: '支持 PDF 格式，单个最大 50MB',
  },
  audio: {
    allowedTypes: ['audio/mpeg', 'audio/mp3'],
    maxSizeMB: 20,
    description: '支持 MP3 格式，单个最大 20MB',
  },
} as const;

export type UploadType = keyof typeof UPLOAD_RULES;

export interface ValidateResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  type: UploadType,
): ValidateResult {
  const rule = UPLOAD_RULES[type];
  const maxSizeBytes = rule.maxSizeMB * 1024 * 1024;

  if (!rule.allowedTypes.includes(file.type as never)) {
    const typeLabels: Record<UploadType, string> = {
      image: 'JPG / PNG / WebP',
      video: 'MP4 / WebM',
      pdf: 'PDF',
      audio: 'MP3',
    };
    return {
      valid: false,
      error: `不支持的文件格式，请上传 ${typeLabels[type]} 格式`,
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小超过 ${rule.maxSizeMB}MB 限制`,
    };
  }

  return { valid: true };
}

export const WORK_WORD_LIMITS = {
  title: { max: 50, label: '作品名称' },
  slug: { max: 100, label: 'URL别名' },
  summary: { max: 500, label: '作品简介' },
  background: { max: 5000, label: '项目背景' },
  goal: { max: 3000, label: '设计目标' },
  designApproach: { max: 5000, label: '设计思路' },
  myRole: { max: 2000, label: '我的角色' },
  results: { max: 3000, label: '项目成果' },
  seoTitle: { max: 60, label: 'SEO标题' },
  seoDescription: { max: 200, label: 'SEO描述' },
  shareTitle: { max: 100, label: '分享标题' },
} as const;

export type WorkWordLimitKey = keyof typeof WORK_WORD_LIMITS;
