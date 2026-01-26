export {
  detectComponent,
  formatElementPath,
  formatElementPathWithColumn,
  getComponentType,
  isComponentDetectionAvailable,
  getDetectionErrorMessage,
  detectComponentAtPoint,
} from './componentDetection';

export {
  generateMarkdown,
  generateSimpleMarkdown,
  generateSingleAnnotationMarkdown,
  canGenerateMarkdown,
  getMarkdownStats,
} from './markdownGeneration';

export {
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
  getAllAnnotationKeys,
  clearAllAnnotations,
  getStorageKey,
  saveSettings,
  loadSettings,
  resetSettings,
} from './storage';

export {
  getNavigationInfo,
  reactNavigationResolver,
  expoRouterResolver,
} from './navigationDetection';
export type { NavigationInfo, NavigationResolver } from './navigationDetection';

export {
  generateId,
  getTimestamp,
  copyToClipboard,
  getFromClipboard,
  formatDate,
  formatTime,
  truncate,
} from './helpers';

export {
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  TIMING,
  DELAYS,
} from './animations';

export { debugLog, debugWarn, debugError } from './debug';
