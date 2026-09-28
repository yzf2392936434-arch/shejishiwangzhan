import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { newsApi } from '@client/src/api';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import type {
  WorkListItem,
  SkillMatrix,
  NewsItem,
} from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

/* ---------- Pinned Works Section (横向滑动代表作) ---------- */

interface PinnedWorksSectionProps {
  works: WorkListItem[];
  title?: string;
}

const PinnedWorksSection: React.FC<PinnedWorksSectionProps> = ({
  works,
  title,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const pinned = works.filter((w) => w.isPinned).slice(0, 4);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    );
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  if (pinned.length === 0) return null;

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="flex items-end justify-between mb-10 md:mb-16">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {title || '代表作'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            最具代表性的精选项目
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy('left')}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="向左滚动"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy('right')}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="向右滚动"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-6 md:gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-6 px-6 md:-mx-8 md:px-8"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`
          .pinned-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {pinned.map((work) => (
          <Link
            key={work.id}
            to={`/work/${work.slug}`}
            className="group shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] lg:w-[45vw] xl:w-[38vw] snap-start"
          >
            <div className="aspect-video overflow-hidden rounded-md bg-muted transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
              {work.coverUrl ? (
                <Image
                  src={work.coverUrl}
                  alt={work.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <span className="text-sm">无封面</span>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {work.categories && work.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {work.categories.slice(0, 2).map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="secondary"
                      className="font-normal"
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              )}
              <h3 className="text-lg md:text-xl font-semibold tracking-tight transition-colors group-hover:text-muted-foreground">
                {work.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ---------- Skill Matrix Section (能力矩阵) ---------- */

interface SkillMatrixSectionProps {
  skillMatrix: SkillMatrix;
  title?: string;
}

const SkillMatrixSection: React.FC<SkillMatrixSectionProps> = ({
  skillMatrix,
  title,
}) => {
  if (!skillMatrix?.rows || skillMatrix.rows.length === 0) return null;
  if (!skillMatrix?.cols || skillMatrix.cols.length === 0) return null;

  const { rows, cols, cells } = skillMatrix;

  const getLevel = (rowId: string, colId: string): 0 | 1 | 2 => {
    const cell = cells.find(
      (c) => c.rowId === rowId && c.colId === colId,
    );
    return cell ? cell.level : 0;
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="mb-10 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold">
          {title || '能力矩阵'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          设计方向与交付物的熟练程度一览
        </p>
      </div>
      <div className="overflow-x-auto -mx-6 px-6 md:-mx-0 md:px-0">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-muted-foreground pb-4 pr-6 border-b border-border">
                方向 / 交付物
              </th>
              {cols.map((col) => (
                <th
                  key={col.id}
                  className="text-center text-sm font-medium text-muted-foreground pb-4 px-4 border-b border-border whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="text-left text-base font-medium py-4 pr-6 border-b border-border">
                  {row.label}
                </td>
                {cols.map((col) => {
                  const level = getLevel(row.id, col.id);
                  return (
                    <td
                      key={col.id}
                      className="text-center py-4 px-4 border-b border-border"
                    >
                      {level === 1 && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                      )}
                      {level === 2 && (
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-foreground" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-foreground" />
          <span>熟练</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
          <span>有经验</span>
        </div>
      </div>
    </section>
  );
};

/* ---------- News Feed Section (最新动态) ---------- */

interface NewsFeedSectionProps {
  title?: string;
}

const NewsFeedSection: React.FC<NewsFeedSectionProps> = ({ title }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await newsApi.getNewsList({ status: 'published' });
        if (cancelled) return;
        setNews(list.slice(0, 6));
      } catch (e) {
        logger.error('NewsFeedSection load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
        <div className="mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold">
            {title || '最新动态'}
          </h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-md"
            >
              <div className="w-20 h-14 bg-muted rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) return null;

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}.${m}.${day}`;
    } catch {
      return dateStr;
    }
  };

  const renderNewsLink = (item: NewsItem, children: React.ReactNode) => {
    if (item.linkUrl) {
      return (
        <UniversalLink
          to={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-3 rounded-md transition-colors hover:bg-muted/50"
        >
          {children}
        </UniversalLink>
      );
    }
    return (
      <div className="flex items-center gap-4 p-3 rounded-md">{children}</div>
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="mb-10 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold">
          {title || '最新动态'}
        </h2>
        <p className="mt-2 text-muted-foreground">近期的项目进展与分享</p>
      </div>
      <div className="divide-y divide-border rounded-md border border-border">
        {news.map((item) => (
          <div key={item.id}>
            {renderNewsLink(
              item,
              <>
                {item.imageUrl ? (
                  <div className="w-20 h-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 shrink-0 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    无图
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium truncate transition-colors group-hover:text-muted-foreground">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{formatDate(item.newsDate)}</span>
                  </div>
                </div>
                {item.linkUrl && (
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </>,
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export { PinnedWorksSection, SkillMatrixSection, NewsFeedSection };
