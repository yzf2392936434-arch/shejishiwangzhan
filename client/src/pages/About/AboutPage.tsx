import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Mail, ArrowRight } from 'lucide-react';
import { publicApi } from '@client/src/api';
import { Image } from '@client/src/components/ui/image';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import { useReveal } from '@client/src/hooks/useReveal';
import type { Profile, WorkExperience, Skill } from '@shared/api.interface';

const AboutPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headerRef = useReveal<HTMLDivElement>();
  const introRef = useReveal<HTMLDivElement>();
  const bioRef = useReveal<HTMLDivElement>();
  const timelineRef = useReveal<HTMLDivElement>();
  const skillsRef = useReveal<HTMLDivElement>();
  const philosophyRef = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profileRes, expRes, skillsRes] = await Promise.all([
          publicApi.getProfile(),
          publicApi.getWorkExperiences().catch(() => []),
          publicApi.getSkills().catch(() => []),
        ]);
        if (!cancelled) {
          setProfile(profileRes);
          setExperiences(expRes);
          setSkills(skillsRes);
          setLoading(false);
        }
      } catch (e) {
        logger.error('AboutPage load failed', e);
        if (!cancelled) {
          setError('加载数据失败');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <AboutSkeleton />;
  if (error || !profile) {
    return (
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32 text-center">
        <p className="text-muted-foreground">{error || '暂无数据'}</p>
      </section>
    );
  }

  const softwareSkills = skills.filter((s) => s.category === 'software');
  const aiSkills = skills.filter((s) => s.category === 'ai');

  const selfIntro = profile.selfIntro?.trim()
    ? profile.selfIntro
    : '你好，我是一名设计师。我相信好的设计应当克制、精准、经得起推敲。';

  return (
    <div>
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
        <div
          ref={headerRef}
          className="reveal flex flex-col md:flex-row items-start gap-12 md:gap-16"
        >
          <div className="w-40 md:w-56 shrink-0">
            {profile.avatarUrl ? (
              <div className="aspect-square overflow-hidden rounded-full bg-muted">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-full bg-muted" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="text-xl font-medium text-muted-foreground">
                {profile.title}
              </p>
            )}
            {profile.tagline && (
              <p className="text-base text-muted-foreground">
                {profile.tagline}
              </p>
            )}
            {profile.location && (
              <p className="text-sm text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-foreground mr-2 align-middle" />
                {profile.location}
                {profile.workYears ? ` · ${profile.workYears} 年设计经验` : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button asChild>
                <Link to="/contact">
                  <Mail size={16} />
                  联系我
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/resume">
                  查看完整简历
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-8 pb-12 md:pb-16">
        <div ref={introRef} className="reveal">
          <p className="text-lg md:text-xl leading-relaxed text-foreground italic font-serif text-center px-4 md:px-8">
            &ldquo;{selfIntro}&rdquo;
          </p>
          {!profile.selfIntro?.trim() && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              （可在后台编辑个人自述）
            </p>
          )}
        </div>
      </section>

      {(profile.fullBio || profile.bio) && (
        <section className="max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-16 border-t border-border">
          <div ref={bioRef} className="reveal">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">个人简介</h2>
            <div className="space-y-4 text-base leading-relaxed text-foreground">
              {(profile.fullBio || profile.bio)
                ?.split('\n\n')
                .map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 md:px-8 py-12 md:py-16 border-t border-border">
          <div ref={timelineRef} className="reveal">
            <h2 className="text-2xl md:text-3xl font-semibold mb-10 md:text-center">
              工作经历
            </h2>
            <div className="relative">
              <div className="absolute left-3 md:left-1/2 top-2 bottom-2 w-px bg-border md:-translate-x-1/2" />
              <div className="space-y-10 md:space-y-16">
                {experiences.map((exp, index) => (
                  <TimelineItem key={exp.id} exp={exp} index={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 border-t border-border">
        <div ref={skillsRef} className="reveal">
          <h2 className="text-2xl md:text-3xl font-semibold mb-10">技能</h2>
          {(softwareSkills.length > 0 || aiSkills.length > 0) && (
            <div className="space-y-12">
              {softwareSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">使用软件</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {softwareSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                  </div>
                </div>
              )}
              {aiSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-6">AI 工具</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {aiSkills.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {skills.length === 0 &&
            (profile.software?.length > 0 || profile.aiTools?.length > 0) && (
              <div className="space-y-10">
                {profile.software && profile.software.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">使用软件</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                      {profile.software.map((s, i) => (
                        <SimpleSkillCard
                          key={`sw-${i}`}
                          name={s.name}
                          icon={s.icon}
                          description={s.description}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {profile.aiTools && profile.aiTools.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-6">AI 工具</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                      {profile.aiTools.map((t, i) => (
                        <SimpleSkillCard
                          key={`ai-${i}`}
                          name={t.name}
                          icon={t.icon}
                          description={t.description}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          {softwareSkills.length === 0 &&
            aiSkills.length === 0 &&
            (!profile.software || profile.software.length === 0) &&
            (!profile.aiTools || profile.aiTools.length === 0) && (
              <p className="text-muted-foreground">暂无技能数据</p>
            )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 md:px-8 py-12 md:py-16 border-t border-border">
        <div ref={philosophyRef} className="reveal">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">设计理念</h2>
          <p className="text-base leading-relaxed text-foreground">
            设计是解决问题的过程，而非单纯的视觉表现。我相信好的设计应当克制、精准、经得起推敲。
            每一个像素、每一条间距都有其存在的理由。
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 border-t border-border">
        <div
          ref={ctaRef}
          className="reveal flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              有合作想法？
            </h2>
            <p className="text-muted-foreground">欢迎随时联系我聊聊</p>
          </div>
          <Button asChild size="lg">
            <Link to="/contact">
              <Mail size={16} />
              立即联系
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

interface TimelineItemProps {
  exp: WorkExperience;
  index: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ exp, index }) => {
  const isLeft = index % 2 === 0;
  return (
    <div className="relative">
      <div className="absolute left-3 md:left-1/2 top-2 w-4 h-4 rounded-full bg-background border-2 border-foreground md:-translate-x-1/2 z-10" />
      <div
        className={`pl-10 md:pl-0 md:w-[calc(50%-2rem)] ${
          isLeft ? 'md:mr-auto md:pr-8 md:text-right' : 'md:ml-auto md:pl-8'
        }`}
      >
        <div
          className={`p-5 md:p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-all duration-300 hover:-translate-y-0.5 ${
            isLeft ? 'md:text-right' : 'md:text-left'
          }`}
        >
          <div className="space-y-1.5">
            <div
              className={`flex flex-wrap items-baseline gap-2 ${
                isLeft ? 'md:justify-end' : ''
              }`}
            >
              <h3 className="text-base md:text-lg font-semibold order-1">
                {exp.position}
              </h3>
              <span className="text-muted-foreground text-sm order-2">@</span>
              <span className="text-sm md:text-base order-3">{exp.company}</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              {exp.startDate}
              {exp.isCurrent ? ' — 至今' : ` — ${exp.endDate || ''}`}
            </p>
            {exp.description && (
              <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-line mt-3">
                {exp.description}
              </p>
            )}
            {exp.projects && (
              <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line mt-2">
                {exp.projects}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SkillCardProps {
  skill: Skill;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  return (
    <div className="group flex flex-col items-start gap-3 p-4 md:p-5 rounded-lg border border-border bg-card hover:border-foreground/20 hover:-translate-y-1 transition-all duration-300 cursor-default">
      <div className="w-10 h-10 flex items-center justify-center">
        {skill.icon ? (
          <Image
            src={skill.icon}
            alt={skill.name}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <div className="w-8 h-8 rounded bg-muted" />
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{skill.name}</h4>
        {skill.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {skill.description}
          </p>
        )}
      </div>
    </div>
  );
};

interface SimpleSkillCardProps {
  name: string;
  icon?: string;
  description?: string;
}

const SimpleSkillCard: React.FC<SimpleSkillCardProps> = ({
  name,
  icon,
  description,
}) => {
  return (
    <div className="group flex flex-col items-start gap-3 p-4 md:p-5 rounded-lg border border-border bg-card hover:border-foreground/20 hover:-translate-y-1 transition-all duration-300 cursor-default">
      <div className="w-10 h-10 flex items-center justify-center">
        {icon ? (
          <Image src={icon} alt={name} className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded bg-muted" />
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{name}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

const AboutSkeleton: React.FC = () => (
  <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-32">
    <div className="flex flex-col md:flex-row items-start gap-12 md:gap-16">
      <Skeleton className="w-40 md:w-56 aspect-square rounded-full" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 md:h-14 w-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-5 w-60" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  </section>
);

export default AboutPage;
