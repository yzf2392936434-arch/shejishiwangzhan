import { Controller, Get } from '@nestjs/common';

import { NewsService } from './news.service';
import type { NewsItem } from '@shared/api.interface';

@Controller('api/public/news')
export class PublicNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  async findAll(): Promise<NewsItem[]> {
    const items: NewsItem[] = await this.newsService.findAll('published');
    return items.slice(0, 20);
  }
}
