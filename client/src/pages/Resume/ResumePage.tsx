import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Download,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Briefcase,
} from 'lucide-react';
import { publicApi } from '@client/src/api';
import { Image } from '@client/src/components/ui/image';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@client/src/components/ui/tooltip';
import type { Profile, WorkExperience, Skill } from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const ResumePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        logger.error('ResumePage load failed', e);
        if (!cancelled) {
          setError('加载简历数据失败');
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <ResumeSkeleton />;
  if (error || !profile) {
    return (
      <section className="max-w-4xl mx-auto px-6 md:px-8 py-20 md:py-32 text-center">
        <p className="text-muted-foreground">{error || '暂无数据'}</p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/">
            <ArrowLeft size={14} />
            返回首页
          </Link>
        </Button>
      </section>
    );
  }

  const softwareSkills = skills.filter((s) => s.category === 'software');
  const aiSkills = skills.filter((s) => s.category === 'ai');

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-24">
      <div className="flex items-center justify-between mb-10 md:mb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          返回首页
        </Link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {profile.resumeUrl ? (
                <Button asChild>
                  <UniversalLink
                    to={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Download size={16} />
                    下载 PDF简历
                  </UniversalLink>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  <Download size={16} />
                  暂无简历PDF
                </Button>
              )}
            </TooltipTrigger>
            {!profile.resumeUrl && (
              <TooltipContent>
                <p>请在后台上传简历PDF</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <header className="pb-10 md:pb-16 border-b border-border">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {profile.avatarUrl && (
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-muted shrink-0">
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="text-lg font-medium text-muted-foreground">
                {profile.title}
              </p>
            )}
            {profile.tagline && (
              <p className="text-base text-muted-foreground">{profile.tagline}</p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {profile.location}
                </span>
              )}
              {profile.showEmail && profile.email && (
                <UniversalLink
                  to={`mailto:${profile.email}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Mail size={14} />
                  {profile.email}
                </UniversalLink>
              )}
              {profile.showPhone && profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {profile.bio && (
        <section className="py-10 md:py-12 border-b border-border">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">个人简介</h2>
          <p className="text-base leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="py-10 md:py-12 border-b border-border">
          <h2 className="text-xl md:text-2xl font-semibold mb-8">工作经历</h2>
          <div className="space-y-10">
            {experiences.map((exp) => (
              <div key={exp.id} className="grid md:grid-cols-[200px_1fr] gap-4 md:gap-8">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {exp.startDate}
                    {exp.isCurrent ? ' — 至今' : ` — ${exp.endDate || ''}`}
                  </p>
                  <p className="text-base font-medium flex items-center gap-2">
                    <Briefcase size={14} />
                    {exp.company}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{exp.position}</h3>
                  {exp.description && (
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                  {exp.projects && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      项目经历：{exp.projects}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-10 md:py-12 border-b border-border">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">技能</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {softwareSkills.length > 0 ? (
            <div>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">
                使用软件
              </h3>
              <div className="flex flex-wrap gap-2">
                {softwareSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="font-normal"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : profile.software && profile.software.length > 0 ? (
            <div>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">
                使用软件
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.software.map((s: { name: string }) => (
                  <Badge
                    key={s.name}
                    variant="outline"
                    className="font-normal"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {aiSkills.length > 0 ? (
            <div>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">
                AI 工具
              </h3>
              <div className="flex flex-wrap gap-2">
                {aiSkills.map((s) => (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="font-normal"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : profile.aiTools && profile.aiTools.length > 0 ? (
            <div>
              <h3 className="text-base font-semibold mb-3 text-muted-foreground">
                AI 工具
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.aiTools.map((t: { name: string }) => (
                  <Badge
                    key={t.name}
                    variant="outline"
                    className="font-normal"
                  >
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {profile.specialties && profile.specialties.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold mb-3 text-muted-foreground">
              擅长方向
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((s: string) => (
                <Badge key={s} variant="secondary" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="py-10 md:py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {profile.workYears && (
            <div>
              <h3 className="text-base font-semibold mb-2 text-muted-foreground">
                工作年限
              </h3>
              <p className="text-base">{profile.workYears} 年</p>
            </div>
          )}
          {profile.location && (
            <div>
              <h3 className="text-base font-semibold mb-2 text-muted-foreground">
                所在城市
              </h3>
              <p className="text-base">{profile.location}</p>
            </div>
          )}
        </div>
      </section>

      <div className="pt-10 md:pt-12 border-t border-border flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/contact">
            <Mail size={16} />
            联系我
          </Link>
        </Button>
        {profile.resumeUrl ? (
          <Button variant="outline" asChild>
            <UniversalLink
              to={profile.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download size={16} />
              下载简历
            </UniversalLink>
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" disabled>
                  <Download size={16} />
                  暂无简历PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>请在后台上传简历PDF</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </section>
  );
};

const ResumeSkeleton: React.FC = () => (
  <section className="max-w-4xl mx-auto px-6 md:px-8 py-16 md:py-24">
    <div className="flex items-center justify-between mb-10">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-9 w-28" />
    </div>
    <div className="flex flex-col md:flex-row items-start gap-8 pb-10 border-b border-border">
      <Skeleton className="w-24 h-24 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-72" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  </section>
);

export default ResumePage;
