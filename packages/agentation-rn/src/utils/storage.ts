/**
 * Storage Utilities
 * Wraps AsyncStorage for annotation and settings persistence
 *
 * Web API Parity: Supports settings storage for outputDetail and clearAfterCopy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Annotation, StorageKey, AgenationSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { debugError } from './debug';

// =============================================================================
// Constants
// =============================================================================

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
