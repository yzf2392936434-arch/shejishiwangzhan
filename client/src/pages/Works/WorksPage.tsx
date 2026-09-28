import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ChevronLeft, ChevronRight, Filter, X, Search } from 'lucide-react';
import { publicApi, worksApi } from '@client/src/api';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import WorkCard from '@client/src/components/WorkCard';
import type {
  WorkListItem,
  Category,
  Tag,
  PublicWorksFilterParams,
} from '@shared/api.interface';

const PAGE_SIZE = 12;

const WorksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<WorkListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [softwareOptions, setSoftwareOptions] = useState<string[]>([]);
  const [aiToolOptions, setAiToolOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<number | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10) || 1;
  const categorySlug = searchParams.get('category') || undefined;
  const tagName = searchParams.get('tag') || undefined;
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year') as string, 10)
    : undefined;
  const keyword = searchParams.get('keyword') || undefined;
  const software = searchParams.get('software') || undefined;
  const aiTool = searchParams.get('aiTool') || undefined;

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  useEffect(() => {
    let cancelled = false;
    async function loadFilters() {
      try {
        const cats = await publicApi.getCategories();
        if (!cancelled) setCategories(cats);
      } catch (e) {
        logger.error('load categories failed', e);
      }
    }
    loadFilters();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAllTags() {
      try {
        const res = await worksApi.getPublicWorks({ pageSize: 100 });
        if (cancelled) return;
        const tagSet = new Set<string>();
        const swSet = new Set<string>();
        const aiSet = new Set<string>();
        const yearSet = new Set<number>();
         res.items.forEach((w: WorkListItem) => {
           w.tags?.forEach((t: Tag) => tagSet.add(t.name));
           w.software?.forEach((s: string) => swSet.add(s));
           w.aiTools?.forEach((a: string) => aiSet.add(a));
           if (w.year) yearSet.add(w.year);
         });
         if (allTags.length === 0) {
           setAllTags(
             Array.from(tagSet).map((name: string, i: number) => ({
               id: `t-${i}`,
               name,
               createdAt: '',
             })),
           );
         }
         if (softwareOptions.length === 0 && swSet.size > 0) {
           setSoftwareOptions(Array.from(swSet).sort());
         }
         if (aiToolOptions.length === 0 && aiSet.size > 0) {
           setAiToolOptions(Array.from(aiSet).sort());
         }
        if (years.length === 0 && yearSet.size > 0) {
          setYears(Array.from(yearSet).sort((a: number, b: number) => b - a));
        }
      } catch (e) {
        logger.error('load tag options failed', e);
      }
    }
    loadAllTags();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSearchInput(keyword || '');
  }, [keyword]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      updateFilter('keyword', value || undefined);
    }, 300);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params: PublicWorksFilterParams = {
          page,
          pageSize: PAGE_SIZE,
          category: categorySlug,
          tag: tagName,
          year,
          keyword,
          software,
          aiTool,
        };
        const res = await worksApi.getPublicWorks(params);
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
           const tagSet = new Set<string>();
           const yearSet = new Set<number>();
           const swSet = new Set<string>();
           const aiSet = new Set<string>();
           res.items.forEach((w: WorkListItem) => {
             w.tags?.forEach((t: Tag) => tagSet.add(t.name));
             w.software?.forEach((s: string) => swSet.add(s));
             w.aiTools?.forEach((a: string) => aiSet.add(a));
             if (w.year) yearSet.add(w.year);
           });
          if (tagSet.size > 0) {
            setAllTags((prev) => {
              const existing = new Set(prev.map((t) => t.name));
              const newTags = Array.from(tagSet)
                .filter((name) => !existing.has(name))
                .map((name: string, i: number) => ({
                  id: `t-${Date.now()}-${i}`,
                  name,
                  createdAt: '',
                }));
              return newTags.length > 0 ? [...prev, ...newTags] : prev;
            });
          }
           if (yearSet.size > 0) {
             setYears((prev) => {
               const combined = Array.from(new Set([...prev, ...yearSet]));
               return combined.sort((a: number, b: number) => b - a);
             });
           }
           if (swSet.size > 0) {
             setSoftwareOptions((prev) => {
               const combined = Array.from(new Set([...prev, ...swSet]));
               return combined.sort();
             });
           }
           if (aiSet.size > 0) {
             setAiToolOptions((prev) => {
               const combined = Array.from(new Set([...prev, ...aiSet]));
               return combined.sort();
             });
           }
        }
      } catch (e) {
        logger.error('WorksPage load failed', e);
        if (!cancelled) setError('加载作品列表失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [page, categorySlug, tagName, year, keyword, software, aiTool]);

  const updateFilter = (key: string, value: string | number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    next.delete('page');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilters = useMemo(() => {
    let count = 0;
    if (categorySlug) count++;
    if (tagName) count++;
    if (year) count++;
    if (keyword) count++;
    if (software) count++;
    if (aiTool) count++;
    return count;
  }, [categorySlug, tagName, year, keyword, software, aiTool]);

  const clearAllFilters = () => {
    navigate('/works');
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
      <div className="mb-10 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-bold">作品</h1>
        <p className="mt-2 text-muted-foreground">探索所有设计项目</p>
      </div>

      <div className="mb-8 md:mb-12 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="搜索作品名称、摘要、分类、标签..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">
            <Filter size={14} className="inline mr-1" />
            分类：
          </span>
          <Button
            variant={!categorySlug ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('category', undefined)}
          >
            全部
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={categorySlug === cat.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                updateFilter(
                  'category',
                  categorySlug === cat.slug ? undefined : cat.slug,
                )
              }
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">标签：</span>
            <Button
              variant={!tagName ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('tag', undefined)}
            >
              全部
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag.id}
                variant={tagName === tag.name ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  updateFilter('tag', tagName === tag.name ? undefined : tag.name)
                }
              >
                {tag.name}
              </Button>
            ))}
          </div>
        )}

        {years.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">年份：</span>
            <Button
              variant={!year ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('year', undefined)}
            >
              全部
            </Button>
            {years.map((y) => (
              <Button
                key={y}
                variant={year === y ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  updateFilter('year', year === y ? undefined : y)
                }
              >
                {y}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">软件：</span>
            <Select
              value={software || 'all'}
              onValueChange={(val) =>
                updateFilter('software', val === 'all' ? undefined : val)
              }
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="全部软件" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部软件</SelectItem>
                {softwareOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">AI 工具：</span>
            <Select
              value={aiTool || 'all'}
              onValueChange={(val) =>
                updateFilter('aiTool', val === 'all' ? undefined : val)
              }
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue placeholder="全部 AI 工具" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部 AI 工具</SelectItem>
                {aiToolOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">
              当前筛选：
            </span>
            {categorySlug && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('category', undefined)}>
                {categorySlug}
                <X size={12} />
              </Badge>
            )}
            {tagName && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('tag', undefined)}>
                {tagName}
                <X size={12} />
              </Badge>
            )}
            {year && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('year', undefined)}>
                {year}
                <X size={12} />
              </Badge>
            )}
            {keyword && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('keyword', undefined)}>
                关键词: {keyword}
                <X size={12} />
              </Badge>
            )}
            {software && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('software', undefined)}>
                软件: {software}
                <X size={12} />
              </Badge>
            )}
            {aiTool && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter('aiTool', undefined)}>
                AI: {aiTool}
                <X size={12} />
              </Badge>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors ml-2"
            >
              清除全部
            </button>
          </div>
        )}
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
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium">暂无作品</p>
          <p className="mt-2 text-sm text-muted-foreground">
            该分类下暂时还没有作品，去看看其他分类吧。
          </p>
          {activeFilters > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-6"
            >
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            data-ai-section-type="card-list"
          >
            {items.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 md:mt-16 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => updateFilter('page', page - 1)}
                aria-label="上一页"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'ghost'}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => updateFilter('page', p)}
                    >
                      {p}
                    </Button>
                  ),
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => updateFilter('page', page + 1)}
                aria-label="下一页"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            共 {total} 个作品，第 {page} / {totalPages} 页
          </div>
        </>
      )}
    </section>
  );
};

export default WorksPage;
