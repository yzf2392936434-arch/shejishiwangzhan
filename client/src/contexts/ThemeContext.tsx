import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeConfig } from '@shared/api.interface';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  themeConfig: ThemeConfig | null;
  applyTheme: (config: ThemeConfig) => void;
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (mode: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export interface ThemePreset extends ThemeConfig {
  name: string;
  description: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  minimal: {
    name: '黑白极简',
    description: '经典黑白，永恒高级',
    preset: 'minimal',
    primaryColor: '#0a0a0a',
    accentColor: '#f5f5f5',
    backgroundColor: '#ffffff',
    navColor: '#ffffff',
    textColor: '#1a1a1a',
    buttonColor: '#0a0a0a',
    buttonTextColor: '#ffffff',
    linkColor: '#0a0a0a',
    borderColor: '#e5e7eb',
  },
  morandi: {
    name: '莫兰迪灰蓝',
    description: '低饱和灰蓝，静谧优雅',
    preset: 'morandi',
    primaryColor: '#64748b',
    accentColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    navColor: '#f8fafc',
    textColor: '#334155',
    buttonColor: '#64748b',
    buttonTextColor: '#ffffff',
    linkColor: '#64748b',
    borderColor: '#cbd5e1',
  },
  caramel: {
    name: '奶油焦糖',
    description: '暖调奶咖，温柔治愈',
    preset: 'caramel',
    primaryColor: '#a16207',
    accentColor: '#fef3c7',
    backgroundColor: '#fffbeb',
    navColor: '#fffbeb',
    textColor: '#78350f',
    buttonColor: '#a16207',
    buttonTextColor: '#fffbeb',
    linkColor: '#a16207',
    borderColor: '#fde68a',
  },
  vintageRed: {
    name: '复古红棕',
    description: '红棕色调，怀旧质感',
    preset: 'vintageRed',
    primaryColor: '#991b1b',
    accentColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    navColor: '#fef2f2',
    textColor: '#7f1d1d',
    buttonColor: '#991b1b',
    buttonTextColor: '#ffffff',
    linkColor: '#991b1b',
    borderColor: '#fecaca',
  },
  jade: {
    name: '翡翠绿',
    description: '翠色如玉，清新典雅',
    preset: 'jade',
    primaryColor: '#0f766e',
    accentColor: '#ccfbf1',
    backgroundColor: '#f0fdfa',
    navColor: '#f0fdfa',
    textColor: '#134e4a',
    buttonColor: '#0f766e',
    buttonTextColor: '#ffffff',
    linkColor: '#0f766e',
    borderColor: '#99f6e4',
  },
  hazePurple: {
    name: '雾霾紫',
    description: '灰紫朦胧，艺术浪漫',
    preset: 'hazePurple',
    primaryColor: '#7c3aed',
    accentColor: '#ede9fe',
    backgroundColor: '#faf5ff',
    navColor: '#faf5ff',
    textColor: '#581c87',
    buttonColor: '#7c3aed',
    buttonTextColor: '#ffffff',
    linkColor: '#7c3aed',
    borderColor: '#ddd6fe',
  },
  coral: {
    name: '珊瑚橘',
    description: '活力珊瑚，明快温暖',
    preset: 'coral',
    primaryColor: '#ea580c',
    accentColor: '#ffedd5',
    backgroundColor: '#fff7ed',
    navColor: '#fff7ed',
    textColor: '#9a3412',
    buttonColor: '#ea580c',
    buttonTextColor: '#ffffff',
    linkColor: '#ea580c',
    borderColor: '#fed7aa',
  },
  deepSea: {
    name: '深海蓝',
    description: '深蓝商务，专业理性',
    preset: 'deepSea',
    primaryColor: '#1e3a8a',
    accentColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    navColor: '#eff6ff',
    textColor: '#172554',
    buttonColor: '#1e3a8a',
    buttonTextColor: '#ffffff',
    linkColor: '#1e3a8a',
    borderColor: '#bfdbfe',
  },
  forest: {
    name: '森林绿',
    description: '深绿自然，沉稳大气',
    preset: 'forest',
    primaryColor: '#14532d',
    accentColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
    navColor: '#f0fdf4',
    textColor: '#052e16',
    buttonColor: '#14532d',
    buttonTextColor: '#ffffff',
    linkColor: '#14532d',
    borderColor: '#bbf7d0',
  },
  nightGold: {
    name: '暗夜金',
    description: '黑金配色，奢华高端',
    preset: 'nightGold',
    primaryColor: '#fbbf24',
    accentColor: '#1f2937',
    backgroundColor: '#0f172a',
    navColor: '#111827',
    textColor: '#f1f5f9',
    buttonColor: '#fbbf24',
    buttonTextColor: '#0f172a',
    linkColor: '#fbbf24',
    borderColor: '#334155',
  },
  sakura: {
    name: '樱花粉',
    description: '柔粉浪漫，少女心满分',
    preset: 'sakura',
    primaryColor: '#db2777',
    accentColor: '#fce7f3',
    backgroundColor: '#fdf2f8',
    navColor: '#fdf2f8',
    textColor: '#831843',
    buttonColor: '#db2777',
    buttonTextColor: '#ffffff',
    linkColor: '#db2777',
    borderColor: '#fbcfe8',
  },
  oat: {
    name: '燕麦米',
    description: '米色暖调，温润质朴',
    preset: 'oat',
    primaryColor: '#78716c',
    accentColor: '#e7e5e4',
    backgroundColor: '#fafaf9',
    navColor: '#fafaf9',
    textColor: '#44403c',
    buttonColor: '#78716c',
    buttonTextColor: '#ffffff',
    linkColor: '#78716c',
    borderColor: '#d6d3d1',
  },
};

const STYLE_ID = 'portfolio-theme-styles';

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, Math.round(parseInt(clean.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(clean.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(clean.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function invertForDark(config: ThemeConfig): ThemeConfig {
  const bg = config.backgroundColor || '#ffffff';
  const fg = config.textColor || '#1a1a1a';
  const accent = config.accentColor || '#f5f5f5';
  const border = config.borderColor || '#e5e7eb';
  const primary = config.primaryColor || '#0a0a0a';
  return {
    ...config,
    backgroundColor: darkenHex(bg, 0.92),
    navColor: darkenHex(config.navColor || bg, 0.9),
    textColor: '#f1f5f9',
    buttonTextColor: darkenHex(config.buttonTextColor || fg, 0.85),
    accentColor: darkenHex(accent, 0.8),
    borderColor: darkenHex(border, 0.7),
    primaryColor: primary === '#0a0a0a' || config.preset === 'minimal' ? '#e5e7eb' : primary,
  };
}

export function applyThemeStyles(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const buildRules = (cfg: ThemeConfig): string[] => {
    const rules: string[] = [];
    if (cfg.primaryColor) {
      const hsl = hexToHsl(cfg.primaryColor);
      rules.push(`  --primary: ${hsl};`);
      rules.push(`  --ring: ${hsl};`);
    }
    if (cfg.accentColor) {
      const hsl = hexToHsl(cfg.accentColor);
      rules.push(`  --accent: ${hsl};`);
      rules.push(`  --muted: ${hsl};`);
      rules.push(`  --secondary: ${hsl};`);
    }
    if (cfg.backgroundColor) {
      const hsl = hexToHsl(cfg.backgroundColor);
      rules.push(`  --background: ${hsl};`);
      rules.push(`  --card: ${hsl};`);
      rules.push(`  --popover: ${hsl};`);
    }
    if (cfg.textColor) {
      const hsl = hexToHsl(cfg.textColor);
      rules.push(`  --foreground: ${hsl};`);
      rules.push(`  --card-foreground: ${hsl};`);
      rules.push(`  --popover-foreground: ${hsl};`);
      rules.push(`  --primary-foreground: ${cfg.buttonTextColor ? hexToHsl(cfg.buttonTextColor) : hsl};`);
      rules.push(`  --secondary-foreground: ${hsl};`);
      rules.push(`  --accent-foreground: ${hsl};`);
    }
    if (cfg.borderColor) {
      const hsl = hexToHsl(cfg.borderColor);
      rules.push(`  --border: ${hsl};`);
      rules.push(`  --input: ${hsl};`);
    }
    return rules;
  };

  const lightRules = buildRules(config);
  const darkRules = buildRules(invertForDark(config));

  styleEl.textContent = `:root {\n${lightRules.join('\n')}\n}\nhtml.dark, html[data-color-scheme="dark"] {\n${darkRules.join('\n')}\n}`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'portfolio-theme';

function resolveSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyDarkClass(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const mode: ColorScheme = dark ? 'dark' : 'light';
  root.classList.toggle('dark', dark);
  root.dataset.colorScheme = mode;
  root.style.colorScheme = mode;

  const themeColor = dark ? '#0d0d0f' : '#ffffff';
  let themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = themeColor;
}

function readStoredScheme(): ColorScheme {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (stored === 'system') return resolveSystemDark() ? 'dark' : 'light';
  return 'light';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  const applyTheme = useCallback((config: ThemeConfig) => {
    setThemeConfig(config);
    applyThemeStyles(config);
  }, []);

  const applyColorScheme = useCallback((mode: ColorScheme) => {
    applyDarkClass(mode === 'dark');
  }, []);

  useEffect(() => {
    const preset = THEME_PRESETS.minimal;
    applyThemeStyles(preset);
    setThemeConfig(preset);

    const stored = readStoredScheme();
    setColorScheme(stored);
    applyColorScheme(stored);

  }, [applyColorScheme]);

  const setColorSchemeAndPersist = useCallback((mode: ColorScheme) => {
    setColorScheme(mode);
    applyColorScheme(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [applyColorScheme]);

  const toggleColorScheme = useCallback(() => {
    setColorScheme((prev) => {
      const next: ColorScheme = prev === 'dark' ? 'light' : 'dark';
      applyColorScheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [applyColorScheme]);

  return (
    <ThemeContext.Provider
      value={{
        themeConfig,
        applyTheme,
        colorScheme,
        toggleColorScheme,
        setColorScheme: setColorSchemeAndPersist,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
