import React, { useCallback, useEffect, useState } from 'react';
import {
  Save,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Plus,
  X,
  GripVertical,
  Grid3X3,
  Pencil,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/src/components/ui/button';
import { Switch } from '@client/src/components/ui/switch';
import { Input } from '@client/src/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { settingsApi } from '@client/src/api';
import type { HomeSection, SiteSettings, SkillMatrix, SkillMatrixCell } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: 'section-hero', type: 'hero', title: '首屏', isVisible: true, sortOrder: 0 },
  { id: 'section-about', type: 'about', title: '关于我', isVisible: true, sortOrder: 1 },
  { id: 'section-featured_works', type: 'featured_works', title: '精选作品', isVisible: true, sortOrder: 2 },
  { id: 'section-pinned_works', type: 'pinned_works', title: '代表作横滑', isVisible: true, sortOrder: 3 },
  { id: 'section-skill_matrix', type: 'skill_matrix', title: '能力矩阵', isVisible: true, sortOrder: 4 },
  { id: 'section-categories', type: 'categories', title: '作品分类', isVisible: true, sortOrder: 5 },
  { id: 'section-skills', type: 'skills', title: '技能标签', isVisible: true, sortOrder: 6 },
  { id: 'section-news_feed', type: 'news_feed', title: '最新动态', isVisible: true, sortOrder: 7 },
  { id: 'section-contact', type: 'contact', title: '联系方式', isVisible: true, sortOrder: 8 },
];

const SECTION_LABELS: Record<string, string> = {
  hero: '首屏',
  about: '关于我',
  contact: '联系方式',
  featured_works: '精选作品',
  pinned_works: '代表作横滑',
  skill_matrix: '能力矩阵',
  categories: '作品分类',
  skills: '技能标签',
  news_feed: '最新动态',
};

const SECTION_TYPE_OPTIONS = [
  { value: 'pinned_works', label: '代表作横滑' },
  { value: 'skill_matrix', label: '能力矩阵' },
  { value: 'news_feed', label: '最新动态' },
];

const DEFAULT_SKILL_MATRIX: SkillMatrix = {
  rows: [
    { id: 'row-1', label: '电商设计' },
    { id: 'row-2', label: '平面设计' },
    { id: 'row-3', label: '品牌设计' },
    { id: 'row-4', label: 'AI视觉设计' },
  ],
  cols: [
    { id: 'col-1', label: '主图' },
    { id: 'col-2', label: '详情页' },
    { id: 'col-3', label: '海报' },
    { id: 'col-4', label: '包装' },
    { id: 'col-5', label: 'LOGO' },
    { id: 'col-6', label: '视频' },
  ],
  cells: [
    { rowId: 'row-1', colId: 'col-1', level: 2 },
    { rowId: 'row-1', colId: 'col-2', level: 2 },
    { rowId: 'row-1', colId: 'col-3', level: 1 },
    { rowId: 'row-1', colId: 'col-4', level: 1 },
    { rowId: 'row-1', colId: 'col-5', level: 0 },
    { rowId: 'row-1', colId: 'col-6', level: 1 },
    { rowId: 'row-2', colId: 'col-1', level: 1 },
    { rowId: 'row-2', colId: 'col-2', level: 1 },
    { rowId: 'row-2', colId: 'col-3', level: 2 },
    { rowId: 'row-2', colId: 'col-4', level: 2 },
    { rowId: 'row-2', colId: 'col-5', level: 1 },
    { rowId: 'row-2', colId: 'col-6', level: 0 },
    { rowId: 'row-3', colId: 'col-1', level: 0 },
    { rowId: 'row-3', colId: 'col-2', level: 0 },
    { rowId: 'row-3', colId: 'col-3', level: 2 },
    { rowId: 'row-3', colId: 'col-4', level: 1 },
    { rowId: 'row-3', colId: 'col-5', level: 2 },
    { rowId: 'row-3', colId: 'col-6', level: 0 },
    { rowId: 'row-4', colId: 'col-1', level: 2 },
    { rowId: 'row-4', colId: 'col-2', level: 1 },
    { rowId: 'row-4', colId: 'col-3', level: 2 },
    { rowId: 'row-4', colId: 'col-4', level: 0 },
    { rowId: 'row-4', colId: 'col-5', level: 1 },
    { rowId: 'row-4', colId: 'col-6', level: 2 },
  ],
};

const isSystemSection = (id: string): boolean => id.startsWith('section-');

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const LayoutAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [originalSections, setOriginalSections] = useState<HomeSection[]>([]);
  const [skillMatrix, setSkillMatrix] = useState<SkillMatrix>(DEFAULT_SKILL_MATRIX);
  const [originalSkillMatrix, setOriginalSkillMatrix] = useState<SkillMatrix>(DEFAULT_SKILL_MATRIX);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');
  const [newSectionType, setNewSectionType] = useState<string>('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data: SiteSettings = await settingsApi.getSettings();
      const items = data.homeSections && data.homeSections.length > 0
        ? [...data.homeSections].sort((a: HomeSection, b: HomeSection) => a.sortOrder - b.sortOrder)
        : DEFAULT_HOME_SECTIONS;
      setSections(items);
      setOriginalSections(items);

      const matrix = data.skillMatrix && data.skillMatrix.rows.length > 0
        ? data.skillMatrix
        : DEFAULT_SKILL_MATRIX;
      setSkillMatrix(matrix);
      setOriginalSkillMatrix(matrix);
    } catch (e) {
      logger.error('load layout settings failed', e);
      toast.error('加载首页布局失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(originalSections);
    const matrixChanged = JSON.stringify(skillMatrix) !== JSON.stringify(originalSkillMatrix);
    setHasChanges(sectionsChanged || matrixChanged);
  }, [sections, originalSections, skillMatrix, originalSkillMatrix]);

  const reassignSortOrder = (items: HomeSection[]): HomeSection[] =>
    items.map((item: HomeSection, idx: number) => ({ ...item, sortOrder: idx }));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setSections(reassignSortOrder(next));
  };

  const toggleVisible = (index: number) => {
    const next = [...sections];
    next[index] = { ...next[index], isVisible: !next[index].isVisible };
    setSections(next);
  };

  const getSectionTitle = (section: HomeSection): string =>
    section.title || SECTION_LABELS[section.type] || section.type;

  const handleAddSection = () => {
    if (!newSectionType) return;
    const id = `section-${genId()}`;
    const newSection: HomeSection = {
      id,
      type: newSectionType,
      title: SECTION_LABELS[newSectionType] || newSectionType,
      isVisible: true,
      sortOrder: sections.length,
    };
    setSections([...sections, newSection]);
    setNewSectionType('');
  };

  const handleRemoveSection = (index: number) => {
    const next = sections.filter((_, i) => i !== index);
    setSections(reassignSortOrder(next));
  };

  const getCellLevel = (rowId: string, colId: string): 0 | 1 | 2 => {
    const cell = skillMatrix.cells.find(
      (c: SkillMatrixCell) => c.rowId === rowId && c.colId === colId
    );
    return cell?.level ?? 0;
  };

  const toggleCellLevel = (rowId: string, colId: string) => {
    const current = getCellLevel(rowId, colId);
    const nextLevel = ((current + 1) % 3) as 0 | 1 | 2;
    const otherCells = skillMatrix.cells.filter(
      (c: SkillMatrixCell) => !(c.rowId === rowId && c.colId === colId)
    );
    const nextCells = nextLevel > 0
      ? [...otherCells, { rowId, colId, level: nextLevel }]
      : otherCells;
    setSkillMatrix({ ...skillMatrix, cells: nextCells });
  };

  const addRow = () => {
    const id = `row-${genId()}`;
    setSkillMatrix({
      ...skillMatrix,
      rows: [...skillMatrix.rows, { id, label: '新行' }],
    });
  };

  const removeRow = (rowId: string) => {
    setSkillMatrix({
      ...skillMatrix,
      rows: skillMatrix.rows.filter((r) => r.id !== rowId),
      cells: skillMatrix.cells.filter((c: SkillMatrixCell) => c.rowId !== rowId),
    });
  };

  const updateRowLabel = (rowId: string, label: string) => {
    setSkillMatrix({
      ...skillMatrix,
      rows: skillMatrix.rows.map((r) =>
        r.id === rowId ? { ...r, label } : r
      ),
    });
  };

  const addCol = () => {
    const id = `col-${genId()}`;
    setSkillMatrix({
      ...skillMatrix,
      cols: [...skillMatrix.cols, { id, label: '新列' }],
    });
  };

  const removeCol = (colId: string) => {
    setSkillMatrix({
      ...skillMatrix,
      cols: skillMatrix.cols.filter((c) => c.id !== colId),
      cells: skillMatrix.cells.filter((c: SkillMatrixCell) => c.colId !== colId),
    });
  };

  const updateColLabel = (colId: string, label: string) => {
    setSkillMatrix({
      ...skillMatrix,
      cols: skillMatrix.cols.map((c) =>
        c.id === colId ? { ...c, label } : c
      ),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(originalSections);
      const matrixChanged = JSON.stringify(skillMatrix) !== JSON.stringify(originalSkillMatrix);

      const payload: { homeSections?: HomeSection[]; skillMatrix?: SkillMatrix } = {};
      if (sectionsChanged) payload.homeSections = sections;
      if (matrixChanged) payload.skillMatrix = skillMatrix;

      await settingsApi.updateSettings(payload);
      setOriginalSections(sections);
      setOriginalSkillMatrix(skillMatrix);
      toast.success('已保存');
    } catch (e) {
      logger.error('save layout settings failed', e);
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
          <h1 className="text-xl font-semibold text-[#1b1b1b]">首页布局管理</h1>
          <p className="text-sm text-[#5c5c5c] mt-1">
            配置首页各区块的展示顺序、显隐状态和内容
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="h-8 px-4 text-sm rounded-md bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] font-medium shadow-sm"
        >
          <Save className="size-4" />
          保存更改
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections">
            <LayoutGrid className="size-4" />
            区块管理
          </TabsTrigger>
          <TabsTrigger value="skill-matrix">
            <Grid3X3 className="size-4" />
            能力矩阵
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-5">
          <div className="space-y-4">
             <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[#d0d0d0] bg-[#f9f9f9]">
               <div className="flex size-9 items-center justify-center rounded-md bg-white border border-[#e5e5e5]">
                 <Layers className="size-4 text-[#5c5c5c]" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-semibold text-[#1b1b1b]">添加新区块</p>
                 <p className="text-xs text-[#5c5c5c]">选择一个区块类型添加到首页</p>
               </div>
               <div className="flex items-center gap-2">
                 <Select value={newSectionType} onValueChange={setNewSectionType}>
                   <SelectTrigger className="w-52 h-8 text-sm rounded-md border border-[#e5e5e5]">
                     <SelectValue placeholder="选择区块类型..." />
                   </SelectTrigger>
                   <SelectContent>
                     {SECTION_TYPE_OPTIONS.map((opt) => (
                       <SelectItem key={opt.value} value={opt.value}>
                         {opt.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 <Button
                   variant="outline"
                   onClick={handleAddSection}
                   disabled={!newSectionType}
                   className="h-8 px-4 text-sm rounded-md bg-white text-[#1b1b1b] border border-[#e5e5e5] hover:bg-[#f9f9f9] font-medium"
                 >
                   <Plus className="size-4" />
                   添加区块
                 </Button>
               </div>
             </div>

             <div className="space-y-3">
               {sections.map((section: HomeSection, index: number) => (
                 <div
                   key={section.id}
                   className={`group flex items-center gap-4 bg-white rounded-xl border border-[#e5e5e5] p-4 shadow-sm transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0_0_0_0.06)] hover:-translate-y-px ${
                     !section.isVisible ? 'opacity-50' : ''
                   }`}
                 >
                   <div className="flex flex-col items-center gap-1">
                     <div className="text-[#d0d0d0] cursor-grab">
                       <GripVertical className="size-4" />
                     </div>
                     <div className="flex flex-col gap-0.5">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => moveItem(index, 'up')}
                         disabled={index === 0 || saving}
                         className="size-6 text-[#8a8a8a] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
                         title="上移"
                       >
                         <ArrowUp className="size-3.5" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => moveItem(index, 'down')}
                         disabled={index === sections.length - 1 || saving}
                         className="size-6 text-[#8a8a8a] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md"
                         title="下移"
                       >
                         <ArrowDown className="size-3.5" />
                       </Button>
                     </div>
                   </div>

                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-base font-semibold text-[#1b1b1b]">
                         {getSectionTitle(section)}
                       </span>
                       {isSystemSection(section.id) ? (
                         <span className="inline-flex items-center rounded-full bg-[#deecf9] text-[#005fb8] border border-[#b8d6f0] px-2 py-0.5 text-xs font-medium">
                           系统区块
                         </span>
                       ) : (
                         <span className="inline-flex items-center rounded-full bg-[#f0f0f0] text-[#5c5c5c] border border-[#e0e0e0] px-2 py-0.5 text-xs font-medium">
                           自定义
                         </span>
                       )}
                       <span className="inline-flex items-center rounded-full bg-[#f0f0f0] text-[#5c5c5c] border border-[#e0e0e0] px-2 py-0.5 text-xs font-medium">
                         {section.type}
                       </span>
                     </div>
                     <p className="text-sm text-[#5c5c5c] mt-1">
                       排序位置：第 {index + 1} 位
                     </p>
                   </div>

                   <div className="flex items-center gap-2">
                     <Switch
                       checked={section.isVisible}
                       onCheckedChange={() => toggleVisible(index)}
                       disabled={saving}
                     />

                     <Button
                       variant="ghost"
                       size="icon"
                       disabled={saving}
                       className="size-8 text-[#5c5c5c] hover:text-[#1b1b1b] hover:bg-[#f2f2f2] rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                       title="编辑"
                     >
                       <Pencil className="size-4" />
                     </Button>

                     {!isSystemSection(section.id) && (
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemoveSection(index)}
                         disabled={saving}
                         className="size-8 text-[#c42b1c] hover:text-[#d13424] hover:bg-[#fbe4e1] rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                         title="删除"
                       >
                         <X className="size-4" />
                       </Button>
                     )}
                   </div>
                 </div>
               ))}

               {sections.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-[#e0e0e0] bg-[#f9f9f9]">
                   <LayoutGrid className="size-10 text-[#c0c0c0] mb-3" />
                   <p className="text-sm font-semibold text-[#1b1b1b]">暂无区块</p>
                   <p className="text-xs text-[#8a8a8a] mt-1">
                     从上方选择区块类型，添加到首页布局
                   </p>
                 </div>
               )}
             </div>
           </div>
        </TabsContent>

        <TabsContent value="skill-matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">能力矩阵</CardTitle>
              <CardDescription>
                配置能力矩阵的行（设计方向）与列（交付物类型），点击圆点切换熟练度：
                <span className="ml-1 inline-flex items-center gap-1">
                  <span className="size-2 rounded-full border border-gray-300" /> 不点亮
                  <span className="ml-2 size-2.5 rounded-full bg-gray-300" /> 初级
                  <span className="ml-2 size-3.5 rounded-full bg-gray-900" /> 熟练
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="w-40 p-2 text-left font-medium text-gray-500">
                        设计方向 / 交付物
                      </th>
                      {skillMatrix.cols.map((col) => (
                        <th key={col.id} className="min-w-20 p-2 text-center font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              value={col.label}
                              onChange={(e) => updateColLabel(col.id, e.target.value)}
                              className="h-8 text-center text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCol(col.id)}
                              className="size-6 text-gray-400 hover:text-destructive"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </th>
                      ))}
                      <th className="w-12 p-2 text-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={addCol}
                          className="size-7"
                          title="新增列"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillMatrix.rows.map((row) => (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <GripVertical className="size-3 text-gray-300" />
                            <Input
                              value={row.label}
                              onChange={(e) => updateRowLabel(row.id, e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(row.id)}
                              className="size-6 text-gray-400 hover:text-destructive"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </td>
                        {skillMatrix.cols.map((col) => {
                          const level = getCellLevel(row.id, col.id);
                          return (
                            <td key={col.id} className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleCellLevel(row.id, col.id)}
                                className="flex size-full items-center justify-center rounded p-2 transition-colors hover:bg-gray-50"
                                title={`点击切换 (当前: ${level === 0 ? '不点亮' : level === 1 ? '初级' : '熟练'})`}
                              >
                                {level === 0 && (
                                  <span className="size-2.5 rounded-full border border-gray-300" />
                                )}
                                {level === 1 && (
                                  <span className="size-3 rounded-full bg-gray-300" />
                                )}
                                {level === 2 && (
                                  <span className="size-4 rounded-full bg-gray-900" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td />
                      </tr>
                    ))}
                    <tr className="border-t border-gray-100">
                      <td colSpan={skillMatrix.cols.length + 2} className="p-2">
                        <Button variant="outline" onClick={addRow} className="w-full">
                          <Plus className="size-4" />
                          新增行
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LayoutAdminPage;
