import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  SiteSettings,
  SiteSettingsUpdateRequest,
} from '@shared/api.interface';

export async function getSettings(): Promise<SiteSettings> {
  try {
    const res = await axiosForBackend.get('/api/admin/settings');
    return res.data;
  } catch (e) {
    logger.error('getSettings failed', e);
    throw e;
  }
}

export async function updateSettings(
  data: SiteSettingsUpdateRequest,
): Promise<SiteSettings> {
  try {
    const res = await axiosForBackend.put('/api/admin/settings', data);
    return res.data;
  } catch (e) {
    logger.error('updateSettings failed', e);
    throw e;
  }
}
