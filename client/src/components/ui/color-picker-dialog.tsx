import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hexToHsl, hslToHex, hexToRgb, rgbToHex, isValidHex, type HslColor, type RgbColor } from '@client/src/utils/color';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';

interface SwatchGroup {
  id: string;
  name: string;
  colors: string[];
}

const PRESET_SWATCH_GROUPS: SwatchGroup[] = [
  { id: 'basic', name: '基础黑白灰', colors: ['#000000', '#1a1a1a', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#d4d4d4', '#e5e5e5', '#f5f5f5', '#fafafa', '#ffffff'] },
  { id: 'morandi', name: '莫兰迪浅色', colors: ['#b0a8b9', '#a8b5a0', '#b9a8a0', '#a0b5b0', '#b5b0a0', '#a0a8b5', '#d4c5b9', '#c5b9d4', '#b9d4c5', '#d4b9c5', '#c5d4b9', '#b9c5d4'] },
  { id: 'vibrant', name: '高饱和亮色', colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'] },
  { id: 'dark', name: '深色系', colors: ['#7f1d1d', '#7c2d12', '#78350f', '#365314', '#14532d', '#134e4a', '#164e63', '#1e3a8a', '#312e81', '#4c1d95', '#701a75', '#831843'] },
];

const CUSTOM_SWATCH_KEY = 'portfolio_custom_swatches';

function loadCustomSwatches(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SWATCH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((c: unknown) => typeof c === 'string' && isValidHex(c));
      }
    }
  } catch {}
  return [];
}

function saveCustomSwatches(colors: string[]): void {
  try {
    localStorage.setItem(CUSTOM_SWATCH_KEY, JSON.stringify(colors));
  } catch {}
}

interface ColorPickerDialogProps {
  open: boolean;
  initialColor: string;
  title?: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
  onAddToSwatches?: (color: string) => void;
}

const SQUARE_SIZE = 240;
const HUE_WIDTH = 24;
const HUE_HEIGHT = 240;

export const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({
  open,
  initialColor,
  title = '拾色器',
  onConfirm,
  onCancel,
}) => {
  const [hsl, setHsl] = useState<HslColor>({ h: 0, s: 100, l: 50 });
  const [hexInput, setHexInput] = useState('');
  const [rgbInput, setRgbInput] = useState<RgbColor>({ r: 0, g: 0, b: 0 });
  const [currentColor, setCurrentColor] = useState('#000000');
  const [activeGroup, setActiveGroup] = useState('basic');
  const [customSwatches, setCustomSwatches] = useState<string[]>([]);
  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const squareDragging = useRef(false);
  const hueDragging = useRef(false);

  useEffect(() => {
    if (open) {
      const color = initialColor || '#000000';
      const h = hexToHsl(color);
      const r = hexToRgb(color);
      setHsl(h);
      setRgbInput(r);
      setHexInput(color.replace('#', ''));
      setCurrentColor(color);
      setCustomSwatches(loadCustomSwatches());
    }
  }, [open, initialColor]);

  const newColor = useMemo(() => hslToHex(hsl.h, hsl.s, hsl.l), [hsl]);

  const updateFromHsl = useCallback((newHsl: HslColor) => {
    const clamped = {
      h: ((newHsl.h % 360) + 360) % 360,
      s: Math.max(0, Math.min(100, newHsl.s)),
      l: Math.max(0, Math.min(100, newHsl.l)),
    };
    setHsl(clamped);
    const rgb = hexToRgb(hslToHex(clamped.h, clamped.s, clamped.l));
    setRgbInput(rgb);
    setHexInput(hslToHex(clamped.h, clamped.s, clamped.l).replace('#', ''));
  }, []);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    const rr = Math.max(0, Math.min(255, Math.round(r)));
    const gg = Math.max(0, Math.min(255, Math.round(g)));
    const bb = Math.max(0, Math.min(255, Math.round(b)));
    const h = rgbToHex(rr, gg, bb);
    const hslVal = hexToHsl(h);
    setHsl(hslVal);
    setRgbInput({ r: rr, g: gg, b: bb });
    setHexInput(h.replace('#', ''));
  }, []);

  const updateFromHex = useCallback((hex: string) => {
    const clean = hex.replace('#', '').trim();
    if (isValidHex(clean)) {
      const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
      const h = `#${full}`;
      const hslVal = hexToHsl(h);
      setHsl(hslVal);
      setRgbInput(hexToRgb(h));
      setHexInput(full);
    } else {
      setHexInput(clean);
    }
  }, []);

  const handleSquareDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    squareDragging.current = true;
    updateSquareFromEvent(e.nativeEvent);
  }, []);

  const updateSquareFromEvent = useCallback((e: MouseEvent | React.MouseEvent['nativeEvent']) => {
    if (!squareRef.current) return;
    const rect = squareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = (x / rect.width) * 100;
    const l = (1 - y / rect.height) * 100;
    updateFromHsl({ h: hsl.h, s, l });
  }, [hsl.h, updateFromHsl]);

  const handleHueDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    hueDragging.current = true;
    updateHueFromEvent(e.nativeEvent);
  }, []);

  const updateHueFromEvent = useCallback((e: MouseEvent | React.MouseEvent['nativeEvent']) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const h = (y / rect.height) * 360;
    updateFromHsl({ h, s: hsl.s, l: hsl.l });
  }, [hsl.s, hsl.l, updateFromHsl]);

  useEffect(() => {
    if (!open) return;
    const handleMove = (e: MouseEvent) => {
      if (squareDragging.current) updateSquareFromEvent(e);
      if (hueDragging.current) updateHueFromEvent(e);
    };
    const handleUp = () => {
      squareDragging.current = false;
      hueDragging.current = false;
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [open, updateSquareFromEvent, updateHueFromEvent]);

  const handleConfirm = () => {
    onConfirm(newColor);
  };

  const handleAddToSwatches = () => {
    const next = [...customSwatches, newColor];
    setCustomSwatches(next);
    saveCustomSwatches(next);
    setActiveGroup('custom');
  };

  const handleRemoveCustomSwatch = (index: number) => {
    const next = customSwatches.filter((_, i) => i !== index);
    setCustomSwatches(next);
    saveCustomSwatches(next);
  };

  const handleSwatchClick = (color: string) => {
    updateFromHex(color);
  };

  const allGroups = useMemo<SwatchGroup[]>(() => {
    const groups = [...PRESET_SWATCH_GROUPS];
    if (customSwatches.length > 0 || activeGroup === 'custom') {
      groups.push({ id: 'custom', name: '自定义', colors: customSwatches });
    }
    return groups;
  }, [customSwatches, activeGroup]);

  const currentGroupColors = useMemo(() => {
    const group = allGroups.find((g) => g.id === activeGroup);
    return group?.colors ?? [];
  }, [allGroups, activeGroup]);

  if (!open) return null;

  const squareLeft = (hsl.s / 100) * SQUARE_SIZE;
  const squareTop = (1 - hsl.l / 100) * SQUARE_SIZE;
  const hueTop = (hsl.h / 360) * HUE_HEIGHT;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-neutral-800 text-neutral-100 rounded-lg shadow-2xl w-[560px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-700">
          <h3 className="text-sm font-medium">{title}</h3>
          <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-white transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 flex gap-4">
          <div
            ref={squareRef}
            className="relative cursor-crosshair rounded-sm overflow-hidden flex-shrink-0 border border-neutral-600"
            style={{
              width: SQUARE_SIZE,
              height: SQUARE_SIZE,
              backgroundColor: `hsl(${hsl.h}, 100%, 50%)`,
              backgroundImage: 'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)',
            }}
            onMouseDown={handleSquareDown}
          >
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg pointer-events-none"
              style={{
                left: squareLeft,
                top: squareTop,
                backgroundColor: newColor,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          <div
            ref={hueRef}
            className="relative cursor-row-resize rounded-sm overflow-hidden flex-shrink-0 border border-neutral-600"
            style={{
              width: HUE_WIDTH,
              height: HUE_HEIGHT,
              background: 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            }}
            onMouseDown={handleHueDown}
          >
            <div className="absolute left-0 right-0 h-1.5 -translate-y-1/2 pointer-events-none" style={{ top: hueTop }}>
              <div className="h-full w-full border-y-2 border-white shadow-md" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-1">当前</p>
                <div className="h-8 rounded-sm border border-neutral-600" style={{ backgroundColor: currentColor }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-400 mb-1">新的</p>
                <div className="h-8 rounded-sm border border-neutral-600" style={{ backgroundColor: newColor }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">H</span>
                <Input type="number" size={1} value={Math.round(hsl.h)} onChange={(e) => updateFromHsl({ ...hsl, h: Number(e.target.value) })} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
                <span className="text-neutral-500 text-[10px]">°</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">S</span>
                <Input type="number" value={Math.round(hsl.s)} onChange={(e) => updateFromHsl({ ...hsl, s: Number(e.target.value) })} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
                <span className="text-neutral-500 text-[10px]">%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">L</span>
                <Input type="number" value={Math.round(hsl.l)} onChange={(e) => updateFromHsl({ ...hsl, l: Number(e.target.value) })} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
                <span className="text-neutral-500 text-[10px]">%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">R</span>
                <Input type="number" value={rgbInput.r} onChange={(e) => updateFromRgb(Number(e.target.value), rgbInput.g, rgbInput.b)} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">G</span>
                <Input type="number" value={rgbInput.g} onChange={(e) => updateFromRgb(rgbInput.r, Number(e.target.value), rgbInput.b)} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-neutral-400 w-4">B</span>
                <Input type="number" value={rgbInput.b} onChange={(e) => updateFromRgb(rgbInput.r, rgbInput.g, Number(e.target.value))} className="h-7 text-xs bg-neutral-700 border-neutral-600 text-white px-2" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400">#</span>
              <Input
                type="text"
                value={hexInput}
                onChange={(e) => updateFromHex(e.target.value)}
                onBlur={(e) => {
                  if (isValidHex(e.target.value)) {
                    const clean = e.target.value.replace('#', '');
                    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
                    setHexInput(full);
                  } else {
                    setHexInput(newColor.replace('#', ''));
                  }
                }}
                className="h-8 text-sm bg-neutral-700 border-neutral-600 text-white font-mono tracking-wider"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1 flex-wrap">
              {allGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn('px-2 py-1 text-xs rounded transition-colors', activeGroup === group.id ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-700')}
                >
                  {group.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddToSwatches}
              className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 rounded transition-colors"
              title="添加到色板"
            >
              <Plus className="size-3.5" />
              添加到色板
            </button>
          </div>
          <div className="bg-neutral-900 rounded-sm p-2 min-h-[40px]">
            <div className="flex flex-wrap gap-1">
              {currentGroupColors.map((color, idx) => (
                <div key={`${color}-${idx}`} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleSwatchClick(color)}
                    className="w-6 h-6 rounded-sm border border-neutral-700 hover:border-white transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  {activeGroup === 'custom' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomSwatch(idx);
                      }}
                      className="absolute -top-1 -right-1 size-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {currentGroupColors.length === 0 && (
                <p className="text-xs text-neutral-500 py-2 px-1">暂无色板，点击"添加到色板"保存颜色</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-700 bg-neutral-900/50">
          <Button variant="outline" size="sm" onClick={onCancel} className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600">
            取消
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            确定
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerDialog;
