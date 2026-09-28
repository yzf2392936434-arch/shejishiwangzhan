import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, desc, isNull } from 'drizzle-orm';
import { workExperiences } from '@server/database/schema';
import type { WorkExperience, WorkExperienceUpsertRequest } from '@shared/api.interface';

@Injectable()
export class WorkExperienceService {
  private readonly logger = new Logger(WorkExperienceService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async findAll(): Promise<WorkExperience[]> {
    const rows = await this.db
      .select()
      .from(workExperiences)
      .where(isNull(workExperiences.deletedAt))
      .orderBy(desc(workExperiences.sortOrder), desc(workExperiences.startDate));

    return rows.map((row) => this.toWorkExperience(row));
  }

  async findById(id: string): Promise<WorkExperience> {
    const rows = await this.db
      .select()
      .from(workExperiences)
      .where(eq(workExperiences.id, id));

    if (rows.length === 0) {
      throw new NotFoundException('工作经历不存在');
    }
    return this.toWorkExperience(rows[0]);
  }

  async create(dto: WorkExperienceUpsertRequest): Promise<WorkExperience> {
    const values: typeof workExperiences.$inferInsert = {
      company: dto.company,
      position: dto.position,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      isCurrent: dto.isCurrent ?? false,
      description: dto.description ?? null,
      projects: dto.projects ?? null,
      sortOrder: dto.sortOrder ?? 0,
    };

    const result = await this.db.insert(workExperiences).values(values).returning();
    this.logger.log(`创建工作经历: ${result[0].id}`);
    return this.toWorkExperience(result[0]);
  }

  async update(id: string, dto: WorkExperienceUpsertRequest): Promise<WorkExperience> {
    const patch: Partial<typeof workExperiences.$inferInsert> = {};
    if (dto.company !== undefined) patch.company = dto.company;
    if (dto.position !== undefined) patch.position = dto.position;
    if (dto.startDate !== undefined) patch.startDate = dto.startDate;
    if (dto.endDate !== undefined) patch.endDate = dto.endDate ?? null;
    if (dto.isCurrent !== undefined) patch.isCurrent = dto.isCurrent;
    if (dto.description !== undefined) patch.description = dto.description ?? null;
    if (dto.projects !== undefined) patch.projects = dto.projects ?? null;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;

    const updated = await this.db
      .update(workExperiences)
      .set(patch)
      .where(eq(workExperiences.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('工作经历不存在');
    }
    this.logger.log(`更新工作经历: ${id}`);
    return this.toWorkExperience(updated[0]);
  }

  async remove(id: string): Promise<void> {
    const updated = await this.db
      .update(workExperiences)
      .set({ deletedAt: new Date() })
      .where(eq(workExperiences.id, id))
      .returning({ id: workExperiences.id });

    if (updated.length === 0) {
      throw new NotFoundException('工作经历不存在');
    }
    this.logger.log(`删除工作经历: ${id}`);
  }

  async reorder(items: { id: string; sortOrder: number }[]): Promise<void> {
    if (items.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(workExperiences)
          .set({ sortOrder: item.sortOrder })
          .where(eq(workExperiences.id, item.id));
      }
    });

    this.logger.log(`批量排序工作经历: ${items.length} 条`);
  }

  private toWorkExperience(row: typeof workExperiences.$inferSelect): WorkExperience {
    return {
      id: row.id,
      company: row.company,
      position: row.position,
      startDate: typeof row.startDate === 'string' ? row.startDate : String(row.startDate),
      endDate: row.endDate ? (typeof row.endDate === 'string' ? row.endDate : String(row.endDate)) : undefined,
      isCurrent: row.isCurrent,
      description: row.description ?? undefined,
      projects: row.projects ?? undefined,
      sortOrder: row.sortOrder,
    };
  }
}
