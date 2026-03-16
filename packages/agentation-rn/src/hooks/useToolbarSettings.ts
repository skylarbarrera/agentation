import { useState, useEffect, useCallback } from 'react';
import type { OutputDetailLevel, AgenationSettings } from '../types';
import { DEFAULT_SETTINGS, COLOR_OPTIONS, resolveAnnotationColor } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

const DETAIL_LEVEL_ORDER: OutputDetailLevel[] = ['compact', 'standard', 'detailed', 'forensic'];

function getNextDetailLevel(current: OutputDetailLevel): OutputDetailLevel {
  const currentIndex = DETAIL_LEVEL_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % DETAIL_LEVEL_ORDER.length;
  return DETAIL_LEVEL_ORDER[nextIndex];
}

export interface ToolbarSettingsOptions {
  controlledOutputDetail?: OutputDetailLevel;
  onOutputDetailChange?: (level: OutputDetailLevel) => void;
  controlledAutoClearAfterCopy?: boolean;
  onAutoClearAfterCopyChange?: (value: boolean) => void;
  controlledAnnotationColor?: string;
  onAnnotationColorChange?: (color: string) => void;
  // V2 Webhook settings
  controlledWebhookUrl?: string;
  onWebhookUrlChange?: (url: string) => void;
  controlledWebhooksEnabled?: boolean;
  onWebhooksEnabledChange?: (enabled: boolean) => void;
}

export interface ToolbarSettingsResult {
  currentOutputDetail: OutputDetailLevel;
  currentAutoClearAfterCopy: boolean;
  currentAnnotationColor: string;
  currentWebhookUrl: string;
  currentWebhooksEnabled: boolean;
  handleOutputDetailCycle: () => void;
  handleAutoClearAfterCopyToggle: () => void;
  handleAnnotationColorCycle: () => void;
  handleWebhookUrlChange: (url: string) => void;
  handleWebhooksEnabledToggle: () => void;
}

export function useToolbarSettings(options: ToolbarSettingsOptions): ToolbarSettingsResult {
  const {
    controlledOutputDetail,
    onOutputDetailChange,
    controlledAutoClearAfterCopy,
    onAutoClearAfterCopyChange,
    controlledAnnotationColor,
    onAnnotationColorChange,
    controlledWebhookUrl,
    onWebhookUrlChange,
    controlledWebhooksEnabled,
    onWebhooksEnabledChange,
  } = options;

  const [internalSettings, setInternalSettings] = useState<AgenationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setInternalSettings);
  }, []);

  const currentOutputDetail = controlledOutputDetail ?? internalSettings.outputDetail;
  const currentAutoClearAfterCopy = controlledAutoClearAfterCopy ?? internalSettings.autoClearAfterCopy;
  const currentAnnotationColor = resolveAnnotationColor(
    controlledAnnotationColor ?? internalSettings.annotationColorId ?? internalSettings.annotationColor
  );
  const currentWebhookUrl = controlledWebhookUrl ?? internalSettings.webhookUrl ?? '';
  const currentWebhooksEnabled = controlledWebhooksEnabled ?? internalSettings.webhooksEnabled ?? false;

  const handleOutputDetailCycle = useCallback(() => {
    const nextLevel = getNextDetailLevel(currentOutputDetail);
    if (onOutputDetailChange) {
      onOutputDetailChange(nextLevel);
    } else {
      setInternalSettings(prev => ({ ...prev, outputDetail: nextLevel }));
      saveSettings({ outputDetail: nextLevel });
    }
  }, [currentOutputDetail, onOutputDetailChange]);

  const handleAutoClearAfterCopyToggle = useCallback(() => {
    const newValue = !currentAutoClearAfterCopy;
    if (onAutoClearAfterCopyChange) {
      onAutoClearAfterCopyChange(newValue);
    } else {
      setInternalSettings(prev => ({ ...prev, autoClearAfterCopy: newValue }));
      saveSettings({ autoClearAfterCopy: newValue });
    }
  }, [currentAutoClearAfterCopy, onAutoClearAfterCopyChange]);

  const handleAnnotationColorCycle = useCallback(() => {
    // Find current by id or hex value
    const currentIndex = COLOR_OPTIONS.findIndex(
      c => c.value === currentAnnotationColor || c.id === (internalSettings.annotationColorId ?? '')
    );
    const nextIndex = (currentIndex + 1) % COLOR_OPTIONS.length;
    const next = COLOR_OPTIONS[nextIndex];
    if (onAnnotationColorChange) {
      onAnnotationColorChange(next.value);
    } else {
      setInternalSettings(prev => ({
        ...prev,
        annotationColor: next.value,
        annotationColorId: next.id,
      }));
      saveSettings({ annotationColor: next.value, annotationColorId: next.id });
    }
  }, [currentAnnotationColor, internalSettings.annotationColorId, onAnnotationColorChange]);

  const handleWebhookUrlChange = useCallback((url: string) => {
    if (onWebhookUrlChange) {
      onWebhookUrlChange(url);
    } else {
      setInternalSettings(prev => ({ ...prev, webhookUrl: url }));
      saveSettings({ webhookUrl: url });
    }
  }, [onWebhookUrlChange]);

  const handleWebhooksEnabledToggle = useCallback(() => {
    const newValue = !currentWebhooksEnabled;
    if (onWebhooksEnabledChange) {
      onWebhooksEnabledChange(newValue);
    } else {
      setInternalSettings(prev => ({ ...prev, webhooksEnabled: newValue }));
      saveSettings({ webhooksEnabled: newValue });
    }
  }, [currentWebhooksEnabled, onWebhooksEnabledChange]);

  return {
    currentOutputDetail,
    currentAutoClearAfterCopy,
    currentAnnotationColor,
    currentWebhookUrl,
    currentWebhooksEnabled,
    handleOutputDetailCycle,
    handleAutoClearAfterCopyToggle,
    handleAnnotationColorCycle,
    handleWebhookUrlChange,
    handleWebhooksEnabledToggle,
  };
}
