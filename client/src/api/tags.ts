import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Tag, TagUpsertRequest } from '@shared/api.interface';

export async function getTags(): Promise<Tag[]> {
  try {
    const res = await axiosForBackend.get('/api/admin/tags');
    return res.data;
  } catch (e) {
    logger.error('getTags failed', e);
    throw e;
  }
}

export async function createTag(data: TagUpsertRequest): Promise<Tag> {
  try {
    const res = await axiosForBackend.post('/api/admin/tags', data);
    return res.data;
  } catch (e) {
    logger.error('createTag failed', e);
    throw e;
  }
}

export async function updateTag(
  id: string,
  data: TagUpsertRequest,
): Promise<Tag> {
  try {
    const res = await axiosForBackend.patch(`/api/admin/tags/${id}`, data);
    return res.data;
  } catch (e) {
    logger.error('updateTag failed', e);
    throw e;
  }
}

export async function deleteTag(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/tags/${id}`);
  } catch (e) {
    logger.error('deleteTag failed', e);
    throw e;
  }
}
