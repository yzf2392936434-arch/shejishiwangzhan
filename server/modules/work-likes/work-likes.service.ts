import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, count, sql } from 'drizzle-orm';

import { workLikes, works } from '@server/database/schema';

export interface LikeToggleResult {
  liked: boolean;
  likeCount: number;
}

export interface LikeStatusResult {
  liked: boolean;
  likeCount: number;
}

@Injectable()
export class WorkLikesService {
  private readonly logger = new Logger(WorkLikesService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async toggleLike(workId: string, visitorId: string): Promise<LikeToggleResult> {
    if (!visitorId || visitorId.trim().length === 0) {
      throw new BadRequestException('visitorId 不能为空');
    }
    const trimmedVisitorId = visitorId.trim();

    const workRows = await this.db
      .select({ id: works.id, likeCount: works.likeCount })
      .from(works)
      .where(and(eq(works.id, workId), sql`${works.deletedAt} IS NULL`))
      .limit(1);

    if (workRows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return this.db.transaction(async (tx): Promise<LikeToggleResult> => {
      const existing = await tx
        .select({ id: workLikes.id })
        .from(workLikes)
        .where(and(eq(workLikes.workId, workId), eq(workLikes.visitorId, trimmedVisitorId)))
        .limit(1);

      let liked: boolean;
      let likeCount: number;

      if (existing.length > 0) {
        await tx.delete(workLikes).where(eq(workLikes.id, existing[0].id));
        const updated = await tx
          .update(works)
          .set({ likeCount: sql`${works.likeCount} - 1` })
          .where(eq(works.id, workId))
          .returning({ likeCount: works.likeCount });
        liked = false;
        likeCount = Math.max(0, updated[0]?.likeCount ?? 0);
        this.logger.log(`取消点赞: work=${workId}, visitor=${trimmedVisitorId}`);
      } else {
        await tx.insert(workLikes).values({
          workId,
          visitorId: trimmedVisitorId,
        });
        const updated = await tx
          .update(works)
          .set({ likeCount: sql`${works.likeCount} + 1` })
          .where(eq(works.id, workId))
          .returning({ likeCount: works.likeCount });
        liked = true;
        likeCount = updated[0]?.likeCount ?? 1;
        this.logger.log(`点赞: work=${workId}, visitor=${trimmedVisitorId}`);
      }

      return { liked, likeCount };
    });
  }

  async getLikeStatus(workId: string, visitorId: string): Promise<LikeStatusResult> {
    if (!visitorId || visitorId.trim().length === 0) {
      const countRows = await this.db
        .select({ likeCount: works.likeCount })
        .from(works)
        .where(eq(works.id, workId))
        .limit(1);
      if (countRows.length === 0) {
        throw new NotFoundException('作品不存在');
      }
      return { liked: false, likeCount: countRows[0].likeCount };
    }

    const trimmedVisitorId = visitorId.trim();

    const [workRows, likeRows] = await Promise.all([
      this.db
        .select({ likeCount: works.likeCount })
        .from(works)
        .where(and(eq(works.id, workId), sql`${works.deletedAt} IS NULL`))
        .limit(1),
      this.db
        .select({ id: workLikes.id })
        .from(workLikes)
        .where(and(eq(workLikes.workId, workId), eq(workLikes.visitorId, trimmedVisitorId)))
        .limit(1),
    ]);

    if (workRows.length === 0) {
      throw new NotFoundException('作品不存在');
    }

    return {
      liked: likeRows.length > 0,
      likeCount: workRows[0].likeCount,
    };
  }
}
