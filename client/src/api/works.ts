import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  WorksListResponse,
  Work,
  WorkListItem,
  WorkUpsertRequest,
  WorksFilterParams,
  DashboardStats,
  PublicWorksFilterParams,
  ExportDataResponse,
} from '@shared/api.interface';

export async function getAdminWorks(
  params?: WorksFilterParams,
): Promise<WorksListResponse> {
  try {
    const res = await axiosForBackend.get('/api/admin/works', { params });
    return res.data;
  } catch (e) {
    logger.error('getAdminWorks failed', e);
    throw e;
  }
}

export async function getWork(id: string): Promise<Work> {
  try {
    const res = await axiosForBackend.get(`/api/admin/works/${id}`);
    return res.data;
  } catch (e) {
    logger.error('getWork failed', e);
    throw e;
  }
}

export async function createWork(data: WorkUpsertRequest): Promise<Work> {
  try {
    const res = await axiosForBackend.post('/api/admin/works', data);
    return res.data;
  } catch (e) {
    logger.error('createWork failed', e);
    throw e;
  }
}

export async function updateWork(
  id: string,
  data: Partial<WorkUpsertRequest>,
): Promise<Work> {
  try {
    const res = await axiosForBackend.patch(`/api/admin/works/${id}`, data);
    return res.data;
  } catch (e) {
    logger.error('updateWork failed', e);
    throw e;
  }
}

export async function deleteWork(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/works/${id}`);
  } catch (e) {
    logger.error('deleteWork failed', e);
    throw e;
  }
}

export async function restoreWork(id: string): Promise<void> {
  try {
    await axiosForBackend.post(`/api/admin/works/${id}/restore`);
  } catch (e) {
    logger.error('restoreWork failed', e);
    throw e;
  }
}

export async function setFeatured(
  id: string,
  featured: boolean,
): Promise<void> {
  try {
    await axiosForBackend.post(`/api/admin/works/${id}/featured`, {
      featured,
    });
  } catch (e) {
    logger.error('setFeatured failed', e);
    throw e;
  }
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  try {
    await axiosForBackend.post(`/api/admin/works/${id}/pinned`, { pinned });
  } catch (e) {
    logger.error('setPinned failed', e);
    throw e;
  }
}

export async function updateStatus(
  id: string,
  status: string,
): Promise<void> {
  try {
    await axiosForBackend.post(`/api/admin/works/${id}/status`, { status });
  } catch (e) {
    logger.error('updateStatus failed', e);
    throw e;
  }
}

export async function reorderWorks(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await axiosForBackend.post('/api/admin/works/reorder', { items });
  } catch (e) {
    logger.error('reorderWorks failed', e);
    throw e;
  }
}

export async function getWorkStats(): Promise<DashboardStats> {
  try {
    const res = await axiosForBackend.get('/api/admin/works/dashboard/stats');
    return res.data;
  } catch (e) {
    logger.error('getWorkStats failed', e);
    throw e;
  }
}

export async function getPublicWorks(
  params?: PublicWorksFilterParams,
): Promise<WorksListResponse> {
  try {
    const res = await axiosForBackend.get('/api/public/works', { params });
    return res.data;
  } catch (e) {
    logger.error('getPublicWorks failed', e);
    throw e;
  }
}

export async function getWorkBySlug(slug: string): Promise<Work> {
  try {
    const res = await axiosForBackend.get(`/api/public/works/${slug}`);
    return res.data;
  } catch (e) {
    logger.error('getWorkBySlug failed', e);
    throw e;
  }
}

export async function verifyWorkPassword(
  slug: string,
  password: string,
): Promise<{ success: boolean; work?: Work }> {
  try {
    const res = await axiosForBackend.post(
      `/api/public/works/${slug}/verify-password`,
      { password },
    );
    return res.data;
  } catch (e) {
    logger.error('verifyWorkPassword failed', e);
    throw e;
  }
}

export async function getRelatedWorks(
  workId: string,
): Promise<WorkListItem[]> {
  try {
    const res = await axiosForBackend.get(
      `/api/public/works/${workId}/related`,
    );
    return res.data;
  } catch (e) {
    logger.error('getRelatedWorks failed', e);
    throw e;
  }
}

export async function incrementView(workId: string): Promise<void> {
  try {
    await axiosForBackend.post(`/api/public/works/${workId}/view`);
  } catch (e) {
    logger.error('incrementView failed', e);
    throw e;
  }
}

export async function exportData(): Promise<ExportDataResponse> {
  try {
    const res = await axiosForBackend.get('/api/admin/works/export/data');
    return res.data;
  } catch (e) {
    logger.error('exportData failed', e);
    throw e;
  }
}
