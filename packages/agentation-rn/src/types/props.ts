import type { Annotation, DemoAnnotation } from './annotation';

export interface AgenationProps {
  children: React.ReactNode;
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
  copyToClipboard?: boolean;
  disabled?: boolean;
  storageKey?: string;
  onAnnotationModeEnabled?: () => void;
  onAnnotationModeDisabled?: () => void;
  zIndexBase?: number;
  toolbarOffset?: {
    x?: number;
    y?: number;
  };
  theme?: {
    primary?: string;
    success?: string;
    danger?: string;
  };
  onAnnotationCreated?: (annotation: Annotation) => void;
  onAnnotationUpdated?: (annotation: Annotation) => void;
  onAnnotationDeleted?: (annotationId: string) => void;
  onMarkdownCopied?: (markdown: string) => void;
}

export type AgentationProps = AgenationProps;

export interface AnnotationMarkerProps {
  annotation: Annotation;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export interface AnnotationPopupProps {
  annotation: Annotation | null;
  position: { x: number; y: number };
  visible: boolean;
  onSave: (comment: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}
