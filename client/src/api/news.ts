import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { NewsItem, NewsStatus } from '@shared/api.interface';

export async function getNewsList(params?: { status?: NewsStatus }): Promise<NewsItem[]> {
  try {
    const res = await axiosForBackend.get('/api/public/news', { params });
    return res.data;
  } catch (e) {
    logger.error('getNewsList failed', e);
    throw e;
  }
}

export async function getAdminNewsList(params?: { status?: NewsStatus }): Promise<NewsItem[]> {
  try {
    const res = await axiosForBackend.get('/api/admin/news', { params });
    return res.data;
  } catch (e) {
    logger.error('getAdminNewsList failed', e);
    throw e;
  }
}

export async function getNews(id: string): Promise<NewsItem> {
  try {
    const res = await axiosForBackend.get(`/api/admin/news/${id}`);
    return res.data;
  } catch (e) {
    logger.error('getNews failed', e);
    throw e;
  }
}

export async function createNews(data: Partial<NewsItem>): Promise<NewsItem> {
  try {
    const res = await axiosForBackend.post('/api/admin/news', data);
    return res.data;
  } catch (e) {
    logger.error('createNews failed', e);
    throw e;
  }
}

export async function updateNews(id: string, data: Partial<NewsItem>): Promise<NewsItem> {
  try {
    const res = await axiosForBackend.patch(`/api/admin/news/${id}`, data);
    return res.data;
  } catch (e) {
    logger.error('updateNews failed', e);
    throw e;
  }
}

export async function deleteNews(id: string): Promise<void> {
  try {
    await axiosForBackend.delete(`/api/admin/news/${id}`);
  } catch (e) {
    logger.error('deleteNews failed', e);
    throw e;
  }
}
