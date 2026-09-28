import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Category, CategoryUpsertRequest } from '@shared/api.interface';

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await axiosForBackend.get('/api/admin/categories');
    return res.data;
  } catch (e) {
    logger.error('getCategories failed', e);
    throw e;
  }
}

export async function getCategory(id: string): Promise<Category> {
  try {
    const res = await axiosForBackend.get(`/api/admin/categories/${id}`);
    return res.data;
  } catch (e) {
    logger.error('getCategory failed', e);
    throw e;
  }
}

export async function createCategory(
  data: CategoryUpsertRequest,
): Promise<Category> {
  try {
    const res = await axiosForBackend.post('/api/admin/categories', data);
    return res.data;
  } catch (e) {
    logger.error('createCategory failed', e);
    throw e;
  }
}

export async function updateCategory(
  id: string,
  data: CategoryUpsertRequest,
): Promise<Category> {
  try {
    const res = await axiosForBackend.patch(
      `/api/admin/categories/${id}`,
      data,
    );
    return res.data;
  } catch (e) {
    logger.error('updateCategory failed', e);
    throw e;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/categories/${id}`);
  } catch (e) {
    logger.error('deleteCategory failed', e);
    throw e;
  }
}

export async function reorderCategories(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await axiosForBackend.post('/api/admin/categories/reorder', { items });
  } catch (e) {
    logger.error('reorderCategories failed', e);
    throw e;
  }
}
