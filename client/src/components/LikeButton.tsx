import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { publicApi } from '@client/src/api';
import { useVisitorId } from '@client/src/hooks/useVisitorId';

interface LikeButtonProps {
  workId: string;
  initialLiked?: boolean;
  initialCount: number;
  size?: 'sm' | 'md';
}

const LikeButton: React.FC<LikeButtonProps> = ({ workId, initialLiked = false, initialCount, size = 'sm' }) => {
  const visitorId = useVisitorId();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  useEffect(() => {
    if (!visitorId) return;
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await publicApi.getWorkLikeStatus(workId, visitorId);
        if (!cancelled) { setLiked(res.liked); setCount(res.likeCount); }
      } catch (e) {
        logger.error(`getWorkLikeStatus failed for ${workId}`, e);
      }
    }
    void loadStatus();
    return () => { cancelled = true; };
  }, [workId, visitorId]);

  const handleClick = useCallback(async () => {
    if (!visitorId) return;
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    try {
      const res = await publicApi.toggleWorkLike(workId, visitorId);
      setLiked(res.liked);
      setCount(res.likeCount);
    } catch (e) {
      logger.error(`toggleWorkLike failed for ${workId}`, e);
      setLiked(prevLiked);
      setCount(prevCount);
    }
  }, [workId, visitorId, liked, count]);

  const sizeClasses = size === 'md' ? 'text-base' : 'text-sm';
  const iconSize = size === 'md' ? 20 : 16;

  return (
    <button type="button" onClick={handleClick} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors select-none" aria-label={liked ? '取消点赞' : '点赞'}>
      <Heart size={iconSize} className={`transition-transform ${liked ? 'fill-red-500 text-red-500' : ''} ${animating ? 'scale-125' : 'scale-100'}`} />
      <span className={sizeClasses}>{count}</span>
    </button>
  );
};

export default LikeButton;
