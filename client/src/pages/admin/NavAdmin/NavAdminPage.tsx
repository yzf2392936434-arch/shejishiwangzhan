import React, { useCallback, useEffect, useState } from 'react';
import {
  Save,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  GripVertical,
  Navigation,
  Menu,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { settingsApi } from '@client/src/api';
import type { NavItem, SiteSettings } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'nav-home', label: '首页', path: '/', isVisible: true, sortOrder: 0 },
  { id: 'nav-about', label: '关于我', path: '/about', isVisible: true, sortOrder: 1 },
  { id: 'nav-works', label: '作品', path: '/works', isVisible: true, sortOrder: 2 },
  { id: 'nav-resume', label: '简历', path: '/resume', isVisible: true, sortOrder: 3 },
  { id: 'nav-contact', label: '联系方式', path: '/contact', isVisible: true, sortOrder: 4 },
];

const isSystemNav = (id: string): boolean => id.startsWith('nav-');

const NavAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [originalNavItems, setOriginalNavItems] = useState<NavItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavItem | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newPath, setNewPath] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editPath, setEditPath] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data: SiteSettings = await settingsApi.getSettings();
      const items = data.navItems && data.navItems.length > 0
        ? [...data.navItems].sort((a: NavItem, b: NavItem) => a.sortOrder - b.sortOrder)
        : DEFAULT_NAV_ITEMS;
      setNavItems(items);
      setOriginalNavItems(items);
    } catch (e) {
      logger.error('load nav settings failed', e);
      toast.error('加载导航设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const changed = JSON.stringify(navItems) !== JSON.stringify(originalNavItems);
    setHasChanges(changed);
  }, [navItems, originalNavItems]);

  const reassignSortOrder = (items: NavItem[]): NavItem[] =>
    items.map((item: NavItem, idx: number) => ({ ...item, sortOrder: idx }));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= navItems.length) return;
    const next = [...navItems];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setNavItems(reassignSortOrder(next));
  };

  const toggleVisible = (index: number) => {
    const next = [...navItems];
    next[index] = { ...next[index], isVisible: !next[index].isVisible };
    setNavItems(next);
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newPath.trim()) {
      toast.error('请填写名称和路径');
      return;
    }
    const newItem: NavItem = {
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      path: newPath.trim(),
      isVisible: true,
      sortOrder: navItems.length,
      isCustom: true,
    };
    setNavItems([...navItems, newItem]);
    setAddDialogOpen(false);
    setNewLabel('');
    setNewPath('');
  };

  const openEditDialog = (item: NavItem) => {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditPath(item.path);
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingItem || !editLabel.trim() || !editPath.trim()) {
      toast.error('请填写名称和路径');
      return;
    }
    const next = navItems.map((item: NavItem) =>
      item.id === editingItem.id
        ? { ...item, label: editLabel.trim(), path: editPath.trim() }
        : item,
    );
    setNavItems(next);
    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    const next = navItems.filter((item: NavItem) => item.id !== id);
    setNavItems(reassignSortOrder(next));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSettings({ navItems });
      setOriginalNavItems(navItems);
      toast.success('导航设置已保存');
    } catch (e) {
      logger.error('save nav settings failed', e);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#5c5c5c]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1b1b1b]">导航管理</h1>
          <p className="text-sm text-[#5c5c5c] mt-1">
            管理网站顶部导航菜单的顺序、显隐和名称
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setAddDialogOpen(true)}
            disabled={saving}
            className="h-8 px-4 text-sm rounded-md bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] font-medium"
          >
            <Plus className="size-4" />
            新增导航项
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-8 px-4 text-sm rounded-md bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] font-medium shadow-sm"
          >
            <Save className="size-4" />
            保存更改
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Menu className="size-4 text-[#5c5c5c]" />
          <h2 className="text-base font-semibold text-[#1b1b1b]">导航菜单</h2>
          <span className="text-xs text-[#8a8a8a]">
            拖拽调整顺序，切换显隐状态。系统内置项不可删除。
          </span>
        </div>

        {navItems.map((item: NavItem, index: number) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl border border-[#e5e5e5] shadow-sm transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)] hover:-translate-y-px ${
              !item.isVisible ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-1 text-[#d0d0d0] cursor-grab">
              <GripVertical className="size-4" />
            </div>

            <div className="flex flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0 || saving}
                className="size-6 text-[#8a8a8a] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveItem(index, 'down')}
                disabled={index === navItems.length - 1 || saving}
                className="size-6 text-[#8a8a8a] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1b1b1b] truncate">
                  {item.label}
                </span>
                {isSystemNav(item.id) ? (
                  <span className="inline-flex items-center rounded-full bg-[#deecf9] text-[#005fb8] border border-[#b8d6f0] px-2 py-0.5 text-[10px] font-medium">
                    系统
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#f0f0f0] text-[#5c5c5c] border border-[#e0e0e0] px-2 py-0.5 text-[10px] font-medium">
                    自定义
                  </span>
                )}
              </div>
              <div className="text-xs text-[#5c5c5c] font-mono mt-0.5">
                {item.path}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={item.isVisible}
                onCheckedChange={() => toggleVisible(index)}
                disabled={saving}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(item)}
                disabled={saving}
                className="size-8 text-[#5c5c5c] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
                title="编辑"
              >
                <Pencil className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.id)}
                disabled={saving || isSystemNav(item.id)}
                className={`size-8 rounded-md ${
                  isSystemNav(item.id)
                    ? 'opacity-30 cursor-not-allowed'
                    : 'text-[#c42b1c] hover:text-[#d13424] hover:bg-[#fbe4e1]'
                }`}
                title="删除"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        {navItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-[#e5e5e5] shadow-sm">
            <Navigation className="size-10 text-[#c0c0c0] mb-3" />
            <p className="text-sm font-semibold text-[#1b1b1b]">暂无导航项</p>
            <p className="text-xs text-[#8a8a8a] mt-1">
              点击「新增导航项」添加第一个菜单
            </p>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(true)}
              className="mt-4 h-8 px-4 text-sm rounded-md bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] font-medium"
            >
              <Plus className="size-4" />
              新增导航项
            </Button>
          </div>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增导航项</DialogTitle>
            <DialogDescription>添加自定义导航链接</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newLabel">名称 *</Label>
              <Input
                id="newLabel"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例如：博客"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPath">路径 *</Label>
              <Input
                id="newPath"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="/blog 或 https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAdd}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑导航项</DialogTitle>
            <DialogDescription>修改导航名称和路径</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editLabel">名称 *</Label>
              <Input
                id="editLabel"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPath">路径 *</Label>
              <Input
                id="editPath"
                value={editPath}
                onChange={(e) => setEditPath(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavAdminPage;
