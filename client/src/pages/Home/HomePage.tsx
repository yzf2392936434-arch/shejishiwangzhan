import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ArrowRight, Mail, FileText } from 'lucide-react';
import { publicApi } from '@client/src/api';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import WorkCard from '@client/src/components/WorkCard';
import HotWorksSection from '@client/src/components/HotWorksSection';
import { useReveal } from '@client/src/hooks/useReveal';
import {
  PinnedWorksSection,
  SkillMatrixSection,
  NewsFeedSection,
} from './HomeSections';
import type {
  HomeData,
  HomeSection,
  JobStatus,
  Profile,
  WorkListItem,
  Category,
  HomeCtaConfig,
  SkillMatrix,
} from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';


const jobStatusLabel: Record<JobStatus, string> = {
  open: '正在求职',
  closed: '暂不考虑',
  freelance: '接受自由职业',
};

const jobStatusVariant: Record<JobStatus, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  closed: 'secondary',
  freelance: 'outline',
};

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: 'hero', type: 'hero', isVisible: true, sortOrder: 1 },
  { id: 'about', type: 'about', isVisible: true, sortOrder: 2 },
  { id: 'contact', type: 'contact', isVisible: true, sortOrder: 3 },
  { id: 'featured_works', type: 'featured_works', isVisible: true, sortOrder: 4 },
  { id: 'categories', type: 'categories', isVisible: true, sortOrder: 5 },
  { id: 'skills', type: 'skills', isVisible: true, sortOrder: 6, title: '技能与工具' },
];

function getVisibleSections(sections: HomeSection[] | undefined): HomeSection[] {
  if (!sections || sections.length === 0) {
    return DEFAULT_HOME_SECTIONS.filter((s) => s.isVisible);
  }
  return sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ---------- Section Components ---------- */

interface HeroSectionProps {
  profile: Profile;
  displayTitle: string;
  displaySubtitle: string;
  homeCta?: HomeCtaConfig;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  profile,
  displayTitle,
  displaySubtitle,
  homeCta,
}) => {
  const navigate = useNavigate();
  const hasResumeUrl = !!profile.resumeUrl;

  // 统一：查看简历，跳转在线简历页
  const resumeText = '查看简历';
  const contactText = homeCta?.contactButtonText || '联系我';

  const handleResumeClick = () => {
    navigate('/resume');
  };

  const handleContactClick = () => {
    // 滚动到页面底部联系区块；若当前页没有则跳转 /contact
    const contactSection = document.querySelector(
      'section[data-section-type="contact"]',
    );
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/contact');
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
      <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-12 md:gap-16">
        <div className="flex-1 space-y-6">
          <Badge variant={jobStatusVariant[profile.jobStatus]}>
            {jobStatusLabel[profile.jobStatus]}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-xl md:text-2xl font-medium text-muted-foreground">
              {displaySubtitle}
            </p>
          )}
          {profile.tagline && (
            <p className="text-base leading-relaxed text-muted-foreground max-w-xl">
              {profile.tagline}
            </p>
          )}
          {profile.specialties && profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.specialties.map((s: string) => (
                <Badge key={s} variant="outline" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={handleResumeClick}>
               <FileText size={16} />
               {resumeText}
             </Button>
            <Button variant="outline" onClick={handleContactClick}>
              <Mail size={16} />
              {contactText}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/works">
                查看作品
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-80 lg:w-96 shrink-0">
          {profile.avatarUrl ? (
            <div className="aspect-[3/4] overflow-hidden rounded-md bg-muted">
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-md bg-muted" />
          )}
        </div>
      </div>
    </section>
  );
};

interface AboutSectionProps {
  profile: Profile;
  title?: string;
}

const AboutSection: React.FC<AboutSectionProps> = ({ profile, title }) => {
  const hasContent = profile.bio || profile.fullBio;
  if (!hasContent) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="grid md:grid-cols-3 gap-12">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {title || '关于我'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            简短的自我介绍与设计理念
          </p>
        </div>
        <div className="md:col-span-2 space-y-6">
          <p className="text-base leading-relaxed text-foreground">
            {profile.bio || profile.fullBio}
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.specialties?.map((s: string) => (
              <Badge
                key={s}
                variant="secondary"
                className="font-normal"
              >
                {s}
              </Badge>
            ))}
            {profile.software?.slice(0, 5).map((s) => (
              <Badge
                key={s.name}
                variant="outline"
                className="font-normal"
              >
                {s.name}
              </Badge>
            ))}
          </div>
          <Button variant="ghost" asChild className="px-0">
            <Link to="/about" className="gap-1">
              了解更多 <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

interface ContactSectionProps {
  profile: Profile;
  title?: string;
}

const ContactSection: React.FC<ContactSectionProps> = ({ profile, title }) => (
  <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-semibold">
          {title || '联系方式'}
        </h2>
        {profile.showEmail && profile.email && (
          <UniversalLink
            to={`mailto:${profile.email}`}
            className="text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            {profile.email}
          </UniversalLink>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild>
          <Link to="/contact">
            <Mail size={16} />
            联系我
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/resume">
            <FileText size={16} />
            查看简历
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

interface FeaturedWorksSectionProps {
  featuredWorks: WorkListItem[];
  title?: string;
}

const FeaturedWorksSection: React.FC<FeaturedWorksSectionProps> = ({
  featuredWorks,
  title,
}) => {
  if (!featuredWorks || featuredWorks.length === 0) return null;

  const displayWorks = featuredWorks.slice(0, 6);
  const [firstWork, ...restWorks] = displayWorks;

  const BentoCard: React.FC<{ work: WorkListItem; isLarge?: boolean }> = ({
    work,
    isLarge,
  }) => (
    <Link
      to={`/work/${work.slug}`}
      className={`group block overflow-hidden rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isLarge ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      data-ai-section-type="card-list"
    >
      <div
        className={`overflow-hidden rounded-md bg-muted ${
          isLarge ? 'aspect-[16/10] md:aspect-[16/12]' : 'aspect-[4/3]'
        }`}
      >
        {work.coverUrl ? (
          <Image
            src={work.coverUrl}
            alt={work.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-sm">无封面</span>
          </div>
        )}
      </div>
      <div className={`mt-4 space-y-2 ${isLarge ? 'md:mt-6' : ''}`}>
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
        <h3
          className={`font-semibold tracking-tight transition-colors group-hover:text-muted-foreground ${
            isLarge ? 'text-xl md:text-2xl' : 'text-lg'
          }`}
        >
          {work.title}
        </h3>
        {work.summary && (
          <p
            className={`text-sm text-muted-foreground line-clamp-2 ${
              isLarge ? 'md:line-clamp-3 md:text-base' : ''
            }`}
          >
            {work.summary}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="flex items-end justify-between mb-10 md:mb-16">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {title || '精选作品'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            精心挑选的代表性设计项目
          </p>
        </div>
        <Link
          to="/works"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          查看全部
          <ArrowRight size={14} />
        </Link>
      </div>
      {/* Bento Grid: 桌面端 3 列，第一个作品占 2 列宽 + 2 行高形成大卡 */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-auto"
        data-ai-section-type="card-list"
      >
        {firstWork && <BentoCard work={firstWork} isLarge />}
        {restWorks.map((work) => (
          <BentoCard key={work.id} work={work} />
        ))}
      </div>
    </section>
  );
};

interface CategoriesSectionProps {
  categories: Category[];
  title?: string;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  title,
}) => {
  if (!categories || categories.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="mb-10 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold">
          {title || '作品分类'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          按方向浏览不同类型的设计作品
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/works?category=${cat.slug}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-90"
          >
            {cat.coverUrl ? (
              <Image
                src={cat.coverUrl}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <span className="text-lg font-medium">{cat.name}</span>
              </div>
            )}
            {cat.coverUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-end p-4 transition-opacity group-hover:bg-black/50">
                <h3 className="text-white text-lg font-semibold">
                  {cat.name}
                </h3>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};

interface SkillsSectionProps {
  profile: Profile;
  title?: string;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ profile, title }) => {
  const items = [...(profile.software || []), ...(profile.aiTools || [])];
  if (items.length === 0) return null;
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 border-t border-border">
      <div className="flex items-end justify-between mb-10 md:mb-16">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold">
            {title || '技能与工具'}
          </h2>
          <p className="mt-2 text-muted-foreground">
            我熟练使用的设计软件与 AI 工具
          </p>
        </div>
        <Link
          to="/resume"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          查看完整简历
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge
            key={item.name}
            variant="secondary"
            className="px-3 py-1.5 text-sm font-normal"
          >
            {item.name}
          </Badge>
        ))}
      </div>
    </section>
  );
};

/* ---------- Reveal Wrapper ---------- */

interface RevealSectionProps {
  children: React.ReactNode;
  delay?: number;
}

const RevealSection: React.FC<RevealSectionProps> = ({ children, delay = 0 }) => {
  const ref = useReveal<HTMLDivElement>({ delay });
  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
};

/* ---------- Main Component ---------- */

const HomePage: React.FC = () => {
  const [data, setData] = useState<HomeData | null>(null);
  const [hotWorks, setHotWorks] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await publicApi.getHome();
        if (cancelled) return;
        setData(res);

        // Load hot works if enabled
        if (res.settings?.homeHotWorksEnabled) {
          try {
            const hot = await publicApi.getHotWorks(
              res.settings.homeHotWorksCount || 6,
            );
            if (!cancelled) setHotWorks(hot);
          } catch (e) {
            logger.error('load hot works failed', e);
          }
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        logger.error('HomePage load failed', e);
        if (!cancelled) {
          setError('加载首页数据失败');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <HomeSkeleton />;
  if (error || !data) {
    return (
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
        <div className="text-center text-muted-foreground">
          <p>{error || '暂无数据'}</p>
        </div>
      </section>
    );
  }

  const { settings, profile, featuredWorks, categories } = data;
  const displayTitle = settings.homeTitle || profile.name;
  const displaySubtitle = settings.homeSubtitle || profile.title || '';

  const sections = getVisibleSections(settings.homeSections);
  const renderSection = (section: HomeSection, index: number) => {
    const delay = Math.min(index * 80, 400);
    const content = (() => {
      switch (section.type) {
      case 'hero':
        return (
          <HeroSection
            key={section.id}
            profile={profile}
            displayTitle={displayTitle}
            displaySubtitle={displaySubtitle}
            homeCta={settings.homeCta}
          />
        );
      case 'about':
        return (
          <AboutSection profile={profile} title={section.title} />
        );
      case 'contact':
        return (
          <div data-section-type="contact">
            <ContactSection profile={profile} title={section.title} />
          </div>
        );
      case 'featured_works':
        return (
          <div>
            <FeaturedWorksSection
              featuredWorks={featuredWorks}
              title={section.title}
            />
            {settings.homeHotWorksEnabled && (
              <HotWorksSection
                hotWorks={hotWorks}
                title={settings.homeHotWorksTitle || '热门作品'}
              />
            )}
          </div>
        );
      case 'pinned_works':
        return (
          <PinnedWorksSection
            works={featuredWorks}
            title={section.title}
          />
        );
      case 'skill_matrix':
        return (
          <SkillMatrixSection
            skillMatrix={settings.skillMatrix as SkillMatrix}
            title={section.title}
          />
        );
      case 'news_feed':
        return <NewsFeedSection title={section.title} />;
      case 'categories':
        return (
          <CategoriesSection
            categories={categories}
            title={section.title}
          />
        );
      case 'skills':
        return (
          <SkillsSection profile={profile} title={section.title} />
        );
      default:
        return null;
    }
    })();
    return (
      <RevealSection key={section.id} delay={delay}>
        {content}
      </RevealSection>
    );
  };
  return <div>{sections.map(renderSection)}</div>;
};
const HomeSkeleton: React.FC = () => (
  <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
    <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-12 md:gap-16">
      <div className="flex-1 space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-14 md:h-20 w-full max-w-lg" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <Skeleton className="w-full md:w-80 lg:w-96 aspect-[3/4] rounded-md" />
    </div>
  </section>
);

export default HomePage;
