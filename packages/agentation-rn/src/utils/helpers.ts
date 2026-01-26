import * as Clipboard from 'expo-clipboard';
import { debugError } from './debug';

export function generateId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getTimestamp(): number {
  return Date.now();
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
  } catch (error) {
    debugError('Failed to copy to clipboard:', error);
    throw error;
  }
}

export async function getFromClipboard(): Promise<string> {
  try {
    return await Clipboard.getStringAsync();
  } catch (error) {
    debugError('Failed to get from clipboard:', error);
    return '';
  }
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
