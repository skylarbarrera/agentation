export type {
  OutputDetailLevel,
  AnnotationColor,
  DemoAnnotation,
  Annotation,
  StorageKey,
  MarkdownOutput,
} from './annotation';

export { COLOR_OPTIONS } from './annotation';

export type {
  AgenationProps,
  AgentationProps,
  AnnotationMarkerProps,
  AnnotationPopupProps,
} from './props';

export type {
  CodeInfo,
  InspectInfo,
  ComponentDetection,
} from './detection';

export type { AgenationSettings } from './settings';
export { DEFAULT_SETTINGS } from './settings';

export { isAnnotation, isValidCodeInfo } from './guards';
