/**
 * Helper Utilities
 * General utility functions
 */

import * as Clipboard from 'expo-clipboard';
import { debugError } from './debug';

/**
 * Generate unique ID for annotations
 */
export function generateId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
  } catch (error) {
    debugError('Failed to copy to clipboard:', error);
    throw error;
  }
}

/**
 * Get text from clipboard
 */
export async function getFromClipboard(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch (error) {
    debugError('Failed to get from clipboard:', error);
    return '';
  }
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format time for display
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
