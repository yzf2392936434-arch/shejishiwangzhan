import { Controller, Get } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import type { Category } from '@shared/api.interface';

@Controller('api/public/categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAll(false);
  }
}
