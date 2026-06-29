import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export const useInfiniteScroll = ({
  hasNextPage,
  loading,
  onLoadMore,
  threshold = 0.8,
  rootMargin = '100px',
  enabled = true
}: UseInfiniteScrollOptions) => {
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleLoadMore = useCallback(() => {
    if (!enabled || loading || !hasNextPage) return;
    
    console.log('🔄 Loading more data via infinite scroll...');
    onLoadMore();
  }, [enabled, loading, hasNextPage, onLoadMore]);

  useEffect(() => {
    if (!enabled) return;

    const currentRef = loadingRef.current;
    if (!currentRef) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, rootMargin, handleLoadMore]);

  // Alternative scroll-based detection for better compatibility
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      if (loading || !hasNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage >= threshold) {
        handleLoadMore();
      }
    };

    const throttledScroll = throttle(handleScroll, 200);
    
    window.addEventListener('scroll', throttledScroll);
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [enabled, loading, hasNextPage, threshold, handleLoadMore]);

  return {
    loadingRef,
    isLoading: loading,
    hasMore: hasNextPage
  };
};

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}