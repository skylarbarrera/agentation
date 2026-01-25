/**
 * Debug logging utilities
 * All logs are gated behind __DEV__ for production safety
 */

const PREFIX = '[Agentation]';

/**
 * Log debug message (only in development)
 */
export function debugLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log(PREFIX, ...args);
  }
}

/**
 * Log warning (only in development)
 */
export function debugWarn(...args: unknown[]): void {
  if (__DEV__) {
    console.warn(PREFIX, ...args);
  }
}

/**
 * Log error (always, but with prefix)
 */
export function debugError(...args: unknown[]): void {
  console.error(PREFIX, ...args);
}
