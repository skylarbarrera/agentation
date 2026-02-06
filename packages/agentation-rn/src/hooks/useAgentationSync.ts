/**
 * useAgentationSync Hook
 * Manages connection to MCP server and syncs annotations
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/package/src/components/page-toolbar-css/index.tsx
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Annotation,
  Session,
  ConnectionStatus,
  ActionResponse,
} from '../types';
import {
  checkHealth,
  createSession,
  getSession,
  syncAnnotation as syncAnnotationToServer,
  requestAction,
} from '../utils/sync';
import {
  loadSessionId,
  saveSessionId,
  saveAnnotationsWithSyncMarker,
  getUnsyncedAnnotations,
} from '../utils/storage';
import { debugLog, debugError } from '../utils/debug';

// =============================================================================
// Types
// =============================================================================

export interface UseAgentationSyncOptions {
  /** MCP server URL (e.g., 'http://192.168.1.100:4848') */
  endpoint?: string;
  /** Current route name (RN equivalent of pathname) */
  routeName: string;
  /** Enable auto-sync on annotation changes */
  autoSync?: boolean;
  /** Health check interval in ms (default: 10000) */
  healthCheckInterval?: number;
  /** Session ID to rejoin (optional) */
  initialSessionId?: string;
  /** Callback when session is created */
  onSessionCreated?: (sessionId: string) => void;
  /** Callback when connection status changes */
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseAgentationSyncReturn {
  /** Current connection status */
  connectionStatus: ConnectionStatus;
  /** Whether connected to server */
  isConnected: boolean;
  /** Current session ID (if any) */
  sessionId: string | null;
  /** Current session (if any) */
  session: Session | null;
  /** Sync a single annotation to server */
  syncAnnotation: (annotation: Annotation) => Promise<void>;
  /** Sync all unsynced annotations */
  syncAll: (annotations: Annotation[]) => Promise<void>;
  /** Send action request ("Send to Agent") */
  sendToAgent: (annotations: Annotation[], output: string) => Promise<ActionResponse | null>;
  /** Force reconnect */
  reconnect: () => Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

// =============================================================================
// Hook
// =============================================================================

export function useAgentationSync(
  options: UseAgentationSyncOptions
): UseAgentationSyncReturn {
  const {
    endpoint,
    routeName,
    autoSync = true,
    healthCheckInterval = DEFAULT_HEALTH_CHECK_INTERVAL,
    initialSessionId,
    onSessionCreated,
    onConnectionStatusChange,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Update connection status and notify
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionStatusChange?.(status);
  }, [onConnectionStatusChange]);

  // Check server health
  const checkServerHealth = useCallback(async () => {
    if (!endpoint) return false;

    try {
      const health = await checkHealth(endpoint);
      return health?.status === 'ok';
    } catch {
      return false;
    }
  }, [endpoint]);

  // Initialize or rejoin session
  const initSession = useCallback(async () => {
    if (!endpoint || !mountedRef.current) return;

    updateConnectionStatus('connecting');

    try {
      // Check if we have a stored session ID
      let storedSessionId: string | null = initialSessionId ?? null;
      if (!storedSessionId) {
        storedSessionId = await loadSessionId(routeName);
      }

      let sessionData: Session | null = null;

      if (storedSessionId) {
        // Try to rejoin existing session
        try {
          const existing = await getSession(endpoint, storedSessionId);
          if (existing && existing.status === 'active') {
            sessionData = existing;
            debugLog('Rejoined session:', storedSessionId);
          }
        } catch {
          // Session not found or invalid, create new one
          debugLog('Session not found, creating new');
        }
      }

      if (!sessionData) {
        // Create new session
        sessionData = await createSession(endpoint, routeName);
        await saveSessionId(routeName, sessionData.id);
        onSessionCreated?.(sessionData.id);
        debugLog('Created new session:', sessionData.id);
      }

      if (mountedRef.current) {
        setSession(sessionData);
        setSessionId(sessionData.id);
        updateConnectionStatus('connected');
      }
    } catch (error) {
      debugError('Failed to init session:', error);
      if (mountedRef.current) {
        updateConnectionStatus('disconnected');
      }
    }
  }, [endpoint, routeName, initialSessionId, onSessionCreated, updateConnectionStatus]);

  // Sync a single annotation
  const syncAnnotation = useCallback(async (annotation: Annotation) => {
    if (!endpoint || !sessionId) return;

    try {
      const synced = await syncAnnotationToServer(endpoint, sessionId, annotation);
      debugLog('Synced annotation:', synced.id);
    } catch (error) {
      debugError('Failed to sync annotation:', error);
    }
  }, [endpoint, sessionId]);

  // Sync all unsynced annotations
  const syncAll = useCallback(async (annotations: Annotation[]) => {
    if (!endpoint || !sessionId) return;

    const unsynced = annotations.filter(a => !a._syncedTo || a._syncedTo !== sessionId);

    for (const annotation of unsynced) {
      try {
        await syncAnnotationToServer(endpoint, sessionId, annotation);
      } catch (error) {
        debugError('Failed to sync annotation:', annotation.id, error);
      }
    }

    // Mark all as synced
    await saveAnnotationsWithSyncMarker(routeName, annotations, sessionId);
    debugLog('Synced', unsynced.length, 'annotations');
  }, [endpoint, sessionId, routeName]);

  // Send to agent
  const sendToAgent = useCallback(async (
    annotations: Annotation[],
    output: string
  ): Promise<ActionResponse | null> => {
    if (!endpoint || !sessionId) {
      debugError('Cannot send to agent: not connected');
      return null;
    }

    try {
      const response = await requestAction(endpoint, sessionId, output, annotations);
      debugLog('Sent to agent:', response);
      return response;
    } catch (error) {
      debugError('Failed to send to agent:', error);
      return null;
    }
  }, [endpoint, sessionId]);

  // Force reconnect
  const reconnect = useCallback(async () => {
    await initSession();
  }, [initSession]);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;

    if (endpoint) {
      initSession();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [endpoint, initSession]);

  // Health check interval
  useEffect(() => {
    if (!endpoint) return;

    const runHealthCheck = async () => {
      const healthy = await checkServerHealth();

      if (!mountedRef.current) return;

      if (healthy && connectionStatus === 'disconnected') {
        // Reconnect
        initSession();
      } else if (!healthy && connectionStatus === 'connected') {
        updateConnectionStatus('disconnected');
      }
    };

    healthCheckRef.current = setInterval(runHealthCheck, healthCheckInterval);

    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
    };
  }, [endpoint, healthCheckInterval, connectionStatus, checkServerHealth, initSession, updateConnectionStatus]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    sessionId,
    session,
    syncAnnotation,
    syncAll,
    sendToAgent,
    reconnect,
  };
}
