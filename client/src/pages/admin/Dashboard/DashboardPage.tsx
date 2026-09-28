import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Eye,
  Heart,
  FolderTree,
  Image,
  Plus,
  ArrowRight,
  TrendingUp,
  Trophy,
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Settings,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { worksApi } from '@client/src/api';
import type { DashboardStats } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Image as UIImage } from '@client/src/components/ui/image';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await worksApi.getWorkStats();
        if (mounted) setStats(data);
      } catch (e) {
        logger.error('load dashboard stats failed', e);
        toast.error('加载统计数据失败');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusBadge = (status: string) => {
    const labelMap: Record<string, string> = {
      draft: '草稿',
      published: '已发布',
      hidden: '隐藏',
      password: '密码访问',
    };
    const colorMap: Record<string, string> = {
      published: 'bg-[#dff6dd] text-[#107c10] border-[#b6e0b2]',
      draft: 'bg-[#fff4ce] text-[#8a6500] border-[#fde48a]',
      hidden: 'bg-[#f0f0f0] text-[#5c5c5c] border-[#e0e0e0]',
      password: 'bg-[#deecf9] text-[#005fb8] border-[#b8d6f0]',
    };
    return (
      <Badge
        variant="outline"
        className={`rounded-full border ${colorMap[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
      >
        {labelMap[status] || status}
      </Badge>
    );
  };

  const statCards = stats
    ? [
        {
          label: '总作品数',
          value: stats.totalWorks,
          icon: FileText,
        },
        {
          label: '总浏览量',
          value: stats.totalViews ?? 0,
          icon: Eye,
        },
        {
          label: '总点赞',
          value: stats.totalLikes,
          icon: Heart,
        },
        {
          label: '已发布',
          value: stats.publishedWorks,
          icon: Sparkles,
        },
      ]
    : [];

  const quickActions = [
    { label: '新增作品', icon: Plus, to: '/admin/works/new' },
    { label: '管理分类', icon: FolderTree, to: '/admin/categories' },
    { label: '媒体库', icon: Image, to: '/admin/media' },
    { label: '网站设置', icon: Settings, to: '/admin/settings' },
  ];

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await worksApi.exportData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const fileName = `portfolio-backup-${y}${m}${d}.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('数据导出成功');
    } catch (e) {
      logger.error('export data failed', e);
      toast.error('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

    return (
      <div className="space-y-4 bg-[#f3f3f3] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1b1b1b]">仪表盘</h1>
            <p className="mt-1 text-xs text-[#5c5c5c]">
              欢迎回来，今天也要加油创作哦
            </p>
          </div>
          <Button asChild className="bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] rounded-md font-medium shadow-sm h-8 px-4 text-sm">
          <Link to="/admin/works/new">
            <Plus className="size-4" />
            新增作品
          </Link>
        </Button>
      </div>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        data-ai-section-type="card-stat"
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5c5c5c]">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-[#1b1b1b]">
                  {card.value}
                </p>
              </div>
              <div className="flex w-10 h-10 items-center justify-center rounded-md bg-[#deecf9] text-[#0067c0]">
                <card.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)] rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                最近作品
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-[#5c5c5c] hover:bg-[#f2f2f2] rounded-md"
            >
              <Link to="/admin/works" className="gap-1">
                查看全部 <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             {stats?.recentWorks && stats.recentWorks.length > 0 ? (
               <div className="space-y-1">
                 {stats.recentWorks.slice(0, 5).map((work) => (
                   <Link
                     key={work.id}
                     to={`/admin/works/${work.id}/edit`}
                     className="flex items-center gap-4 rounded-md p-2 transition-all duration-150 hover:bg-[#f5f5f5]"
                   >
                     {work.coverUrl ? (
                       <UIImage
                         src={work.coverUrl}
                         alt={work.title}
                         className="h-16 w-16 rounded-md object-cover"
                       />
                     ) : (
                       <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[#f0f0f0]">
                         <Image className="size-6 text-[#8a8a8a]" />
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="truncate text-sm font-medium text-[#1b1b1b]">
                         {work.title}
                       </p>
                       <div className="mt-1 flex items-center gap-2">
                         {statusBadge(work.status)}
                         <span className="text-xs text-[#8a8a8a]">
                           更新于{' '}
                           {new Date(work.createdAt).toLocaleDateString('zh-CN')}
                         </span>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                       >
                         <Eye className="size-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-[#5c5c5c] hover:bg-[#f2f2f2] hover:text-[#1b1b1b] rounded-md"
                       >
                         <Plus className="size-4" />
                       </Button>
                     </div>
                   </Link>
                 ))}
               </div>
             ) : (
               <div className="py-10 text-center text-sm text-[#5c5c5c]">
                 暂无作品，去创建第一个作品吧
               </div>
             )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                快捷操作
              </CardTitle>
              <CardDescription className="text-xs text-[#5c5c5c]">
                常用功能入口
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  variant="outline"
                  className="h-auto flex-col items-start gap-1.5 border-[#e5e5e5] bg-white px-3 py-3 text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md shadow-sm"
                >
                  <Link to={action.to}>
                    <action.icon className="size-4 text-[#0067c0]" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                </Button>
              ))}
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-1.5 border-[#e5e5e5] bg-white px-3 py-3 text-[#1b1b1b] hover:bg-[#f9f9f9] rounded-md shadow-sm col-span-2"
                onClick={handleExport}
                disabled={exporting}
              >
                <span className="flex items-center gap-2">
                  <Download className="size-4 text-slate-600" />
                  <span className="text-sm font-medium">
                    {exporting ? '导出中...' : '导出数据'}
                  </span>
                </span>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#1b1b1b]">
                状态概览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-[#107c10]" />
                  <span className="text-sm text-[#5c5c5c]">累计浏览</span>
                </div>
                <span className="text-base font-semibold text-[#1b1b1b]">
                  {stats?.totalViews ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderTree className="size-4 text-[#5c5c5c]" />
                  <span className="text-sm text-[#5c5c5c]">分类数</span>
                </div>
                <span className="text-base font-semibold text-[#1b1b1b]">
                  {stats?.totalCategories ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="size-4 text-[#5c5c5c]" />
                  <span className="text-sm text-[#5c5c5c]">媒体数</span>
                </div>
                <span className="text-base font-semibold text-[#1b1b1b]">
                  {stats?.totalMedia ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-[#5c5c5c]" />
                  <span className="text-sm text-[#5c5c5c]">草稿 / 隐藏</span>
                </div>
                <span className="text-base font-semibold text-[#1b1b1b]">
                  {(stats?.draftWorks ?? 0) + (stats?.hiddenWorks ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1b1b1b]">
              <BarChart3 className="size-4 text-[#0067c0]" />
              访问统计
            </CardTitle>
            <CardDescription className="text-xs text-[#5c5c5c]">
              作品访问数据概览
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div
               className="grid grid-cols-2 gap-3 md:grid-cols-4"
               data-ai-section-type="card-stat"
             >
               <div className="rounded-md bg-[#deecf9] p-3">
                 <p className="text-xs text-[#005fb8]">总访问量</p>
                 <p className="mt-1 text-xl font-bold text-[#1b1b1b]">
                   {stats?.visitStats?.totalVisits ?? 0}
                 </p>
               </div>
               <div className="rounded-md bg-[#f0f0f0] p-3">
                 <p className="text-xs text-[#5c5c5c]">近 7 天</p>
                 <p className="mt-1 text-xl font-bold text-[#1b1b1b]">
                   {stats?.visitStats?.last7Days ?? 0}
                 </p>
               </div>
               <div className="rounded-md bg-[#f0f0f0] p-3">
                 <p className="text-xs text-[#5c5c5c]">近 30 天</p>
                 <p className="mt-1 text-xl font-bold text-[#1b1b1b]">
                   {stats?.visitStats?.last30Days ?? 0}
                 </p>
               </div>
               <div className="rounded-md bg-[#f0f0f0] p-3">
                 <p className="text-xs text-[#5c5c5c]">今日</p>
                 <p className="mt-1 text-xl font-bold text-[#1b1b1b]">
                   {stats?.visitStats?.today ?? 0}
                 </p>
               </div>
             </div>

            <div>
              <p className="mb-3 text-sm font-medium text-[#1b1b1b]">
                近 7 天访问趋势
              </p>
              <div className="flex h-32 items-end gap-2">
                {stats?.visitStats?.dailyTrend &&
                stats.visitStats.dailyTrend.length > 0 ? (
                  stats.visitStats.dailyTrend.map((day) => {
                    const maxViews = Math.max(
                      ...stats.visitStats!.dailyTrend.map(
                        (d) => d.views
                      ),
                      1
                    );
                    const heightPercent = (day.views / maxViews) * 100;
                    const dateLabel = day.date.slice(5);
                    return (
                      <div
                        key={day.date}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="flex h-full w-full items-end">
                           <div
                             className="w-full rounded-t bg-[#0067c0] text-white transition-all duration-150 hover:bg-[#1076d0]"
                             style={{ height: `${Math.max(heightPercent, 4)}%` }}
                             title={`${day.date}: ${day.views} 次访问`}
                           />
                         </div>
                         <span className="text-[10px] text-[#5c5c5c]">
                           {dateLabel}
                         </span>
                      </div>
                    );
                  })
                ) : (
                   <div className="flex w-full items-center justify-center text-sm text-[#8a8a8a]">
                     暂无数据
                   </div>
                 )}
              </div>
            </div>

             <div>
               <p className="mb-3 text-sm font-medium text-[#1b1b1b]">
                 设备分布
               </p>
              <div className="space-y-3">
                {(() => {
                  const ds = stats?.visitStats?.deviceStats;
                  const total = ds
                    ? ds.mobile + ds.desktop + ds.tablet
                    : 0;
                   const items = [
                     {
                       key: 'mobile',
                       label: '移动端',
                       icon: Smartphone,
                       color: 'bg-[#0067c0]',
                     },
                     {
                       key: 'desktop',
                       label: '桌面端',
                       icon: Monitor,
                       color: 'bg-[#5c5c5c]',
                     },
                     {
                       key: 'tablet',
                       label: '平板',
                       icon: Tablet,
                       color: 'bg-[#c0c0c0]',
                     },
                   ] as const;
                  return items.map((item) => {
                    const value = ds
                      ? ds[item.key as keyof typeof ds]
                      : 0;
                    const percent =
                      total > 0 ? (value / total) * 100 : 0;
                    return (
                      <div key={item.key}>
                         <div className="mb-1 flex items-center justify-between text-xs">
                           <span className="flex items-center gap-1 text-[#5c5c5c]">
                             <item.icon className="size-3.5" />
                             {item.label}
                           </span>
                           <span className="text-[#5c5c5c]">
                             {value} ({percent.toFixed(1)}%)
                           </span>
                         </div>
                         <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
                           <div
                             className={`h-full rounded-full ${item.color} transition-all duration-150`}
                             style={{ width: `${percent}%` }}
                           />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),0_1px_2px_rgba(0_0_0_0.02)] transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06),0_2px_4px_rgba(0_0_0_0.03)] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1b1b1b]">
              <Trophy className="size-4 text-[#f4b400]" />
              热门作品
            </CardTitle>
            <CardDescription className="text-xs text-[#5c5c5c]">
              按点赞数排名 Top 5
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.popularWorks && stats.popularWorks.length > 0 ? (
              <div className="space-y-1">
                {stats.popularWorks.slice(0, 5).map((work, index) => (
                  <div
                    key={work.id}
                    className="flex items-center gap-3 rounded-md p-2 transition-all duration-150 hover:bg-[#f5f5f5]"
                  >
                    <div className="flex h-6 w-6 items-center justify-center text-xs font-bold text-[#c0c0c0]">
                      {index + 1}
                    </div>
                    {work.coverUrl ? (
                      <UIImage
                        src={work.coverUrl}
                        alt={work.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f0f0f0]">
                        <Image className="size-5 text-[#8a8a8a]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1b1b1b]">
                        {work.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#5c5c5c]">
                      <span className="flex items-center gap-1">
                        <Eye size={14} className="text-[#c0c0c0]" />
                        {work.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart
                          size={14}
                          className="fill-[#c42b1c] text-[#c42b1c]"
                        />
                        {work.likeCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-[#5c5c5c]">
                暂无点赞数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
