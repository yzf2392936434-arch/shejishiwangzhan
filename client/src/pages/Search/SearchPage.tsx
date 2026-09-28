import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Search, ArrowLeft } from 'lucide-react';
import { publicApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Image } from '@client/src/components/ui/image';
import type { WorkListItem, SearchResponse } from '@shared/api.interface';

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part: string, i: number) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-yellow-200 text-foreground px-0.5 rounded-sm"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

interface HighlightWorkCardProps {
  work: WorkListItem;
  keyword: string;
}

const HighlightWorkCard: React.FC<HighlightWorkCardProps> = ({ work, keyword }) => {
  return (
    <div className="group block overflow-hidden rounded-md transition-opacity hover:opacity-90">
      <Link to={`/work/${work.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
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
      </Link>
      <div className="mt-4 space-y-2">
        {work.categories && work.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {work.categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-normal text-secondary-foreground"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-muted-foreground">
          {highlightKeyword(work.title, keyword)}
        </h3>
        {work.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightKeyword(work.summary, keyword)}
          </p>
        )}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';

  const [items, setItems] = useState<WorkListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyword.trim()) {
      setItems([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function search() {
      try {
        const res: SearchResponse = await publicApi.searchWorks(keyword);
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch (e) {
        logger.error('searchWorks failed', e);
        if (!cancelled) setError('搜索失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void search();
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const hasKeyword = keyword.trim().length > 0;

  const pageTitle = useMemo(() => {
    if (!hasKeyword) return '搜索';
    return `搜索结果：${keyword}`;
  }, [keyword, hasKeyword]);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
      <div className="mb-10 md:mb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Search size={16} />
          <span>{total} 个结果</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{pageTitle}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-md" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>{error}</p>
        </div>
      ) : !hasKeyword ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">请输入搜索关键词</p>
          <p className="mt-2 text-sm text-muted-foreground">
            在顶部搜索框中输入关键词来查找作品
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">没有找到相关作品</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            试试其他关键词，或者浏览全部作品
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button asChild>
              <Link to="/">
                <ArrowLeft size={14} />
                返回首页
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/works">查看全部作品</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          data-ai-section-type="card-list"
        >
          {items.map((work) => (
            <HighlightWorkCard key={work.id} work={work} keyword={keyword} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SearchPage;
