/**
 * AgenationContext
 * Provides communication channel between Agentation wrapper and child hooks/components
 *
 * Used by:
 * - useAgentationScroll: Reports scroll offset for marker position adjustment
 * - AgenationView: Could sync annotations with parent (future)
 */

import { createContext } from 'react';

export interface AgenationContextValue {
  /** Report scroll offset from a ScrollView */
  reportScrollOffset: (x: number, y: number) => void;
  /** Current scroll offset */
  scrollOffset: { x: number; y: number };
  /** Whether annotation mode is active */
  isAnnotationMode: boolean;
  /** Whether dark mode is enabled (for toolbar/popup theming) */
  isDarkMode: boolean;
  /** Toggle dark mode */
  setIsDarkMode: (value: boolean) => void;
}

/**
 * Context is null when:
 * - Not wrapped in <Agentation>
 * - In production mode (__DEV__ = false)
 *
 * Consumers should handle null gracefully (no-op)
 */
export const AgenationContext = createContext<AgenationContextValue | null>(null);
