/**
 * Storage Utilities
 * Wraps AsyncStorage for annotation and settings persistence
 *
 * V2 Features:
 * - Session management (per-route session IDs)
 * - Sync tracking (_syncedTo field)
 * - Retention period enforcement
 *
 * Web API Parity: Matches web storage.ts function signatures
 * @see https://github.com/benjitaylor/agentation/blob/main/package/src/utils/storage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Annotation, StorageKey, AgenationSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { debugError } from './debug';

// =============================================================================
// Constants (Web Parity)
// =============================================================================

/** Annotation storage prefix (matches web) */
const STORAGE_PREFIX = 'feedback-annotations-';

/** Session storage prefix (matches web) */
const SESSION_PREFIX = 'agentation-session-';

/** Default retention period in days (matches web) */
const DEFAULT_RETENTION_DAYS = 7;

const SETTINGS_KEY = '@agentation:settings';

/**
 * Generate storage key for a screen
 * Format: @agentation:ScreenName
 */
export function getStorageKey(screenName: string): StorageKey {
  return `@agentation:${screenName}`;
}

/**
 * Save annotations to AsyncStorage
 */
export async function saveAnnotations(
  screenName: string,
  annotations: Annotation[]
): Promise<void> {
  try {
    const key = getStorageKey(screenName);
    const json = JSON.stringify(annotations);
    await AsyncStorage.setItem(key, json);
  } catch (error) {
    debugError('Failed to save annotations:', error);
    throw error;
  }
}

/**
 * Load annotations from AsyncStorage
 */
export async function loadAnnotations(
  screenName: string
): Promise<Annotation[]> {
  try {
    const key = getStorageKey(screenName);
    const json = await AsyncStorage.getItem(key);

    if (!json) {
      return [];
    }

    const annotations = JSON.parse(json) as Annotation[];
    return annotations;
  } catch (error) {
    debugError('Failed to load annotations:', error);
    return [];
  }
}

/**
 * Clear annotations for a screen
 */
export async function clearAnnotations(screenName: string): Promise<void> {
  try {
    const key = getStorageKey(screenName);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    debugError('Failed to clear annotations:', error);
    throw error;
  }
}

/**
 * Get all annotation keys
 */
export async function getAllAnnotationKeys(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(key => key.startsWith('@agentation:'));
  } catch (error) {
    debugError('Failed to get annotation keys:', error);
    return [];
  }
}

/**
 * Clear all annotations (all screens)
 */
export async function clearAllAnnotations(): Promise<void> {
  try {
    const keys = await getAllAnnotationKeys();
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    debugError('Failed to clear all annotations:', error);
    throw error;
  }
}

// =============================================================================
// Settings Storage (Web API Parity)
// =============================================================================

/**
 * Save settings to AsyncStorage
 * Merges with existing settings (partial update supported)
 */
export async function saveSettings(
  settings: Partial<AgenationSettings>
): Promise<void> {
  try {
    const current = await loadSettings();
    const merged = { ...current, ...settings };
    const json = JSON.stringify(merged);
    await AsyncStorage.setItem(SETTINGS_KEY, json);
  } catch (error) {
    debugError('Failed to save settings:', error);
    throw error;
  }
}

/**
 * Load settings from AsyncStorage
 * Returns DEFAULT_SETTINGS if none stored
 */
export async function loadSettings(): Promise<AgenationSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);

    if (!json) {
      return DEFAULT_SETTINGS;
    }

    const stored = JSON.parse(json) as Partial<AgenationSettings>;
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch (error) {
    debugError('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    debugError('Failed to reset settings:', error);
    throw error;
  }
}

// =============================================================================
// V2 Storage Functions (Web API Parity)
// =============================================================================

/**
 * Get storage key for annotations (v2 format)
 * Uses web-compatible prefix for protocol parity
 * @param routeName - Route/screen name (RN equivalent of pathname)
 */
export function getV2StorageKey(routeName: string): string {
  return `${STORAGE_PREFIX}${routeName}`;
}

/**
 * Get storage key for session ID
 * @param routeName - Route/screen name
 */
export function getSessionStorageKey(routeName: string): string {
  return `${SESSION_PREFIX}${routeName}`;
}

/**
 * Load annotations with retention filtering (v2)
 * Filters out annotations older than retention period
 * @param routeName - Route/screen name
 * @param retentionDays - Days to retain annotations (default: 7)
 */
export async function loadAnnotationsV2(
  routeName: string,
  retentionDays: number = DEFAULT_RETENTION_DAYS
): Promise<Annotation[]> {
  try {
    const key = getV2StorageKey(routeName);
    const json = await AsyncStorage.getItem(key);

    if (!json) {
      return [];
    }

    const annotations = JSON.parse(json) as Annotation[];
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Filter by retention period
    return annotations.filter(
      (a) => !a.timestamp || a.timestamp > cutoff
    );
  } catch (error) {
    debugError('Failed to load annotations (v2):', error);
    return [];
  }
}

/**
 * Save annotations (v2)
 * @param routeName - Route/screen name
 * @param annotations - Annotations to save
 */
export async function saveAnnotationsV2(
  routeName: string,
  annotations: Annotation[]
): Promise<void> {
  try {
    const key = getV2StorageKey(routeName);
    await AsyncStorage.setItem(key, JSON.stringify(annotations));
  } catch (error) {
    debugError('Failed to save annotations (v2):', error);
    throw error;
  }
}

/**
 * Clear annotations for a route (v2)
 * @param routeName - Route/screen name
 */
export async function clearAnnotationsV2(routeName: string): Promise<void> {
  try {
    const key = getV2StorageKey(routeName);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    debugError('Failed to clear annotations (v2):', error);
    throw error;
  }
}

/**
 * Load all annotations across all routes
 * Useful for sync operations
 */
export async function loadAllAnnotations(): Promise<Map<string, Annotation[]>> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const annotationKeys = allKeys.filter((key) =>
      key.startsWith(STORAGE_PREFIX)
    );

    const result = new Map<string, Annotation[]>();

    for (const key of annotationKeys) {
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const routeName = key.slice(STORAGE_PREFIX.length);
        const annotations = JSON.parse(json) as Annotation[];
        result.set(routeName, annotations);
      }
    }

    return result;
  } catch (error) {
    debugError('Failed to load all annotations:', error);
    return new Map();
  }
}

// =============================================================================
// Session Management (V2)
// =============================================================================

/**
 * Load session ID for a route
 * @param routeName - Route/screen name
 */
export async function loadSessionId(
  routeName: string
): Promise<string | null> {
  try {
    const key = getSessionStorageKey(routeName);
    return await AsyncStorage.getItem(key);
  } catch (error) {
    debugError('Failed to load session ID:', error);
    return null;
  }
}

/**
 * Save session ID for a route
 * @param routeName - Route/screen name
 * @param sessionId - Session ID to save
 */
export async function saveSessionId(
  routeName: string,
  sessionId: string
): Promise<void> {
  try {
    const key = getSessionStorageKey(routeName);
    await AsyncStorage.setItem(key, sessionId);
  } catch (error) {
    debugError('Failed to save session ID:', error);
    throw error;
  }
}

/**
 * Clear session ID for a route
 * @param routeName - Route/screen name
 */
export async function clearSessionId(routeName: string): Promise<void> {
  try {
    const key = getSessionStorageKey(routeName);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    debugError('Failed to clear session ID:', error);
    throw error;
  }
}

// =============================================================================
// Sync Tracking (V2)
// =============================================================================

/**
 * Save annotations with sync marker
 * Updates _syncedTo field for each annotation
 * @param routeName - Route/screen name
 * @param annotations - Annotations to save
 * @param sessionId - Current session ID for sync tracking
 */
export async function saveAnnotationsWithSyncMarker(
  routeName: string,
  annotations: Annotation[],
  sessionId: string
): Promise<void> {
  const markedAnnotations = annotations.map((ann) => ({
    ...ann,
    _syncedTo: sessionId,
  }));

  await saveAnnotationsV2(routeName, markedAnnotations);
}

/**
 * Get annotations that haven't been synced to the server
 * @param routeName - Route/screen name
 * @param sessionId - Current session ID (optional, if not provided returns all unsynced)
 */
export async function getUnsyncedAnnotations(
  routeName: string,
  sessionId?: string
): Promise<Annotation[]> {
  const annotations = await loadAnnotationsV2(routeName);

  return annotations.filter((ann) => {
    // Not synced if no _syncedTo field
    if (!ann._syncedTo) return true;

    // If sessionId provided, check if synced to this session
    if (sessionId && ann._syncedTo !== sessionId) return true;

    return false;
  });
}

/**
 * Clear sync markers from annotations
 * Used when starting fresh sync or changing sessions
 * @param routeName - Route/screen name
 */
export async function clearSyncMarkers(routeName: string): Promise<void> {
  const annotations = await loadAnnotationsV2(routeName);

  const clearedAnnotations = annotations.map((ann) => {
    const { _syncedTo, ...rest } = ann;
    return rest as Annotation;
  });

  await saveAnnotationsV2(routeName, clearedAnnotations);
}

/**
 * Get all route names that have stored annotations
 */
export async function getAllRouteNames(): Promise<string[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .map((key) => key.slice(STORAGE_PREFIX.length));
  } catch (error) {
    debugError('Failed to get route names:', error);
    return [];
  }
}

/**
 * Get all session IDs stored
 */
export async function getAllSessionIds(): Promise<Map<string, string>> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const sessionKeys = allKeys.filter((key) =>
      key.startsWith(SESSION_PREFIX)
    );

    const result = new Map<string, string>();

    for (const key of sessionKeys) {
      const sessionId = await AsyncStorage.getItem(key);
      if (sessionId) {
        const routeName = key.slice(SESSION_PREFIX.length);
        result.set(routeName, sessionId);
      }
    }

    return result;
  } catch (error) {
    debugError('Failed to get session IDs:', error);
    return new Map();
  }
}

