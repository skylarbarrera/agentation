/**
 * Agentation - Main Component
 * Wraps the app to enable annotation mode for visual feedback
 *
 * Uses the same touch handling pattern as React Native's built-in Inspector:
 * - Overlay captures all touches when in annotation mode
 * - Coordinates extracted from touch event (not target)
 * - Native hit-testing API finds component at those coordinates
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { debugLog } from '../utils/debug';
import type { AgenationProps, Annotation, ComponentDetection, DemoAnnotation, AgenationSettings, OutputDetailLevel, AgentationPlugin } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';
import { useAnnotations } from '../hooks/useAnnotations';
import { useAgentationSync } from '../hooks/useAgentationSync';
import { generateId, getTimestamp } from '../utils/helpers';
import { detectComponentAtPoint } from '../utils/componentDetection';
import { generateMarkdown } from '../utils/markdownGeneration';
import { Toolbar } from './Toolbar';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationPopup } from './AnnotationPopup';
import { AgenationContext, AgenationContextValue } from '../context/AgenationContext';


export type { AgenationProps };

/**
 * Format detected component info for display
 * Shows: "Button.tsx:42" or "CustomButton" as fallback
 */
function formatDetectedElement(codeInfo: { relativePath?: string; lineNumber?: number; componentName?: string } | null): string | undefined {
  if (!codeInfo) return undefined;

  // Try to get filename from path
  const filename = codeInfo.relativePath?.split('/').pop();

  if (filename) {
    // Show filename:line (e.g., "Button.tsx:42")
    return codeInfo.lineNumber ? `${filename}:${codeInfo.lineNumber}` : filename;
  }

  // Fallback to component name
  return codeInfo.componentName;
}

/**
 * Convert DemoAnnotation[] to Annotation[]
 * DemoAnnotations are simplified for easy creation, Annotations have all required fields
 */
function convertDemoAnnotations(demoAnnotations: DemoAnnotation[]): Annotation[] {
  return demoAnnotations.map((demo) => {
    // Parse selector to extract element info
    // Format expected: "Button.tsx:42" or testID
    const parts = demo.selector.split(':');
    const element = parts[0] || 'Unknown';
    const lineNumber = parts[1] ? parseInt(parts[1], 10) : undefined;

    return {
      id: generateId(),
      x: 0, // Demo annotations don't have real positions
      y: 0,
      comment: demo.comment,
      element,
      elementPath: demo.selector,
      timestamp: getTimestamp(),
      selectedText: demo.selectedText,
      lineNumber,
    };
  });
}

/**
 * Get current route name from React Navigation
 */
function getCurrentRouteName(): string | undefined {
  try {
    const globalNav = (global as any).__REACT_NAVIGATION_DEVTOOLS__;
    if (globalNav?.navigatorRef?.current) {
      const state = globalNav.navigatorRef.current.getRootState?.();
      if (state) {
        let current = state;
        while (current.routes && current.index !== undefined) {
          current = current.routes[current.index];
          if (!current.state) return current.name;
        }
        return current.name;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function Agentation({
  children,
  disabled = false,
  demoAnnotations,
  demoDelay = 1000,
  enableDemoMode = false,
  storageKey = 'default',
  onAnnotationModeEnabled,
  onAnnotationModeDisabled,
  onAnnotationAdd,
  onAnnotationDelete,
  onAnnotationUpdate,
  onAnnotationsClear,
  onCopy,
  copyToClipboard = true,
  onAnnotationCreated,
  onAnnotationUpdated,
  onAnnotationDeleted,
  onMarkdownCopied,
  zIndexBase = 9999,
  toolbarOffset,
  plugins = [],
  // V2 MCP Integration Props
  endpoint,
  initialSessionId,
  onSessionCreated,
}: AgenationProps) {
  const insets = useSafeAreaInsets();

  // Don't render in production or when disabled
  if (disabled || !__DEV__) {
    return <>{children}</>;
  }

  // Calculate toolbar height for popup positioning
  const toolbarHeight = Math.max(insets.bottom, 16) + 16 + 56 + (toolbarOffset?.y ?? 0); // FAB is 56px

  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [pendingTap, setPendingTap] = useState<{ x: number; y: number } | null>(null);
  const [pendingDetection, setPendingDetection] = useState<ComponentDetection | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(getCurrentRouteName());
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [settings, setSettings] = useState<AgenationSettings>(DEFAULT_SETTINGS);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const contentRef = useRef<View>(null);

  // MCP sync (only active when endpoint provided)
  const {
    connectionStatus,
    isConnected,
    sessionId,
    syncAnnotation: syncToServer,
    sendToAgent,
  } = useAgentationSync({
    endpoint,
    routeName: currentRoute || storageKey,
    autoSync: true,
    initialSessionId,
    onSessionCreated,
  });

  // Check if any plugin supports pause
  const hasPausePlugin = useMemo(
    () => plugins.some(p => p.supportsPause && (p.isAvailable?.() ?? true)),
    [plugins]
  );

  // Load settings on mount
  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Handle pause toggle
  const handlePauseToggle = useCallback(() => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    // Notify all pause-capable plugins
    plugins.forEach(plugin => {
      if (plugin.supportsPause) {
        plugin.onPauseChange?.(newPaused);
      }
    });
  }, [isPaused, plugins]);

  // Settings change handlers
  const handleAnnotationColorChange = useCallback((color: string) => {
    const newSettings = { ...settings, annotationColor: color };
    setSettings(newSettings);
    saveSettings({ annotationColor: color });
  }, [settings]);

  const handleClearAfterCopyChange = useCallback((value: boolean) => {
    const newSettings = { ...settings, clearAfterCopy: value };
    setSettings(newSettings);
    saveSettings({ clearAfterCopy: value });
  }, [settings]);

  const handleOutputDetailChange = useCallback((level: OutputDetailLevel) => {
    const newSettings = { ...settings, outputDetail: level };
    setSettings(newSettings);
    saveSettings({ outputDetail: level });
  }, [settings]);

  const handleWebhookUrlChange = useCallback((url: string) => {
    const newSettings = { ...settings, webhookUrl: url };
    setSettings(newSettings);
    saveSettings({ webhookUrl: url });
  }, [settings]);

  const handleWebhooksEnabledChange = useCallback((enabled: boolean) => {
    const newSettings = { ...settings, webhooksEnabled: enabled };
    setSettings(newSettings);
    saveSettings({ webhooksEnabled: enabled });
  }, [settings]);

  const handleSettingsMenuChange = useCallback((isOpen: boolean) => {
    setIsSettingsMenuOpen(isOpen);
  }, []);

  // Callback for useAgentationScroll hook to report scroll position
  const reportScrollOffset = useCallback((x: number, y: number) => {
    setScrollOffset({ x, y });
  }, []);

  // Context value for child hooks/components
  const contextValue = useMemo<AgenationContextValue>(() => ({
    reportScrollOffset,
    scrollOffset,
    isAnnotationMode,
  }), [reportScrollOffset, scrollOffset, isAnnotationMode]);

  // Update current route periodically (navigation listener would be better but requires more integration)
  const updateCurrentRoute = useCallback(() => {
    const route = getCurrentRouteName();
    if (route !== currentRoute) {
      setCurrentRoute(route);
    }
  }, [currentRoute]);

  // Merge old and new callback names (new takes precedence)
  const mergedOnAdd = onAnnotationAdd || onAnnotationCreated;
  const mergedOnUpdate = onAnnotationUpdate || onAnnotationUpdated;
  const mergedOnDelete = onAnnotationDelete || onAnnotationDeleted;
  const mergedOnCopy = onCopy || onMarkdownCopied;

  // Wrap add callback to sync to server when connected
  const handleAnnotationCreated = useCallback((annotation: Annotation) => {
    // Call user callback first
    mergedOnAdd?.(annotation);
    // Sync to server if connected
    if (endpoint && sessionId) {
      syncToServer(annotation);
    }
  }, [mergedOnAdd, endpoint, sessionId, syncToServer]);

  // Convert DemoAnnotations to full Annotations if provided
  const initialAnnotations = useMemo(() => {
    if (!demoAnnotations || demoAnnotations.length === 0) {
      return undefined;
    }
    return convertDemoAnnotations(demoAnnotations);
  }, [demoAnnotations]);

  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
    copyMarkdown,
  } = useAnnotations({
    screenName: storageKey,
    initialAnnotations,
    onAnnotationCreated: handleAnnotationCreated,
    onAnnotationUpdated: mergedOnUpdate,
    onAnnotationDeleted: mergedOnDelete,
    onMarkdownCopied: mergedOnCopy,
    copyToClipboard,
    plugins,
  });

  const handleToggleMode = useCallback(() => {
    setIsAnnotationMode(prev => {
      const newMode = !prev;
      if (newMode) {
        onAnnotationModeEnabled?.();
      } else {
        onAnnotationModeDisabled?.();
        setSelectedAnnotation(null);
      }
      return newMode;
    });
  }, [onAnnotationModeEnabled, onAnnotationModeDisabled]);

  /**
   * Handle touch on the overlay (RN Inspector pattern)
   *
   * This captures the touch and extracts coordinates. We DON'T use the event
   * target - instead we'll pass coordinates to getInspectorDataForViewAtPoint
   * which does native shadow tree hit-testing to find the actual component.
   */
  const handleOverlayStartShouldSetResponder = useCallback(
    (e: GestureResponderEvent): boolean => {
      // Extract coordinates from touch (like RN Inspector does)
      const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
      const locationX = touch.locationX ?? touch.pageX;
      const locationY = touch.locationY ?? touch.pageY;

      debugLog('Overlay touch at:', locationX, locationY);

      // Store coordinates for hit-testing (no target needed!)
      setPendingTap({ x: locationX, y: locationY });
      setSelectedAnnotation(null);
      setPendingDetection(null);
      setPopupVisible(true);

      // Detect component immediately to show name in popup
      detectComponentAtPoint(contentRef.current, locationX, locationY)
        .then(detection => {
          setPendingDetection(detection);
        })
        .catch(() => {
          // Detection failed, popup will show "Component" as fallback
        });

      // Return true to become the responder
      return true;
    },
    []
  );

  const handleMarkerPress = useCallback((annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    setPendingTap({ x: annotation.x, y: annotation.y });
    setPopupVisible(true);
  }, []);

  // Edit handler for long-press context menu
  const handleMarkerEdit = useCallback((annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    setPendingTap({ x: annotation.x, y: annotation.y });
    setPopupVisible(true);
  }, []);

  // Delete handler for long-press context menu
  const handleMarkerDelete = useCallback(
    (id: string) => {
      deleteAnnotation(id);
    },
    [deleteAnnotation]
  );

  const handlePopupSave = useCallback(
    async (comment: string) => {
      // Update current route before saving
      updateCurrentRoute();

      if (selectedAnnotation) {
        // Update existing
        updateAnnotation(selectedAnnotation.id, comment);
      } else if (pendingTap) {
        // Create new - pass contentRef for native hit-testing at coordinates
        await createAnnotation(
          pendingTap.x,
          pendingTap.y,
          contentRef.current,
          comment
        );
      }

      setPopupVisible(false);
      setPendingTap(null);
      setSelectedAnnotation(null);
      setPendingDetection(null);
    },
    [selectedAnnotation, pendingTap, updateAnnotation, createAnnotation, updateCurrentRoute]
  );

  const handlePopupCancel = useCallback(() => {
    setPopupVisible(false);
    setPendingTap(null);
    setSelectedAnnotation(null);
    setPendingDetection(null);
  }, []);

  const handlePopupDelete = useCallback(() => {
    if (selectedAnnotation) {
      deleteAnnotation(selectedAnnotation.id);
    }
    setPopupVisible(false);
    setPendingTap(null);
    setSelectedAnnotation(null);
  }, [selectedAnnotation, deleteAnnotation]);

  const handleCopyMarkdown = useCallback(async () => {
    await copyMarkdown(settings.outputDetail);
    if (settings.clearAfterCopy) {
      clearAll();
    }
  }, [copyMarkdown, settings.outputDetail, settings.clearAfterCopy, clearAll]);

  // Send annotations to agent via MCP endpoint
  const handleSendToAgent = useCallback(async () => {
    if (!endpoint || annotations.length === 0) return;
    const { content } = generateMarkdown(annotations, currentRoute || storageKey, settings.outputDetail);
    await sendToAgent(annotations, content);
  }, [endpoint, annotations, currentRoute, storageKey, settings.outputDetail, sendToAgent]);

  // Wrap clearAll to call onAnnotationsClear callback
  const handleClearAll = useCallback(() => {
    if (onAnnotationsClear) {
      onAnnotationsClear([...annotations]);
    }
    clearAll();
  }, [clearAll, onAnnotationsClear, annotations]);

  // Sync current route on annotation changes
  useEffect(() => {
    const route = getCurrentRouteName();
    if (route !== currentRoute) {
      setCurrentRoute(route);
    }
  }, [annotations, currentRoute]);

  // Filter annotations to only show markers for current route
  const visibleAnnotations = useMemo(() => {
    return annotations.filter(annotation => {
      if (!annotation.routeName && !currentRoute) return true;
      if (!annotation.routeName) return true;
      return annotation.routeName === currentRoute;
    });
  }, [annotations, currentRoute]);

  // Memoize selected annotation index for the elevated marker
  const selectedAnnotationIndex = useMemo(() => {
    if (!selectedAnnotation) return -1;
    return visibleAnnotations.findIndex(a => a.id === selectedAnnotation.id);
  }, [visibleAnnotations, selectedAnnotation]);

  return (
    <AgenationContext.Provider value={contextValue}>
      <View style={styles.container} collapsable={false}>
        <View
          ref={contentRef}
          style={styles.content}
          collapsable={false}
        >
          {children}
        </View>

        <>
          {isAnnotationMode && !popupVisible && (
            <View
              style={styles.overlayTouch}
              onStartShouldSetResponder={handleOverlayStartShouldSetResponder}
            />
          )}

          <View style={styles.markersContainer} pointerEvents="box-none">
            {visibleAnnotations.map((annotation, index) => (
              <AnnotationMarker
                key={annotation.id}
                annotation={annotation}
                index={index}
                isSelected={selectedAnnotation?.id === annotation.id}
                onPress={() => handleMarkerPress(annotation)}
                onEdit={handleMarkerEdit}
                onDelete={handleMarkerDelete}
                scrollOffset={scrollOffset}
                color={settings.annotationColor}
              />
            ))}
          </View>

          <AnnotationPopup
            annotation={selectedAnnotation}
            position={pendingTap || { x: 0, y: 0 }}
            visible={popupVisible}
            onSave={handlePopupSave}
            onCancel={handlePopupCancel}
            onDelete={selectedAnnotation ? handlePopupDelete : undefined}
            detectedElement={formatDetectedElement(pendingDetection?.codeInfo || null)}
            toolbarHeight={toolbarHeight}
            settingsMenuHeight={isSettingsMenuOpen ? 140 : 0}
            accentColor={settings.annotationColor}
          />

          {/* Render selected marker above popup when editing */}
          {popupVisible && selectedAnnotation && selectedAnnotationIndex !== -1 && (
            <View style={styles.selectedMarkerContainer} pointerEvents="none">
              <AnnotationMarker
                annotation={selectedAnnotation}
                index={selectedAnnotationIndex}
                isSelected
                onPress={() => {}}
                scrollOffset={scrollOffset}
                color={settings.annotationColor}
                skipEntryAnimation
              />
            </View>
          )}

          <Toolbar
            isAnnotationMode={isAnnotationMode}
            annotationCount={annotations.length}
            onToggleMode={handleToggleMode}
            onCopyMarkdown={handleCopyMarkdown}
            onClearAll={handleClearAll}
            zIndex={zIndexBase}
            offset={toolbarOffset}
            annotationColor={settings.annotationColor}
            onAnnotationColorChange={handleAnnotationColorChange}
            outputDetail={settings.outputDetail}
            onOutputDetailChange={handleOutputDetailChange}
            clearAfterCopy={settings.clearAfterCopy}
            onClearAfterCopyChange={handleClearAfterCopyChange}
            onSettingsMenuChange={handleSettingsMenuChange}
            // Pause button (only shown if plugin provides it)
            showPauseButton={hasPausePlugin}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
            // MCP connection status (only when endpoint provided)
            mcpEndpoint={endpoint}
            connectionStatus={endpoint ? connectionStatus : undefined}
            // Send to Agent button (only when endpoint provided)
            showSendToAgent={!!endpoint}
            onSendToAgent={endpoint ? handleSendToAgent : undefined}
            // Webhook settings
            webhookUrl={settings.webhookUrl}
            onWebhookUrlChange={handleWebhookUrlChange}
            webhooksEnabled={settings.webhooksEnabled}
            onWebhooksEnabledChange={handleWebhooksEnabledChange}
          />
        </>
      </View>
    </AgenationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  markersContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  selectedMarkerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001, // Above popup overlay (999) and popup (1000)
  },
});
