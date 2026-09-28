import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

function generateThumbnail(
  file: File,
  maxWidth = 400,
  quality = 0.75,
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxWidth / width);
      const thumbWidth = Math.round(width * scale);
      const thumbHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = thumbWidth;
      canvas.height = thumbHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'));
            return;
          }
          resolve({ blob, width, height });
        },
        'image/webp',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadFile(file: File): Promise<string> {
  const result = await uploadFileWithMeta(file);
  return result.url;
}

export async function uploadFileWithMeta(file: File): Promise<UploadResult> {
  try {
    const dataloom = await getDataloom();
    const bucketId = getDefaultBucketId();

    const { data, error } = await dataloom.storage
      .from(bucketId)
      .uploadFile(file);
    if (error) {
      logger.error('upload file failed', error);
      toast.error(`上传失败：${error.message || '未知错误'}`);
      throw new Error(error.message || 'Upload failed');
    }
    if (!data?.download_url) {
      toast.error('上传失败：未获取到下载链接');
      throw new Error('No download_url returned');
    }

    const result: UploadResult = {
      url: data.download_url,
    };

    if (file.type.startsWith('image/')) {
      try {
        const dims = await getImageDimensions(file);
        result.width = dims.width;
        result.height = dims.height;

        if (dims.width > 400) {
          const thumb = await generateThumbnail(file);
          const thumbFile = new File(
            [thumb.blob],
            file.name.replace(/\.[^.]+$/, '_thumb.webp'),
            { type: 'image/webp' },
          );
          const thumbRes = await dataloom.storage
            .from(bucketId)
            .uploadFile(thumbFile);
          if (thumbRes.data?.download_url) {
            result.thumbnailUrl = thumbRes.data.download_url;
          }
        }
      } catch (thumbErr) {
        logger.warn('thumbnail generation failed, skipping', thumbErr);
      }
    }

    return result;
  } catch (e: unknown) {
    logger.error('upload file error', e);
    toast.error(`上传失败：${e instanceof Error ? e.message : '未知错误'}`);
    throw e;
  }
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(file);
    urls.push(url);
  }
  return urls;
}

export async function uploadFilesWithMeta(files: File[]): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const file of files) {
    const res = await uploadFileWithMeta(file);
    results.push(res);
  }
  return results;
}
