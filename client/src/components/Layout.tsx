import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { publicApi } from '@client/src/api';
import { useTheme, THEME_PRESETS } from '@client/src/contexts/ThemeContext';
import SearchBox from '@client/src/components/SearchBox';
import CustomerServiceWidget from '@client/src/components/CustomerServiceWidget';
import MusicPlayer from '@client/src/components/MusicPlayer';
import CustomCursor from '@client/src/components/CustomCursor';
import type { SiteSettings, Category, NavItem } from '@shared/api.interface';

const FALLBACK_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '首页', path: '/', isVisible: true, sortOrder: 1 },
  { id: 'works', label: '作品', path: '/works', isVisible: true, sortOrder: 2 },
  { id: 'about', label: '关于我', path: '/about', isVisible: true, sortOrder: 3 },
  { id: 'resume', label: '简历', path: '/resume', isVisible: true, sortOrder: 4 },
  { id: 'contact', label: '联系方式', path: '/contact', isVisible: true, sortOrder: 5 },
];

function getNavItems(settings: SiteSettings | null): NavItem[] {
  const items = settings?.navItems;
  if (!items || items.length === 0) return FALLBACK_NAV_ITEMS;
  return items.filter((item) => item.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
}

const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settingsError, setSettingsError] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { applyTheme, colorScheme, toggleColorScheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [settingsRes, categoriesRes] = await Promise.all([publicApi.getSettings(), publicApi.getCategories()]);
        if (!cancelled) {
          setSettings(settingsRes);
          setCategories(categoriesRes);
          if (settingsRes.themeConfig) {
            const cfg = settingsRes.themeConfig;
            const preset = cfg.preset ? THEME_PRESETS[cfg.preset] : null;
            const merged = preset
              ? { ...preset, ...Object.fromEntries(Object.entries(cfg).filter(([k, v]) => k !== 'preset' && v !== undefined && v !== '')) }
              : cfg;
            applyTheme(merged);
          }
        }
      } catch (e) {
        logger.error('Layout load settings/categories failed', e);
        if (!cancelled) setSettingsError(true);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (settings?.antiDownloadEnabled) {
      document.body.setAttribute('data-anti-download', 'true');
    } else {
      document.body.removeAttribute('data-anti-download');
    }
  }, [settings?.antiDownloadEnabled]);

  const siteName = settings?.siteName || 'Portfolio';
  const footerText = settings?.footerText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const navItems = getNavItems(settings);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const title = settings?.seoTitle?.trim() || siteName;
    const description = settings?.seoDescription?.trim() || `${siteName}个人设计作品集`;
    document.title = title;
    const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let meta = document.querySelector<HTMLMetaElement>(selector);
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, key); document.head.appendChild(meta); }
      meta.content = value;
    };
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
  }, [settings?.seoDescription, settings?.seoTitle, siteName]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur">
        <nav className="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight text-foreground hover:opacity-70 transition-opacity">{siteName}</Link>
          <ul className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.id} className="relative">
                {item.path === '/works' ? (
                  <div className="relative" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
                    <NavLink to={item.path} end className={({ isActive }) => `text-sm transition-colors inline-flex items-center gap-1 ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                      {item.label}<ChevronDown size={14} />
                    </NavLink>
                    {dropdownOpen && categories.length > 0 && (
                      <div className="absolute top-full left-0 pt-2">
                        <div className="min-w-[160px] rounded-md border border-border bg-background shadow-sm py-1">
                          <Link to="/works" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">全部作品</Link>
                          <div className="my-1 border-t border-border" />
                          {categories.map((cat) => (<Link key={cat.id} to={`/works?category=${cat.slug}`} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">{cat.name}</Link>))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink to={item.path} end={item.path === '/'} className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden md:flex items-center gap-4">
            <SearchBox variant="desktop" />
            <button type="button" onClick={toggleColorScheme} className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="切换主题" title="切换主题">
              {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">管理</Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="md:hidden"><SearchBox variant="mobile" /></div>
            <button type="button" onClick={toggleColorScheme} className="md:hidden grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="切换主题">
              {colorScheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 -mr-2 text-foreground hover:opacity-70 transition-opacity" aria-label="菜单">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <ul className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <NavLink to={item.path} end={item.path === '/'} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `block px-2 py-3 text-sm transition-colors rounded-md ${isActive ? 'text-foreground font-medium bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                    {item.label}
                  </NavLink>
                  {item.path === '/works' && categories.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                      {categories.map((cat) => (<li key={cat.id}><Link to={`/works?category=${cat.slug}`} onClick={() => setIsMenuOpen(false)} className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">{cat.name}</Link></li>))}
                    </ul>
                  )}
                </li>
              ))}
              <li><Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-2 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">管理后台</Link></li>
            </ul>
          </div>
        )}
      </header>
      <main className="flex-1">
        {settingsError && (
          <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6"><p className="text-sm text-muted-foreground">加载网站设置失败，部分信息可能无法显示。</p></div>
        )}
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{footerText}</p>
        </div>
      </footer>
      <CustomerServiceWidget settings={settings} />
      <MusicPlayer settings={settings} />
      <CustomCursor style={settings?.cursorStyle || 'none'} />
    </div>
  );
};

export default Layout;
