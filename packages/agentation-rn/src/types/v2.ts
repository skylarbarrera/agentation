/**
 * Agentation V2 Schema Types
 *
 * These types define the v2 protocol for annotation sync, sessions, and MCP integration.
 * Copied from upstream web package spec with RN extensions.
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/package/src/types.ts
 */

// =============================================================================
// V2 Protocol Types (Web Parity)
// =============================================================================

/**
 * Annotation intent classification
 * Describes what the user wants to happen
 */
export type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve';

/**
 * Annotation severity/priority level
 */
export type AnnotationSeverity = 'blocking' | 'important' | 'suggestion';

/**
 * Annotation status in the workflow lifecycle
 */
export type AnnotationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';

/**
 * Session status
 */
export type SessionStatus = 'active' | 'approved' | 'closed';

/**
 * Thread message for annotation conversations
 */
export type ThreadMessage = {
  /** Unique message ID */
  id: string;
  /** Who sent this message */
  role: 'human' | 'agent';
  /** Message content */
  content: string;
  /** Unix timestamp (ms) */
  timestamp: number;
};

/**
 * Session represents a feedback collection session
 * In web: tied to a URL
 * In RN: tied to a route name
 */
export type Session = {
  /** Unique session ID */
  id: string;
  /** URL (web) or route name (RN) */
  url: string;
  /** Session status */
  status: SessionStatus;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt?: string;
  /** Optional project/app identifier */
  projectId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Session with its annotations
 */
export type SessionWithAnnotations = Session & {
  annotations: V2Annotation[];
};

/**
 * V2 Annotation protocol fields
 * These are the NEW fields added in v2 for MCP/sync support
 */
export interface V2AnnotationProtocolFields {
  /** Session this annotation belongs to */
  sessionId?: string;
  /** URL (web) or route name (RN) where annotation was created */
  url?: string;
  /** User's intent classification */
  intent?: AnnotationIntent;
  /** Priority/severity level */
  severity?: AnnotationSeverity;
  /** Workflow status */
  status?: AnnotationStatus;
  /** Conversation thread (replies from human/agent) */
  thread?: ThreadMessage[];
  /** ISO 8601 creation timestamp */
  createdAt?: string;
  /** ISO 8601 last update timestamp */
  updatedAt?: string;
  /** ISO 8601 resolution timestamp */
  resolvedAt?: string;
  /** Who resolved this annotation */
  resolvedBy?: 'human' | 'agent';
  /** Author identifier */
  authorId?: string;
  /** Local sync tracking - last synced session ID */
  _syncedTo?: string;
}

/**
 * Base annotation fields shared between web and RN
 * These are the core v1 fields that both platforms have
 */
export interface BaseAnnotationFields {
  /** Unique identifier */
  id: string;
  /** X coordinate (% of viewport width in web, pixels in RN) */
  x: number;
  /** Y coordinate (pixels from top) */
  y: number;
  /** User's feedback comment */
  comment: string;
  /** Element/component name */
  element: string;
  /** Path to element (CSS selector in web, source path in RN) */
  elementPath: string;
  /** Unix timestamp (ms) when created */
  timestamp: number;
  /** Selected text content */
  selectedText?: string;
  /** Element bounding box */
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** Nearby text for context */
  nearbyText?: string;
  /** Nearby sibling elements */
  nearbyElements?: string;
  /** Full element hierarchy path */
  fullPath?: string;
  /** Accessibility label/info */
  accessibility?: string;
  /** Whether created via multi-select */
  isMultiSelect?: boolean;
  /** Whether element has fixed positioning */
  isFixed?: boolean;
}

/**
 * Web-specific annotation fields
 * Kept for protocol parity but not populated in RN
 */
export interface WebAnnotationFields {
  /** CSS classes on the element (web only) */
  cssClasses?: string;
  /** Computed CSS styles (web only) */
  computedStyles?: string;
  /** React component names (web only) */
  reactComponents?: string;
  /** Multiple element bounding boxes (web only) */
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
}

/**
 * Complete V2 Annotation type
 * Combines base fields + web fields + v2 protocol fields
 */
export type V2Annotation = BaseAnnotationFields & WebAnnotationFields & V2AnnotationProtocolFields;

// =============================================================================
// API Types (for sync.ts / HTTP communication)
// =============================================================================

/**
 * Response from health check endpoint
 */
export type HealthCheckResponse = {
  status: 'ok';
  version: string;
};

/**
 * Request to send action to agent
 */
export type ActionRequest = {
  /** Session ID */
  sessionId: string;
  /** Annotations to send */
  annotations: V2Annotation[];
  /** Pre-formatted markdown output */
  output: string;
  /** ISO 8601 timestamp */
  timestamp: string;
};

/**
 * Response from action request
 */
export type ActionResponse = {
  success: boolean;
  message?: string;
  actionId?: string;
};

/**
 * Connection status for MCP server
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// =============================================================================
// Webhook Types
// =============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'annotation.created'
  | 'annotation.updated'
  | 'annotation.deleted'
  | 'session.updated'
  | 'action.requested';

/**
 * Webhook payload
 */
export type WebhookPayload = {
  event: WebhookEventType;
  timestamp: string;
  data: {
    sessionId?: string;
    annotation?: V2Annotation;
    annotations?: V2Annotation[];
    session?: Session;
    output?: string;
  };
};

// =============================================================================
// Default Values
// =============================================================================

/**
 * Default annotation status for new annotations
 */
export const DEFAULT_ANNOTATION_STATUS: AnnotationStatus = 'pending';

/**
 * Default session status for new sessions
 */
export const DEFAULT_SESSION_STATUS: SessionStatus = 'active';
