import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  ArrowLeft,
  Calendar,
  Eye,
  FileText,
  Lock,
  Play,
  Mail,
  Users,
  Clock,
  Briefcase,
  Sparkles,
  Layers,
} from 'lucide-react';
import { worksApi, publicApi } from '@client/src/api';
import LikeButton from '@client/src/components/LikeButton';
import FavoriteButton from '@client/src/components/FavoriteButton';
import ImageLightbox from '@client/src/components/ImageLightbox';
import WorkContentRenderer from '@client/src/components/WorkContentRenderer';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import WorkDetailSkeleton from '@client/src/components/WorkDetailSkeleton';
import WorkCard from '@client/src/components/WorkCard';
import type { Work, WorkListItem, WorkImage, WorkContentBlock, SiteSettings, Profile } from '@shared/api.interface';

function generateWatermarkSvg(text: string): string {
  const encoded = encodeURIComponent(text);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='180'><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23000000' font-size='20' font-weight='500' font-family='-apple-system, BlinkMacSystemFont, sans-serif' transform='rotate(-30 140 90)'>${encoded}</text></svg>`;
  return `url("data:image/svg+xml;utf8,${svg}")`;
}

interface AnchorSection {
  id: string;
  title: string;
}

function extractAnchorSections(blocks: WorkContentBlock[]): AnchorSection[] {
  const sections: AnchorSection[] = [];
  let h1Count = 0;
  blocks.forEach((block) => {
    if (block.type === 'heading' && block.level === 1) {
      h1Count += 1;
    }
  });
  let h1Index = 0;
  blocks.forEach((block) => {
    if (block.type !== 'heading') return;
    if (block.anchorId) {
      sections.push({
        id: block.anchorId,
        title: block.anchorTitle || block.text || '',
      });
    } else if (block.level === 1 && h1Count >= 3) {
      h1Index += 1;
      sections.push({
        id: `section-${h1Index}`,
        title: block.text || `第 ${h1Index} 章`,
      });
    }
  });
  return sections;
}

const WorkDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const viewedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [work, setWork] = useState<Work | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const [lightboxImages, setLightboxImages] = useState<WorkImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [progress, setProgress] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState<string>('');

  const anchorSections = useMemo(() => {
    if (!work?.contentBlocks) return [];
    return extractAnchorSections(work.contentBlocks);
  }, [work]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    viewedRef.current = false;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setNeedPassword(false);
    setPasswordVerified(false);

    async function load() {
      try {
        const [res, settings, prof] = await Promise.all([
          worksApi.getWorkBySlug(slug),
          publicApi.getSettings().catch(() => null),
          publicApi.getProfile().catch(() => null),
        ]);
        if (cancelled) return;
        if (settings) setSiteSettings(settings);
        if (prof) setProfile(prof);
        if (res.status === 'password') {
          setNeedPassword(true);
        } else {
          setWork(res);
        }
        setLoading(false);
      } catch (e: unknown) {
        logger.error(`WorkDetailPage load failed: ${slug}`, e);
        if (cancelled) return;
        const err = e as { response?: { status?: number } };
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('加载作品失败');
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (work && !viewedRef.current) {
      viewedRef.current = true;
      worksApi.incrementView(work.id).catch(() => {
        // ignore
      });
    }
  }, [work]);

  useEffect(() => {
    if (!work) return;
    if (typeof document === 'undefined') return;

    const prevTitle = document.title;

    const title = work.seoTitle || work.title;
    const description = work.seoDescription || work.summary || '';
    const image = work.shareCoverUrl || work.coverUrl || '';

    document.title = title;

    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        const parts = selector.slice(1, -1).split('=');
        if (parts.length === 2) {
          const attrName = parts[0];
          const attrVal = parts[1].replace(/"/g, '');
          el.setAttribute(attrName, attrVal);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    if (image) setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:type"]', 'content', 'article');
    setMeta('meta[name="description"]', 'content', description);

    return () => {
      document.title = prevTitle;
    };
  }, [work]);

  useEffect(() => {
    if (!slug || !work) return;
    let cancelled = false;
    async function loadRelated() {
      try {
        const related = await publicApi.getRelatedWorks(slug, 6);
        if (!cancelled) setRelatedWorks(related);
      } catch (e) {
        logger.error('load related works failed', e);
      }
    }
    loadRelated();
    return () => {
      cancelled = true;
    };
  }, [slug, work]);

  useEffect(() => {
    if (!work) return;

    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const prog = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        setProgress(prog);

        setShowCta(scrollTop > 600);

        if (anchorSections.length >= 3) {
          let currentId = anchorSections[0]?.id || '';
          for (const section of anchorSections) {
            const el = document.getElementById(section.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 120) {
                currentId = section.id;
              }
            }
          }
          setActiveAnchor(currentId);
        }
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [work, anchorSections]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !password.trim()) return;
    setPasswordError(null);
    try {
      const res = await worksApi.verifyWorkPassword(slug, password);
      if (res.success && res.work) {
        setWork(res.work);
        setNeedPassword(false);
        setPasswordVerified(true);
      } else {
        setPasswordError('密码错误，请重试');
      }
    } catch (e) {
      logger.error('verify password failed', e);
      setPasswordError('验证失败，请重试');
    }
  };

  const scrollToAnchor = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getHeadingAnchorId = (block: WorkContentBlock, index: number): string | undefined => {
    if (block.anchorId) return block.anchorId;
    if (block.level === 1 && anchorSections.length >= 3) {
      const h1Blocks = work?.contentBlocks.filter(
        (b) => b.type === 'heading' && b.level === 1,
      ) || [];
      const h1Index = h1Blocks.indexOf(block);
      if (h1Index >= 0) return `section-${h1Index + 1}`;
    }
    return undefined;
  };

  const handleResumeClick = () => {
    navigate('/resume');
  };

  const metaChips: { label: string; icon?: React.ReactNode }[] = [];
  if (work?.client) {
    metaChips.push({ label: work.client });
  }
  if (work?.projectType) {
    metaChips.push({ label: work.projectType, icon: <Briefcase size={12} /> });
  }
  if (work?.myRole && work?.showMyRole) {
    metaChips.push({ label: work.myRole, icon: <Users size={12} /> });
  }
  const periodValue = work?.duration || (work?.showProductionDate ? work.productionDate : undefined);
  if (periodValue) {
    metaChips.push({ label: periodValue, icon: <Clock size={12} /> });
  }
  if (work?.teamSize) {
    metaChips.push({ label: `${work.teamSize} 人团队`, icon: <Layers size={12} /> });
  }
  if (work?.showSoftware && work.software.length > 0) {
    work.software.forEach((s: string) => {
      metaChips.push({ label: s });
    });
  }
  if (work?.showAiTools && work.aiTools.length > 0) {
    work.aiTools.forEach((t: string) => {
      metaChips.push({ label: t, icon: <Sparkles size={12} /> });
    });
  }

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4">
            <p className="text-6xl md:text-8xl font-bold tracking-tight text-foreground">
              404
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold">作品已下线</h1>
            <p className="text-base text-muted-foreground max-w-md">
              抱歉，您访问的作品不存在或已被移除。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button asChild>
              <Link to="/">返回首页</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/works">查看其他作品</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (loading) return <WorkDetailSkeleton />;
  if (error) {
    return (
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          返回
        </Button>
      </section>
    );
  }

  if (needPassword && !passwordVerified) {
    return (
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock size={28} className="text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">需要访问密码</h1>
            <p className="text-muted-foreground">
              该作品受密码保护，请输入密码后查看
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入访问密码"
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button type="submit" className="w-full">
              验证并查看
            </Button>
          </form>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} />
            返回上一页
          </Button>
        </div>
      </section>
    );
  }

  if (!work) return null;
  return (
    <article ref={contentRef}>
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-foreground transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          返回
        </button>
      </div>

      <header className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-16">
        <div className="max-w-3xl space-y-4">
          {work.categories && work.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {work.categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/works?category=${cat.slug}`}
                  className="hover:opacity-80 transition-opacity"
                >
                  <Badge variant="secondary" className="font-normal">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {work.title}
          </h1>
          {work.summary && work.showSummary && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {work.summary}
            </p>
          )}

          {metaChips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {metaChips.map((chip, i) => (
                <span
                  key={`${chip.label}-${i}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground bg-muted/60 rounded-full"
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {work.tags && work.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {work.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="font-normal">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="pt-4 flex items-center gap-5">
            <LikeButton workId={work.id} initialCount={work.likeCount || 0} size="md" />
            <FavoriteButton
              workId={work.id}
              initialCount={work.favoriteCount || 0}
              size="md"
            />
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-base">
              <Eye size={20} />
              {work.viewCount || 0}
            </span>
          </div>
        </div>
      </header>

      {anchorSections.length >= 3 && (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/60 -mt-1">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="flex gap-1 md:gap-2 overflow-x-auto py-3 -mx-6 md:-mx-8 px-6 md:px-8">
              {anchorSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToAnchor(section.id)}
                  className={`whitespace-nowrap text-sm px-3 py-1.5 rounded-md transition-colors ${
                    activeAnchor === section.id
                      ? 'text-foreground bg-muted font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {work.coverUrl && (
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <button
            type="button"
            onClick={() => {
              setLightboxImages([{ url: work.coverUrl!, alt: work.title }]);
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
            className="w-full text-left cursor-zoom-in"
            aria-label="查看大图"
          >
            <div className="aspect-[16/9] overflow-hidden rounded-md bg-muted relative">
              <Image
                src={work.coverUrl}
                alt={work.title}
                className="h-full w-full object-cover transition-transform hover:scale-[1.02] duration-500"
                loading="eager"
              />
              {siteSettings?.watermarkEnabled && (
                <div
                  className="watermark-overlay absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: generateWatermarkSvg(siteSettings.watermarkText || 'Portfolio'),
                    opacity: siteSettings.watermarkOpacity ?? 0.15,
                  }}
                />
              )}
            </div>
          </button>
        </div>
      )}

      {work.contentBlocks && work.contentBlocks.length > 0 ? (
        <WorkContentRenderer
          blocks={work.contentBlocks}
          onImageClick={(imgs, idx) => {
            setLightboxImages(imgs);
            setLightboxIndex(idx);
            setLightboxOpen(true);
          }}
          watermarkEnabled={siteSettings?.watermarkEnabled}
          watermarkText={siteSettings?.watermarkText}
          watermarkOpacity={siteSettings?.watermarkOpacity}
          onHeadingRender={getHeadingAnchorId}
        />
      ) : (
        <>
          <div className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-32 space-y-16">
            {work.showBackground && work.background && (
              <Section title="项目背景" content={work.background} />
            )}
            {work.showGoal && work.goal && (
              <Section title="项目目标" content={work.goal} />
            )}
            {work.showDesignApproach && work.designApproach && (
              <Section title="设计思路" content={work.designApproach} />
            )}
            {work.showMyRole && work.myRole && (
              <Section title="我的职责" content={work.myRole} />
            )}
            {work.showResults && work.results && (
              <Section title="最终成果" content={work.results} />
            )}
          </div>

          {work.images && work.images.length > 0 && (
            <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-8 pb-20 md:pb-32">
              {work.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLightboxImages(work.images);
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="w-full text-left overflow-hidden rounded-md bg-muted cursor-zoom-in block relative"
                  aria-label="查看大图"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${work.title} - ${i + 1}`}
                    className="w-full h-auto transition-transform hover:scale-[1.01] duration-500"
                  />
                </button>
              ))}
            </div>
          )}

          {work.videoUrl && (
            <div className="max-w-7xl mx-auto px-6 md:px-8 pb-20 md:pb-32">
              <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                {videoPlaying ? (
                  <video
                    src={work.videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full object-contain bg-black"
                    poster={work.videoCoverUrl || undefined}
                  />
                ) : (
                  <>
                    {work.videoCoverUrl ? (
                      <Image
                        src={work.videoCoverUrl}
                        alt="视频封面"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-black/50">
                        <Play size={64} className="text-white/80" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setVideoPlaying(true)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
                      aria-label="播放视频"
                    >
                      <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-105">
                        <Play size={28} className="text-foreground ml-1" />
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-20 md:pb-32 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          {work.showProductionDate && work.productionDate && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">制作时间</p>
              <p className="text-base font-medium flex items-center gap-2">
                <Calendar size={16} />
                {work.productionDate}
              </p>
            </div>
          )}
          {work.showSoftware && work.software.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">使用软件</p>
              <div className="flex flex-wrap gap-2">
                {work.software.map((s: string) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="font-normal"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {work.showAiTools && work.aiTools.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">AI 工具</p>
              <div className="flex flex-wrap gap-2">
                {work.aiTools.map((t: string) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="font-normal"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedWorks.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
          <h2 className="text-2xl md:text-3xl font-semibold mb-10 md:mb-16">
            相关作品
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            data-ai-section-type="card-list"
          >
            {relatedWorks.slice(0, 6).map((w) => (
              <WorkCard key={w.id} work={w} />
            ))}
          </div>
        </section>
      )}

      {lightboxOpen && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
          showCta
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-background/75 backdrop-blur-md border-t border-border/60">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex items-center justify-between gap-4">
            <div className="hidden sm:block text-sm text-muted-foreground truncate max-w-xs">
              喜欢这个作品？欢迎查看简历或联系我
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResumeClick}
              >
                <FileText size={14} />
                查看简历
              </Button>
              <Button size="sm" asChild>
                <Link to="/contact">
                  <Mail size={14} />
                  联系我
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showCta && <div className="h-14" />}
    </article>
  );
};

const Section: React.FC<{ title: string; content: string }> = ({
  title,
  content,
}) => (
  <div className="space-y-4">
    <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
    <p className="text-base leading-relaxed text-foreground whitespace-pre-line">
      {content}
    </p>
  </div>
);

export default WorkDetailPage;
