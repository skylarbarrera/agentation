/**
 * Agentation Native
 * Visual feedback tool for React Native
 *
 * API-compatible with web version (agentation)
 */

// =============================================================================
// Main Components
// =============================================================================

export { Agentation } from './components/Agentation';
export { AgenationView } from './components/AgenationView';
export type { AgenationViewProps } from './components/AgenationView';

// =============================================================================
// Types (Web API Parity)
// =============================================================================

export type {
  // Core types (matching web)
  Annotation,
  DemoAnnotation,
  OutputDetailLevel,

  // Props (matching web)
  AgenationProps,
  AgentationProps, // Web API alias

  // Plugin system
  AgentationPlugin,

  // Internal types
  AnnotationMarkerProps,
  AnnotationPopupProps,
  CodeInfo,
  InspectInfo,
  ComponentDetection,
  MarkdownOutput,
  StorageKey,
  AgenationSettings,
} from './types';

// Export DEFAULT_SETTINGS constant
export { DEFAULT_SETTINGS } from './types';

// Hooks
export { useAnnotations } from './hooks/useAnnotations';
export type { UseAnnotationsOptions, UseAnnotationsReturn } from './hooks/useAnnotations';
export { useAgentationScroll } from './hooks/useAgentationScroll';
export type { UseAgentationScrollReturn } from './hooks/useAgentationScroll';

// Context (for advanced usage)
export { AgenationContext } from './context/AgenationContext';
export type { AgenationContextValue } from './context/AgenationContext';

// =============================================================================
// Utilities (with Web API Aliases)
// =============================================================================

// Component detection
export {
  detectComponent,
  formatElementPath,
  formatElementPathWithColumn,
  getComponentType,
  isComponentDetectionAvailable,
  getDetectionErrorMessage,
  // Coordinate-based detection
  detectComponentAtPoint,
} from './utils/componentDetection';

// Web API aliases for component detection
export {
  detectComponent as identifyElement, // Web parity
  formatElementPath as getElementPath, // Web parity
} from './utils/componentDetection';

// Markdown generation
export {
  generateMarkdown,
  generateSimpleMarkdown,
  generateSingleAnnotationMarkdown,
  canGenerateMarkdown,
  getMarkdownStats,
} from './utils/markdownGeneration';

// Storage
export {
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
  getAllAnnotationKeys,
  clearAllAnnotations,
  getStorageKey,
  // Settings (Web API Parity)
  saveSettings,
  loadSettings,
  resetSettings,
} from './utils/storage';

// Navigation detection (pluggable)
export {
  getNavigationInfo,
  reactNavigationResolver,
  expoRouterResolver,
} from './utils/navigationDetection';
export type { NavigationInfo, NavigationResolver } from './utils/navigationDetection';

// Helpers
export {
  generateId,
  getTimestamp,
  copyToClipboard,
  getFromClipboard,
  formatDate,
  formatTime,
  truncate,
} from './utils/helpers';

// =============================================================================
// Type Guards
// =============================================================================

export { isAnnotation, isValidCodeInfo } from './types';
