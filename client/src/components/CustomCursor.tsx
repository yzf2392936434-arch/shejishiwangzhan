import React, { useEffect, useRef, useState } from 'react';

type CursorStyle = 'none' | 'ring' | 'heart' | 'star' | 'brush' | 'neon';

interface CustomCursorProps {
  style: string;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ style }) => {
  const cursorStyle = style as CursorStyle;
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const outerPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const [isClickable, setIsClickable] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const trailRef = useRef<{ x: number; y: number; id: number }[]>([]);
  const trailIdRef = useRef(0);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    if (cursorStyle === 'none') return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;
    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (innerRef.current) {
        innerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"], input, textarea, select, label');
      setIsClickable(!!clickable);
      if (cursorStyle === 'neon') {
        trailIdRef.current += 1;
        const point = { x: e.clientX, y: e.clientY, id: trailIdRef.current };
        trailRef.current = [...trailRef.current.slice(-8), point];
        setTrail([...trailRef.current]);
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    let rafId: number;
    const animate = () => {
      const dx = targetPos.current.x - outerPos.current.x;
      const dy = targetPos.current.y - outerPos.current.y;
      outerPos.current.x += dx * 0.15;
      outerPos.current.y += dy * 0.15;
      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${outerPos.current.x}px, ${outerPos.current.y}px, 0)`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, [cursorStyle]);

  if (cursorStyle === 'none') return null;

  const renderOuter = () => {
    const size = isClickable ? 44 : 32;
    const clickScale = isClicking ? 0.85 : 1;
    switch (cursorStyle) {
      case 'ring':
        return (
          <div
            ref={outerRef}
            className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/60 transition-[width,height,transform] duration-150 ease-out"
            style={{ width: size, height: size, transform: `translate(-50%, -50%) scale(${clickScale})` }}
          />
        );
      case 'heart':
        return (
          <div ref={outerRef} className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out" style={{ transform: `translate(-50%, -50%) scale(${clickScale})` }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="hsl(var(--primary) / 0.6)">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case 'star':
        return (
          <div ref={outerRef} className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out" style={{ transform: `translate(-50%, -50%) scale(${clickScale})` }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="hsl(var(--primary) / 0.6)">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        );
      case 'brush':
        return (
          <div ref={outerRef} className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out" style={{ transform: `translate(-50%, -50%) scale(${clickScale}) rotate(-45deg)` }}>
            <svg width={size} height={size} viewBox="0 0 24 24" fill="hsl(var(--primary) / 0.6)">
              <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
            </svg>
          </div>
        );
      case 'neon':
        return (
          <>
            {trail.map((p, i) => (
              <div key={p.id} className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full"
                style={{ width: 8 + i, height: 8 + i, transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`, opacity: (i + 1) / trail.length * 0.4, background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)', transition: 'opacity 0.3s ease-out' }} />
            ))}
            <div ref={outerRef} className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full transition-[width,height] duration-150 ease-out"
              style={{ width: size, height: size, transform: `translate(-50%, -50%) scale(${clickScale})`, background: 'radial-gradient(circle, hsl(var(--primary) / 0.8) 0%, transparent 70%)', boxShadow: `0 0 ${size}px hsl(var(--primary) / 0.6)` }} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderOuter()}
      {cursorStyle !== 'neon' && (
        <div ref={innerRef} className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-transform duration-75"
          style={{ width: isClickable ? 6 : 4, height: isClickable ? 6 : 4, transform: 'translate(-50%, -50%)' }} />
      )}
    </>
  );
};

export default CustomCursor;
