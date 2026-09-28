import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  HomeData,
  SiteSettings,
  Profile,
  Category,
  WorkExperience,
  Skill,
  SearchResponse,
  WorkListItem,
} from '@shared/api.interface';

export async function getHome(): Promise<HomeData> {
  try {
    const res = await axiosForBackend.get('/api/public/home');
    return res.data;
  } catch (e) {
    logger.error('getHome failed', e);
    throw e;
  }
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const res = await axiosForBackend.get('/api/public/settings');
    return res.data;
  } catch (e) {
    logger.error('getSettings failed', e);
    throw e;
  }
}

export async function getProfile(): Promise<Profile> {
  try {
    const res = await axiosForBackend.get('/api/public/profile');
    return res.data;
  } catch (e) {
    logger.error('getProfile failed', e);
    throw e;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await axiosForBackend.get('/api/public/categories');
    return res.data;
  } catch (e) {
    logger.error('getCategories failed', e);
    throw e;
  }
}

export async function getWorkExperiences(): Promise<WorkExperience[]> {
  try {
    const res = await axiosForBackend.get('/api/public/work-experiences');
    return res.data;
  } catch (e) {
    logger.error('getWorkExperiences failed', e);
    throw e;
  }
}

export async function getSkills(): Promise<Skill[]> {
  try {
    const res = await axiosForBackend.get('/api/public/skills');
    return res.data;
  } catch (e) {
    logger.error('getSkills failed', e);
    throw e;
  }
}

export async function health() {
  try {
    const res = await axiosForBackend.get('/api/public/health');
    return res.data;
  } catch (e) {
    logger.error('health check failed', e);
    throw e;
  }
}

export async function searchWorks(keyword: string): Promise<SearchResponse> {
  try {
    const res = await axiosForBackend.get('/api/public/works/search', {
      params: { keyword },
    });
    return res.data;
  } catch (e) {
    logger.error('searchWorks failed', e);
    throw e;
  }
}

export async function toggleWorkLike(
  workId: string,
  visitorId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const res = await axiosForBackend.post(
      `/api/public/works/${workId}/like`,
      { visitorId },
    );
    return res.data;
  } catch (e) {
    logger.error(`toggleWorkLike failed for ${workId}`, e);
    throw e;
  }
}

export async function getWorkLikeStatus(
  workId: string,
  visitorId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const res = await axiosForBackend.get(
      `/api/public/works/${workId}/like-status`,
      { params: { visitorId } },
    );
    return res.data;
  } catch (e) {
    logger.error(`getWorkLikeStatus failed for ${workId}`, e);
    throw e;
  }
}

export async function toggleWorkFavorite(
  workId: string,
  visitorId: string,
): Promise<{ favorited: boolean; favoriteCount: number }> {
  try {
    const res = await axiosForBackend.post(
      `/api/public/works/${workId}/favorite`,
      { visitorId },
    );
    return res.data;
  } catch (e) {
    logger.error(`toggleWorkFavorite failed for ${workId}`, e);
    throw e;
  }
}

export async function getWorkFavoriteStatus(
  workId: string,
  visitorId: string,
): Promise<{ favorited: boolean; favoriteCount: number }> {
  try {
    const res = await axiosForBackend.get(
      `/api/public/works/${workId}/favorite-status`,
      { params: { visitorId } },
    );
    return res.data;
  } catch (e) {
    logger.error(`getWorkFavoriteStatus failed for ${workId}`, e);
    throw e;
  }
}

export async function getHotWorks(
  limit: number = 6,
): Promise<WorkListItem[]> {
  try {
    const res = await axiosForBackend.get('/api/public/works/hot', {
      params: { limit },
    });
    return res.data;
  } catch (e) {
    logger.error('getHotWorks failed', e);
    throw e;
  }
}

export async function getRelatedWorks(
  slug: string,
  limit: number = 6,
): Promise<WorkListItem[]> {
  try {
    const res = await axiosForBackend.get(
      `/api/public/works/${slug}/related`,
      { params: { limit } },
    );
    return res.data;
  } catch (e) {
    logger.error(`getRelatedWorks failed for ${slug}`, e);
    throw e;
  }
}
