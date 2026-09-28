import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Github,
  Linkedin,
  ArrowLeft,
} from 'lucide-react';
import { publicApi } from '@client/src/api';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import type { Profile } from '@shared/api.interface';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

interface SocialLink {
  label: string;
  key: string;
  url?: string;
  show: boolean;
  icon: React.ReactNode;
}

const ContactPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await publicApi.getProfile();
        if (!cancelled) {
          setProfile(res);
          setLoading(false);
        }
      } catch (e) {
        logger.error('ContactPage load failed', e);
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

  if (loading) return <ContactSkeleton />;
  if (error || !profile) {
    return (
      <section className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-32 text-center">
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

  const contactItems: Array<{
    label: string;
    value: string;
    href: string;
    icon: React.ReactNode;
    visible: boolean;
  }> = [
    {
      label: '邮箱',
      value: profile.email || '',
      href: `mailto:${profile.email}`,
      icon: <Mail size={20} />,
      visible: profile.showEmail && !!profile.email,
    },
    {
      label: '电话',
      value: profile.phone || '',
      href: `tel:${profile.phone}`,
      icon: <Phone size={20} />,
      visible: profile.showPhone && !!profile.phone,
    },
    {
      label: '微信',
      value: profile.wechat || '',
      href: '#',
      icon: <MessageSquare size={20} />,
      visible: profile.showWechat && !!profile.wechat,
    },
  ];

  const socialLinks: SocialLink[] = [
    {
      label: '个人网站',
      key: 'website',
      url: profile.website,
      show: profile.showWebsite && !!profile.website,
      icon: <Globe size={20} />,
    },
    {
      label: 'Behance',
      key: 'behance',
      url: profile.behance,
      show: profile.showBehance && !!profile.behance,
      icon: <Globe size={20} />,
    },
    {
      label: '站酷',
      key: 'zcool',
      url: profile.zcool,
      show: profile.showZcool && !!profile.zcool,
      icon: <Globe size={20} />,
    },
    {
      label: 'GitHub',
      key: 'github',
      url: profile.github,
      show: profile.showGithub && !!profile.github,
      icon: <Github size={20} />,
    },
    {
      label: '小红书',
      key: 'xiaohongshu',
      url: profile.xiaohongshu,
      show: profile.showXiaohongshu && !!profile.xiaohongshu,
      icon: <Globe size={20} />,
    },
    {
      label: 'LinkedIn',
      key: 'linkedin',
      url: profile.linkedin,
      show: profile.showLinkedin && !!profile.linkedin,
      icon: <Linkedin size={20} />,
    },
  ];

  const visibleContacts = contactItems.filter((c) => c.visible);
  const visibleSocials = socialLinks.filter((s) => s.show);

  return (
    <section className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-32">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 md:mb-16"
      >
        <ArrowLeft size={14} />
        返回首页
      </Link>

      <div className="space-y-4 mb-12 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          联系方式
        </h1>
        <p className="text-lg text-muted-foreground">
          欢迎通过以下方式与我取得联系
        </p>
      </div>

      {visibleContacts.length > 0 && (
        <div className="space-y-4 mb-16">
          <h2 className="text-lg font-semibold mb-4">直接联系</h2>
          <div className="grid gap-3">
            {visibleContacts.map((item) => (
              <UniversalLink
                key={item.label}
                to={item.href}
                className="group flex items-center gap-4 p-4 rounded-md border border-border hover:border-foreground transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-base font-medium">{item.value}</p>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  →
                </div>
              </UniversalLink>
            ))}
          </div>
        </div>
      )}

      {visibleSocials.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">社交平台</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {visibleSocials.map((link) => (
              <UniversalLink
                key={link.key}
                to={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-md border border-border hover:border-foreground transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  {link.icon}
                </div>
                <span className="text-sm font-medium">{link.label}</span>
              </UniversalLink>
            ))}
          </div>
        </div>
      )}

      {visibleContacts.length === 0 && visibleSocials.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>暂无公开的联系方式</p>
        </div>
      )}

      <div className="mt-16 md:mt-24 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground mb-4">
          想看看我的作品？
        </p>
        <Button variant="outline" asChild>
          <Link to="/works">浏览作品</Link>
        </Button>
      </div>
    </section>
  );
};

const ContactSkeleton: React.FC = () => (
  <section className="max-w-3xl mx-auto px-6 md:px-8 py-20 md:py-32">
    <Skeleton className="h-5 w-20 mb-10" />
    <Skeleton className="h-12 md:h-16 w-48 mb-4" />
    <Skeleton className="h-6 w-64 mb-12" />
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-md" />
      ))}
    </div>
  </section>
);

export default ContactPage;
