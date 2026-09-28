import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  FolderTree,
  Tags,
  Library,
  User,
  FileText,
  Settings,
  Navigation,
  LayoutGrid,
  MessageCircle,
  Newspaper,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@client/src/hooks/useAuth';
import { Spinner } from '@client/src/components/ui/spinner';
import { Button } from '@client/src/components/ui/button';
import { customerMessagesApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';

const sidebarItems = [
  { path: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { path: '/admin/works', label: '作品管理', icon: Image },
  { path: '/admin/categories', label: '分类管理', icon: FolderTree },
  { path: '/admin/tags', label: '标签管理', icon: Tags },
  { path: '/admin/media', label: '媒体库', icon: Library },
  { path: '/admin/profile', label: '个人资料', icon: User },
  { path: '/admin/resume', label: '简历管理', icon: FileText },
  { path: '/admin/navigation', label: '导航管理', icon: Navigation },
  { path: '/admin/layout', label: '首页布局', icon: LayoutGrid },
  { path: '/admin/news', label: '动态管理', icon: Newspaper },
  { path: '/admin/messages', label: '客服消息', icon: MessageCircle },
  { path: '/admin/settings', label: '网站设置', icon: Settings },
];

const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin') return '仪表盘';
  if (pathname.startsWith('/admin/works')) {
    if (pathname.includes('/edit') || pathname.endsWith('/new')) return '编辑作品';
    return '作品管理';
  }
  const item = sidebarItems.find(
    (item: { path: string; label: string }) => item.path === pathname,
  );
  return item?.label || '管理后台';
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, logout } = useAuth();
  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await customerMessagesApi.getUnreadCount();
      setUnreadCount(result.unreadCount);
    } catch (e) {
      logger.error('fetch unread count failed', e);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void fetchUnreadCount();
    const timer = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(timer);
  }, [user, fetchUnreadCount]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('已退出登录');
      navigate('/login');
    } catch (e) {
      toast.error('退出失败');
    }
  };

  const userInitial = user?.username?.charAt(0)?.toUpperCase() || 'A';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <span className="text-sm text-[#5c5c5c]">加载中...</span>
        </div>
      </div>
    );
  }

  if (!user) {
     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
   }

  return (
    <div className="flex h-screen bg-[#f3f3f3] font-[family-name:var(--font-fluent)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 transform border-r border-[#e5e5e5] backdrop-blur-xl backdrop-saturate-150 bg-white/60 transition-all duration-150 ease-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b border-[#ececec]">
          <h1 className="text-sm font-semibold text-[#1b1b1b]">管理后台</h1>
          <button
            type="button"
            className="text-[#8a8a8a] hover:text-[#1b1b1b] transition-colors duration-150 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
           {sidebarItems.map(
             (item: {
               path: string;
               label: string;
               icon: React.ComponentType<{ size?: number; className?: string }>;
             }) => {
               const showBadge = item.path === '/admin/messages' && unreadCount > 0;
               return (
                 <NavLink
                   key={item.path}
                   to={item.path}
                   end={item.path === '/admin'}
                   onClick={() => setSidebarOpen(false)}
                   className={({ isActive }) =>
                     `flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-sm font-normal transition-all duration-150 ease-out border-l-2 ${
                       isActive
                         ? 'bg-white text-[#0067c0] font-semibold shadow-sm border border-[#e5e5e5] border-l-[#0067c0]'
                         : 'text-[#5c5c5c] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] border-l-transparent'
                     }`
                   }
                 >
                   <span className="flex items-center gap-2.5">
                     <item.icon size={16} />
                     {item.label}
                   </span>
                   {showBadge && (
                     <span className="flex min-w-[18px] items-center justify-center rounded-full bg-[#c42b1c] px-1.5 text-[10px] font-semibold text-white">
                       {unreadCount > 99 ? '99+' : unreadCount}
                     </span>
                   )}
                 </NavLink>
               );
             },
           )}
         </nav>

         <div className="absolute bottom-0 left-0 right-0 border-t border-[#ececec] p-3">
           <div className="mb-2 px-3 text-xs text-[#8a8a8a]">
             当前账号：{user.username}
           </div>
           <button
             type="button"
             onClick={handleLogout}
             className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-normal text-[#5c5c5c] transition-all duration-150 ease-out hover:bg-[#f2f2f2] hover:text-[#1b1b1b]"
           >
             <LogOut size={16} />
             退出登录
           </button>
         </div>
       </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b border-[#e5e5e5] backdrop-blur-xl backdrop-saturate-150 bg-white/75 px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-[#5c5c5c] hover:text-[#1b1b1b] transition-colors duration-150 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h2 className="text-sm font-semibold text-[#1b1b1b]">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 gap-1.5 bg-white text-[#1b1b1b] border-[#e5e5e5] hover:bg-[#f9f9f9] rounded-md font-medium text-sm px-3"
            >
              <Link to="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                访问前台
              </Link>
            </Button>
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-150 ease-out hover:bg-[#f2f2f2]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f2] text-sm font-semibold text-[#1b1b1b]">
                  {userInitial}
                </div>
                <span className="hidden text-sm font-medium text-[#1b1b1b] sm:block">
                  {user.username}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-[#8a8a8a] transition-transform duration-150 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-[#e5e5e5] bg-white py-1.5 shadow-[0_8px_32px_rgba(0_0_0_0.08),_0_4px_8px_rgba(0_0_0_0.04)]">
                  <div className="border-b border-[#ececec] px-3 py-2">
                    <p className="text-sm font-semibold text-[#1b1b1b]">{user.username}</p>
                    <p className="text-xs text-[#8a8a8a]">管理员</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-normal text-[#5c5c5c] transition-colors duration-150 hover:bg-[#f2f2f2]"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
