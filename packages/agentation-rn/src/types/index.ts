/**
 * Agentation Native - Type Definitions
 * API-compatible with web version (agentation)
 *
 * Key Differences from Web:
 * - Uses source paths instead of CSS selectors
 * - No DOM-specific fields (cssClasses, computedStyles)
 * - Added RN-specific fields (componentType, testID, navigation)
 * - Uses React Native component types
 */

// =============================================================================
// Output Detail Levels (Web API Parity)
// =============================================================================

/**
 * Output detail level for markdown generation
 * Matches web version's OutputDetailLevel
 */
export type OutputDetailLevel = 'compact' | 'standard' | 'detailed' | 'forensic';

// =============================================================================
// Color Options (Web API Parity)
// =============================================================================

/**
 * Available annotation marker colors
 * Matches web version's COLOR_OPTIONS
 */
export const COLOR_OPTIONS = [
  { value: '#AF52DE', label: 'Purple' },
  { value: '#3c82f7', label: 'Blue' },
  { value: '#5AC8FA', label: 'Cyan' },
  { value: '#34C759', label: 'Green' },
  { value: '#FFD60A', label: 'Yellow' },
  { value: '#FF9500', label: 'Orange' },
  { value: '#FF3B30', label: 'Red' },
] as const;

export type AnnotationColor = typeof COLOR_OPTIONS[number]['value'];

// =============================================================================
// Demo Annotation Type (Web API Parity)
// =============================================================================

/**
 * Demo annotation for pre-populating examples
 * Matches web version's DemoAnnotation
 *
 * Web uses CSS selectors, RN uses component paths
 */
export type DemoAnnotation = {
  /** Component path (e.g., "Button.tsx:42") or testID */
  selector: string;
  /** Comment/feedback to display */
  comment: string;
  /** Optional selected text */
  selectedText?: string;
};

// =============================================================================
// Core Types
// =============================================================================

/**
 * Main annotation data structure
 * API-compatible with web version
 */
export interface Annotation {
  /** Unique identifier for this annotation */
  id: string;

  /** X coordinate in screen pixels (from tap event) */
  x: number;

  /** Y coordinate in screen pixels (from tap event) */
  y: number;

  /** User's feedback/comment */
  comment: string;

  /** Component display name (e.g., "CustomButton", "TouchableOpacity") */
  element: string;

  /**
   * Source code location
   * Format: "src/components/Button.tsx:42"
   * Extracted from react-native-dev-inspector's CodeInfo
   */
  elementPath: string;

  /** When this annotation was created (Unix timestamp) */
  timestamp: number;

  // ==========================================================================
  // React Native Specific Fields (New)
  // ==========================================================================

  /**
   * React Native component type (e.g., "TouchableOpacity", "View", "Text")
   * Falls back to "Unknown" if component type cannot be determined
   */
  componentType?: string;

  /**
   * Source file path (relative)
   * Example: "src/components/Form.tsx"
   * Extracted from Dev Inspector's CodeInfo.relativePath
   */
  sourcePath?: string;

  /**
   * Line number in source file
   * Example: 42
   * Extracted from Dev Inspector's CodeInfo.lineNumber
   */
  lineNumber?: number;

  /**
   * Column number in source file (optional)
   * Example: 5
   * Extracted from Dev Inspector's CodeInfo.columnNumber
   */
  columnNumber?: number;

  /**
   * Component's testID if available
   * Useful as fallback when source path unavailable
   */
  testID?: string;

  // ==========================================================================
  // Optional Fields (from Web, may be useful)
  // ==========================================================================

  /**
   * Selected text content from Text component
   * Currently component-level only (no text range selection in v1)
   */
  selectedText?: string;

  /**
   * Component bounds in screen coordinates
   * From measureInWindow() API
   */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Text content near the tapped location
   * Helps identify the component in markdown output
   */
  nearbyText?: string;

  /**
   * Nearby sibling component names for context
   * Web parity: helps identify element location
   * Example: "Button, Text, View"
   */
  nearbyElements?: string;

  /**
   * Full component hierarchy path
   * Web parity: equivalent to web's full DOM path
   * Example: "Screen > ScrollView > Form > View > Button"
   */
  fullPath?: string;

  /**
   * Accessibility label if present
   * Useful for identifying components and ensuring accessibility
   */
  accessibility?: string;

  /**
   * Parent component names for context
   * Example: ["Screen", "ScrollView", "Form"]
   */
  parentComponents?: string[];

  /**
   * Multi-select flag (reserved for future use)
   * Not implemented in v1 due to gesture conflicts
   */
  isMultiSelect?: boolean;

  /**
   * Whether component has fixed/absolute positioning
   * Web parity: true if element has fixed/sticky positioning
   * In RN: true if using position: 'absolute' at screen level
   */
  isFixed?: boolean;

  // ==========================================================================
  // Navigation & Context Fields (RN equivalent of web's URL/location)
  // ==========================================================================

  /**
   * Current navigation route name
   * RN equivalent of web's window.location.pathname
   * Example: "HomeScreen", "Settings"
   */
  routeName?: string;

  /**
   * Route params if any
   * RN equivalent of web's URL query params
   * Example: { userId: "123", tab: "settings" }
   */
  routeParams?: Record<string, unknown>;

  /**
   * Full navigation path/state
   * RN equivalent of web's full URL
   * Example: "Root/Main/Settings/Profile"
   */
  navigationPath?: string;

  // ==========================================================================
  // Device & Environment Context
  // ==========================================================================

  /**
   * Platform (ios/android)
   */
  platform?: 'ios' | 'android' | 'web';

  /**
   * Screen dimensions at time of annotation
   */
  screenDimensions?: {
    width: number;
    height: number;
  };

  /**
   * Device pixel ratio
   */
  pixelRatio?: number;
}

// =============================================================================
// Component Props (Based on Web Version)
// =============================================================================

/**
 * Props for the main <Agentation> component
 * Wraps the app to enable annotation mode
 *
 * API-compatible with web version (agentation)
 */
export interface AgenationProps {
  /** Child components to wrap (RN-specific, web renders floating) */
  children: React.ReactNode;

  // ==========================================================================
  // Web API Parity - Demo Mode
  // ==========================================================================

  /**
   * Demo annotations to pre-populate
   * Web parity: uses DemoAnnotation[] type
   */
  demoAnnotations?: DemoAnnotation[];

  /**
   * Delay before showing demo annotations (ms)
   * Web parity: default 1000
   */
  demoDelay?: number;

  /**
   * Enable demo mode for showcasing
   * Web parity: default false
   */
  enableDemoMode?: boolean;

  // ==========================================================================
  // Web API Parity - Callbacks (matching web naming)
  // ==========================================================================

  /**
   * Callback when annotation is added
   * Web parity: matches onAnnotationAdd
   */
  onAnnotationAdd?: (annotation: Annotation) => void;

  /**
   * Callback when annotation is deleted
   * Web parity: matches onAnnotationDelete
   */
  onAnnotationDelete?: (annotation: Annotation) => void;

  /**
   * Callback when annotation is updated
   * Web parity: matches onAnnotationUpdate
   */
  onAnnotationUpdate?: (annotation: Annotation) => void;

  /**
   * Callback when all annotations are cleared
   * Web parity: receives array of cleared annotations
   */
  onAnnotationsClear?: (annotations: Annotation[]) => void;

  /**
   * Callback when copy button is clicked
   * Web parity: receives markdown output
   */
  onCopy?: (markdown: string) => void;

  /**
   * Whether to copy to clipboard when copy button is clicked
   * Web parity: default true
   */
  copyToClipboard?: boolean;

  // ==========================================================================
  // RN-Specific Props (extensions to web API)
  // ==========================================================================

  /**
   * Completely disable Agentation (won't render any UI)
   * RN-specific: useful for production builds
   */
  disabled?: boolean;

  /**
   * Custom storage key for AsyncStorage
   * RN-specific: defaults to current screen name
   */
  storageKey?: string;

  /**
   * Callback when annotation mode is enabled
   * RN-specific: for tracking mode state
   */
  onAnnotationModeEnabled?: () => void;

  /**
   * Callback when annotation mode is disabled
   * RN-specific: for tracking mode state
   */
  onAnnotationModeDisabled?: () => void;

  /**
   * Z-index base for overlays
   * RN-specific: default 9999
   */
  zIndexBase?: number;

  /**
   * Toolbar position offset from default
   * Use to avoid covering tab bars or other UI elements
   * RN-specific
   */
  toolbarOffset?: {
    /** Horizontal offset (positive = left, negative = right) */
    x?: number;
    /** Vertical offset (positive = up from bottom) */
    y?: number;
  };

  /**
   * Theme configuration
   * RN-specific: for custom styling
   */
  theme?: {
    primary?: string;
    success?: string;
    danger?: string;
  };

  // ==========================================================================
  // Deprecated - Use web-compatible names above
  // ==========================================================================

  /**
   * @deprecated Use onAnnotationAdd instead
   */
  onAnnotationCreated?: (annotation: Annotation) => void;

  /**
   * @deprecated Use onAnnotationUpdate instead
   */
  onAnnotationUpdated?: (annotation: Annotation) => void;

  /**
   * @deprecated Use onAnnotationDelete instead
   */
  onAnnotationDeleted?: (annotationId: string) => void;

  /**
   * @deprecated Use onCopy instead
   */
  onMarkdownCopied?: (markdown: string) => void;
}

/**
 * Web API alias for AgenationProps
 * Matches web package export name
 */
export type AgentationProps = AgenationProps;

/**
 * Props for annotation marker components
 */
export interface AnnotationMarkerProps {
  /** The annotation data */
  annotation: Annotation;

  /** Index in the annotations array */
  index: number;

  /** Whether this marker is currently selected */
  isSelected: boolean;

  /** Callback when marker is tapped */
  onPress: () => void;

  /** Callback when marker is long-pressed (delete) */
  onLongPress?: () => void;
}

/**
 * Props for annotation popup/editor
 */
export interface AnnotationPopupProps {
  /** Annotation being edited (null for new annotation) */
  annotation: Annotation | null;

  /** Position to show popup */
  position: { x: number; y: number };

  /** Whether popup is visible */
  visible: boolean;

  /** Callback when annotation is saved */
  onSave: (comment: string) => void;

  /** Callback when popup is closed without saving */
  onCancel: () => void;

  /** Callback when annotation is deleted */
  onDelete?: () => void;
}

// =============================================================================
// Dev Inspector Integration Types (From react-native-dev-inspector)
// =============================================================================

/**
 * Re-export types from react-native-dev-inspector for convenience
 * These match the types we validated in Week 0
 */

/**
 * Code information from Dev Inspector
 * This is what we get from getCodeInfoFromFiber()
 */
export interface CodeInfo {
  /** Relative path to source file */
  relativePath: string;

  /** Absolute path (optional) */
  absolutePath?: string;

  /** Line number (1-indexed) */
  lineNumber: number;

  /** Column number (1-indexed) */
  columnNumber?: number;

  /** Component name */
  componentName?: string;
}

/**
 * Inspection info from Dev Inspector
 * Returned by findNearestUserComponentWithSource()
 */
export interface InspectInfo {
  /** Component display name */
  name: string;

  /** Source code information */
  codeInfo: CodeInfo | null;

  /** React fiber node (internal) */
  fiber: unknown;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Annotation storage key format
 * Uses screen name for namespacing
 */
export type StorageKey = `@agentation:${string}`;

/**
 * Markdown output format
 * Generated from annotations
 */
export interface MarkdownOutput {
  /** Full markdown string */
  content: string;

  /** Number of annotations included */
  count: number;

  /** Screen name */
  screen: string;

  /** Generation timestamp */
  timestamp: number;
}

/**
 * Component detection result
 * Returned by tap handler
 */
export interface ComponentDetection {
  /** Whether component was successfully detected */
  success: boolean;

  /** Code info if successful */
  codeInfo: CodeInfo | null;

  /** Component bounds if successful */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;

  /** Error message if failed */
  error?: string;

  /** Parent component names from hierarchy */
  parentComponents?: string[];

  /** Accessibility label if found */
  accessibility?: string;

  /** testID if found */
  testID?: string;

  /** Text content from component */
  textContent?: string;

  // ==========================================================================
  // Web Parity Fields
  // ==========================================================================

  /**
   * Full component hierarchy path
   * Web parity: equivalent to web's full DOM path
   * Example: "Screen > ScrollView > Form > Button"
   */
  fullPath?: string;

  /**
   * Nearby sibling component names
   * Web parity: helps identify element location
   * Example: "Button, Text, View"
   */
  nearbyElements?: string;

  /**
   * Whether component has fixed/absolute positioning
   * Web parity: true if using position: 'absolute'
   */
  isFixed?: boolean;
}

// =============================================================================
// Settings/Configuration
// =============================================================================

/**
 * Agentation settings
 * Stored in AsyncStorage for persistence
 * Web parity: includes outputDetail and clearAfterCopy
 */
export interface AgenationSettings {
  // ==========================================================================
  // Web API Parity Settings
  // ==========================================================================

  /**
   * Output detail level for markdown generation
   * Web parity: compact | standard | detailed | forensic
   * Default: 'standard'
   */
  outputDetail: OutputDetailLevel;

  /**
   * Clear annotations after copying
   * Web parity: default false
   */
  clearAfterCopy: boolean;

  /**
   * Annotation marker color
   * Web parity: hex color string
   * Default: '#3c82f7' (Blue)
   */
  annotationColor: string;

  // ==========================================================================
  // RN-Specific Settings
  // ==========================================================================

  /** Whether to auto-save annotations */
  autoSave: boolean;

  /** Retention period in days */
  retentionDays: number;

  /** Whether to include component bounds in output */
  includeComponentBounds: boolean;

  /** Whether to include accessibility info */
  includeAccessibility: boolean;

  /** Custom markdown template */
  markdownTemplate?: string;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AgenationSettings = {
  outputDetail: 'standard',
  clearAfterCopy: false,
  annotationColor: '#3c82f7',
  autoSave: true,
  retentionDays: 7,
  includeComponentBounds: true,
  includeAccessibility: true,
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if an object is a valid Annotation
 */
export function isAnnotation(obj: unknown): obj is Annotation {
  if (!obj || typeof obj !== 'object') return false;

  const ann = obj as Partial<Annotation>;

  return (
    typeof ann.id === 'string' &&
    typeof ann.x === 'number' &&
    typeof ann.y === 'number' &&
    typeof ann.comment === 'string' &&
    typeof ann.element === 'string' &&
    typeof ann.elementPath === 'string' &&
    typeof ann.timestamp === 'number'
  );
}

/**
 * Check if CodeInfo has required fields
 */
export function isValidCodeInfo(info: unknown): info is CodeInfo {
  if (!info || typeof info !== 'object') return false;

  const code = info as Partial<CodeInfo>;

  return (
    typeof code.relativePath === 'string' &&
    typeof code.lineNumber === 'number' &&
    typeof code.componentName === 'string'
  );
}
