import type { OutputDetailLevel } from './annotation';

export interface AgenationSettings {
  outputDetail: OutputDetailLevel;
  clearAfterCopy: boolean;
  annotationColor: string;
  autoSave: boolean;
  retentionDays: number;
  includeComponentBounds: boolean;
  includeAccessibility: boolean;
  markdownTemplate?: string;
}

export const DEFAULT_SETTINGS: AgenationSettings = {
  outputDetail: 'standard',
  clearAfterCopy: false,
  annotationColor: '#3c82f7',
  autoSave: true,
  retentionDays: 7,
  includeComponentBounds: true,
  includeAccessibility: true,
};
