import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Image } from '@client/src/components/ui/image';
import type { WorkImage } from '@shared/api.interface';

interface ImageLightboxProps {
  images: WorkImage[];
  initialIndex: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, initialIndex, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;
  const current = images[index];

  const goPrev = useCallback(() => { if (total <= 1) return; setIndex((i) => (i - 1 + total) % total); }, [total]);
  const goNext = useCallback(() => { if (total <= 1) return; setIndex((i) => (i + 1) % total); }, [total]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) { if (diff > 0) goPrev(); else goNext(); }
    touchStartX.current = null;
  };
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={handleBackdropClick} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} role="dialog" aria-modal="true" aria-label="图片查看器">
      <button type="button" onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white/80 hover:text-white transition-colors p-2" aria-label="关闭">
        <X size={24} />
      </button>
      {total > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2" aria-label="上一张">
          <ChevronLeft size={32} />
        </button>
      )}
      {total > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors p-2" aria-label="下一张">
          <ChevronRight size={32} />
        </button>
      )}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <Image src={current.url} alt={current.alt || ''} className="max-w-full max-h-[90vh] w-auto h-auto object-contain" loading="eager" />
      </div>
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">{index + 1} / {total}</div>
      )}
    </div>
  );
};

export default ImageLightbox;
