import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  MediaItem,
  MediaListResponse,
  MediaType,
} from '@shared/api.interface';

export interface MediaListParams {
  page?: number;
  pageSize?: number;
  mediaType?: MediaType;
}

export async function getMedia(
  params?: MediaListParams,
): Promise<MediaListResponse> {
  try {
    const res = await axiosForBackend.get('/api/admin/media', { params });
    return res.data;
  } catch (e) {
    logger.error('getMedia failed', e);
    throw e;
  }
}

export async function createMedia(data: {
  fileName: string;
  fileUrl: string;
  filePath: string;
  mediaType: MediaType;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}): Promise<MediaItem> {
  try {
    const res = await axiosForBackend.post('/api/admin/media', data);
    return res.data;
  } catch (e) {
    logger.error('createMedia failed', e);
    throw e;
  }
}

export async function deleteMedia(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/media/${id}`);
  } catch (e) {
    logger.error('deleteMedia failed', e);
    throw e;
  }
}
