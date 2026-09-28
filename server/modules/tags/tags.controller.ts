import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';

import { TagsService } from './tags.service';
import type { Tag, TagUpsertRequest } from '@shared/api.interface';
import { AuthGuard } from '../auth/auth.guard';

class TagUpsertDto implements TagUpsertRequest {
  @IsString()
  @MaxLength(50)
  name!: string;
}

@Controller('api/admin/tags')
@UseGuards(AuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(): Promise<Tag[]> {
    return this.tagsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Tag> {
    return this.tagsService.findById(id);
  }

  @Post()
  async create(@Body() dto: TagUpsertDto): Promise<Tag> {
    return this.tagsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: TagUpsertDto,
  ): Promise<Tag> {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.tagsService.remove(id);
  }
}
