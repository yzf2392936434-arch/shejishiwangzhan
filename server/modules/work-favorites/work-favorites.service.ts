import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, sql } from 'drizzle-orm';

import { workFavorites, works } from '@server/database/schema';

export interface FavoriteToggleResult {
  favorited: boolean;
  favoriteCount: number;
}

export interface FavoriteStatusResult {
  favorited: boolean;
  favoriteCount: number;
}

@Injectable()
export class WorkFavoritesService {
  private readonly logger = new Logger(WorkFavoritesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async toggleFavorite(workId: string, visitorId: string): Promise<FavoriteToggleResult> {
    if (!visitorId || visitorId.trim().length === 0) {
      throw new BadRequestException('visitorId 不能为空');
    }
    const trimmedVisitorId = visitorId.trim();

    const workRows = await this.db
      .select({ id: works.id, favoriteCount: works.favoriteCount })
      .from(works)
      .where(and(eq(works.id, workId), sql`${works.deletedAt} IS NULL`))
      .limit(1);

    if (workRows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return this.db.transaction(async (tx): Promise<FavoriteToggleResult> => {
      const existing = await tx
        .select({ id: workFavorites.id })
        .from(workFavorites)
        .where(and(eq(workFavorites.workId, workId), eq(workFavorites.visitorId, trimmedVisitorId)))
        .limit(1);

      let favorited: boolean;
      let favoriteCount: number;

      if (existing.length > 0) {
        await tx.delete(workFavorites).where(eq(workFavorites.id, existing[0].id));
        const updated = await tx
          .update(works)
          .set({ favoriteCount: sql`${works.favoriteCount} - 1` })
          .where(eq(works.id, workId))
          .returning({ favoriteCount: works.favoriteCount });
        favorited = false;
        favoriteCount = Math.max(0, updated[0]?.favoriteCount ?? 0);
        this.logger.log(`取消收藏: work=${workId}, visitor=${trimmedVisitorId}`);
      } else {
        await tx.insert(workFavorites).values({
          workId,
          visitorId: trimmedVisitorId,
        });
        const updated = await tx
          .update(works)
          .set({ favoriteCount: sql`${works.favoriteCount} + 1` })
          .where(eq(works.id, workId))
          .returning({ favoriteCount: works.favoriteCount });
        favorited = true;
        favoriteCount = updated[0]?.favoriteCount ?? 1;
        this.logger.log(`收藏: work=${workId}, visitor=${trimmedVisitorId}`);
      }

      return { favorited, favoriteCount };
    });
  }

  async getFavoriteStatus(workId: string, visitorId: string): Promise<FavoriteStatusResult> {
    if (!visitorId || visitorId.trim().length === 0) {
      const countRows = await this.db
        .select({ favoriteCount: works.favoriteCount })
        .from(works)
        .where(and(eq(works.id, workId), sql`${works.deletedAt} IS NULL`))
        .limit(1);
      if (countRows.length === 0) {
        throw new NotFoundException('作品不存在');
      }
      return { favorited: false, favoriteCount: countRows[0].favoriteCount };
    }

    const trimmedVisitorId = visitorId.trim();

    const [workRows, favRows] = await Promise.all([
      this.db
        .select({ favoriteCount: works.favoriteCount })
        .from(works)
        .where(and(eq(works.id, workId), sql`${works.deletedAt} IS NULL`))
        .limit(1),
      this.db
        .select({ id: workFavorites.id })
        .from(workFavorites)
        .where(and(eq(workFavorites.workId, workId), eq(workFavorites.visitorId, trimmedVisitorId)))
        .limit(1),
    ]);

    if (workRows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return {
      favorited: favRows.length > 0,
      favoriteCount: workRows[0].favoriteCount,
    };
  }
}
