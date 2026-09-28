import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { publicApi } from '@client/src/api';
import { useVisitorId } from '@client/src/hooks/useVisitorId';

interface FavoriteButtonProps {
  workId: string;
  initialFavorited?: boolean;
  initialCount: number;
  size?: 'sm' | 'md';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  workId,
  initialFavorited = false,
  initialCount,
  size = 'sm',
}) => {
  const visitorId = useVisitorId();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
    setCount(initialCount);
  }, [initialFavorited, initialCount]);

  useEffect(() => {
    if (!visitorId) return;
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await publicApi.getWorkFavoriteStatus(workId, visitorId);
        if (!cancelled) {
          setFavorited(res.favorited);
          setCount(res.favoriteCount);
        }
      } catch (e) {
        logger.error(`getWorkFavoriteStatus failed for ${workId}`, e);
      }
    }
    void loadStatus();
    return () => { cancelled = true; };
  }, [workId, visitorId]);

  const handleClick = useCallback(async () => {
    if (!visitorId) return;
    const prevFavorited = favorited;
    const prevCount = count;
    setFavorited(!prevFavorited);
    setCount(prevFavorited ? prevCount - 1 : prevCount + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    try {
      const res = await publicApi.toggleWorkFavorite(workId, visitorId);
      setFavorited(res.favorited);
      setCount(res.favoriteCount);
    } catch (e) {
      logger.error(`toggleWorkFavorite failed for ${workId}`, e);
      setFavorited(prevFavorited);
      setCount(prevCount);
    }
  }, [workId, visitorId, favorited, count]);

  const sizeClasses = size === 'md' ? 'text-base' : 'text-sm';
  const iconSize = size === 'md' ? 20 : 16;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors select-none"
      aria-label={favorited ? '取消收藏' : '收藏'}
    >
      <Star
        size={iconSize}
        className={`transition-transform ${favorited ? 'fill-yellow-400 text-yellow-400' : ''} ${animating ? 'scale-125' : 'scale-100'}`}
      />
      <span className={sizeClasses}>{count}</span>
    </button>
  );
};

export default FavoriteButton;
