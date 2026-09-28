import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  Profile,
  ProfileUpdateRequest,
  WorkExperience,
  WorkExperienceUpsertRequest,
} from '@shared/api.interface';

export async function getProfile(): Promise<Profile> {
  try {
    const res = await axiosForBackend.get('/api/admin/profile');
    return res.data;
  } catch (e) {
    logger.error('getProfile failed', e);
    throw e;
  }
}

export async function updateProfile(
  data: ProfileUpdateRequest,
): Promise<Profile> {
  try {
    const res = await axiosForBackend.put('/api/admin/profile', data);
    return res.data;
  } catch (e) {
    logger.error('updateProfile failed', e);
    throw e;
  }
}

export async function getExperiences(): Promise<WorkExperience[]> {
  try {
    const res = await axiosForBackend.get('/api/admin/profile/experiences');
    return res.data;
  } catch (e) {
    logger.error('getExperiences failed', e);
    throw e;
  }
}

export async function createExperience(
  data: WorkExperienceUpsertRequest,
): Promise<WorkExperience> {
  try {
    const res = await axiosForBackend.post(
      '/api/admin/profile/experiences',
      data,
    );
    return res.data;
  } catch (e) {
    logger.error('createExperience failed', e);
    throw e;
  }
}

export async function updateExperience(
  id: string,
  data: WorkExperienceUpsertRequest,
): Promise<WorkExperience> {
  try {
    const res = await axiosForBackend.patch(
      `/api/admin/profile/experiences/${id}`,
      data,
    );
    return res.data;
  } catch (e) {
    logger.error('updateExperience failed', e);
    throw e;
  }
}

export async function deleteExperience(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/profile/experiences/${id}`);
  } catch (e) {
    logger.error('deleteExperience failed', e);
    throw e;
  }
}

export async function reorderExperiences(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await axiosForBackend.post(
      '/api/admin/profile/experiences/reorder',
      { items },
    );
  } catch (e) {
    logger.error('reorderExperiences failed', e);
    throw e;
  }
}
