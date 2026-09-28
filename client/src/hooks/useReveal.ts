import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  once?: boolean;
}

/**
 * IntersectionObserver 驱动的滚动淡入动画 hook
 * - 元素进入视口时添加 fade-in-up 效果
 * - 默认仅触发一次（once: true）
 * - 配合全局 CSS class .reveal / .reveal-visible 使用
 *
 * 用法：
 *   const ref = useReveal<HTMLDivElement>();
 *   <div ref={ref} className="reveal">内容</div>
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): React.RefObject<T> {
  const ref = useRef<T>(null);
  const [, setVisible] = useState(false);

  useEffect(() => {
    const { threshold = 0.1, rootMargin = '0px 0px -40px 0px', delay = 0, once = true } = options;
    const el = ref.current;
    if (!el) return;

    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`;
    }

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            entry.target.classList.add('reveal-visible');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('reveal-visible');
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.delay, options.once]);

  return ref;
}
