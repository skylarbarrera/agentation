/**
 * Sync Utilities
 * Pure fetch API functions for MCP server communication
 *
 * These functions work identically in web and RN (no browser APIs).
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/package/src/utils/sync.ts
 */

import type {
  Annotation,
  Session,
  SessionWithAnnotations,
  ActionRequest,
  ActionResponse,
  HealthCheckResponse,
} from '../types';

// =============================================================================
// Health Check
// =============================================================================

/**
 * Check if MCP server is reachable
 */
export async function checkHealth(
  endpoint: string
): Promise<HealthCheckResponse | null> {
  try {
    const response = await fetch(`${endpoint}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

// =============================================================================
// Session Operations
// =============================================================================

/**
 * List all sessions from the server
 */
export async function listSessions(
  endpoint: string,
  status?: string,
  limit?: number
): Promise<Session[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));

  const url = `${endpoint}/sessions${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to list sessions: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create a new session or get existing one for the URL/route
 */
export async function createSession(
  endpoint: string,
  url: string,
  projectId?: string,
  metadata?: Record<string, unknown>
): Promise<Session> {
  const response = await fetch(`${endpoint}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, projectId, metadata }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a session with all its annotations
 */
export async function getSession(
  endpoint: string,
  sessionId: string
): Promise<SessionWithAnnotations> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return await response.json();
}

// =============================================================================
// Annotation Operations
// =============================================================================

/**
 * Sync an annotation to the server (create or update)
 */
export async function syncAnnotation(
  endpoint: string,
  sessionId: string,
  annotation: Annotation
): Promise<Annotation> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(annotation),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync annotation: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update an annotation on the server
 */
export async function updateAnnotation(
  endpoint: string,
  annotationId: string,
  data: Partial<Annotation>
): Promise<Annotation> {
  const response = await fetch(`${endpoint}/annotations/${annotationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update annotation: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete an annotation from the server
 */
export async function deleteAnnotation(
  endpoint: string,
  annotationId: string
): Promise<void> {
  const response = await fetch(`${endpoint}/annotations/${annotationId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete annotation: ${response.statusText}`);
  }
}

/**
 * Get pending annotations for a session
 */
export async function getPendingAnnotations(
  endpoint: string,
  sessionId: string
): Promise<Annotation[]> {
  const response = await fetch(`${endpoint}/sessions/${sessionId}/pending`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get pending annotations: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get all pending annotations across sessions
 */
export async function getAllPendingAnnotations(
  endpoint: string
): Promise<Annotation[]> {
  const response = await fetch(`${endpoint}/pending`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get all pending: ${response.statusText}`);
  }

  return await response.json();
}

// =============================================================================
// Action Request (Send to Agent)
// =============================================================================

/**
 * Send action request to the server
 * This is what happens when "Send to Agent" is clicked
 */
export async function requestAction(
  endpoint: string,
  sessionId: string,
  output: string,
  annotations?: Annotation[]
): Promise<ActionResponse> {
  const payload: Omit<ActionRequest, 'timestamp'> = {
    sessionId,
    output,
    annotations: annotations ?? [],
  };

  const response = await fetch(`${endpoint}/sessions/${sessionId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to request action: ${response.statusText}`);
  }

  return await response.json();
}
