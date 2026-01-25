/**
 * useAgentationScroll Hook
 * Enables scroll-aware annotation positioning
 *
 * Usage:
 * ```tsx
 * function MyScreen() {
 *   const { onScroll, scrollEventThrottle } = useAgentationScroll();
 *
 *   return (
 *     <ScrollView onScroll={onScroll} scrollEventThrottle={scrollEventThrottle}>
 *       {content}
 *     </ScrollView>
 *   );
 * }
 * ```
 *
 * Gracefully no-ops if:
 * - Not in __DEV__ mode
 * - No AgenationContext available
 */

import { useCallback, useContext } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { AgenationContext } from '../context/AgenationContext';

export interface UseAgentationScrollReturn {
  /** Pass to ScrollView's onScroll prop */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Pass to ScrollView's scrollEventThrottle prop */
  scrollEventThrottle: number;
}

// No-op return for production or when context unavailable
const NOOP_RETURN: UseAgentationScrollReturn = {
  onScroll: () => {},
  scrollEventThrottle: 16,
};

export function useAgentationScroll(): UseAgentationScrollReturn {
  // No-op in production
  if (!__DEV__) {
    return NOOP_RETURN;
  }

  // Try to get context (may be null if not wrapped in Agentation)
  const context = useContext(AgenationContext);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!context?.reportScrollOffset) return;

      const { contentOffset } = event.nativeEvent;
      context.reportScrollOffset(contentOffset.x, contentOffset.y);
    },
    [context]
  );

  // If no context, return no-op
  if (!context) {
    return NOOP_RETURN;
  }

  return {
    onScroll,
    scrollEventThrottle: 16, // ~60fps
  };
}
