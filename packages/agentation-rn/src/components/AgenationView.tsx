/**
 * AgenationView Component
 * Drop-in annotation layer for any context (modals, sheets, nested views)
 *
 * Usage:
 * ```tsx
 * import { AgenationView } from 'agentation-rn';
 *
 * <Modal>
 *   <AgenationView>
 *     <ModalContent />
 *   </AgenationView>
 * </Modal>
 * ```
 *
 * Features:
 * - Self-contained annotation layer
 * - Gracefully no-ops in production
 * - Works independently of main Agentation wrapper
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { debugLog } from '../utils/debug';
import { detectComponentAtPoint } from '../utils/componentDetection';
import type { Annotation, ComponentDetection } from '../types';
import { AnnotationMarker } from './AnnotationMarker';
import { AnnotationPopup } from './AnnotationPopup';
import { Toolbar } from './Toolbar';
import { copyToClipboard } from '../utils/helpers';

export interface AgenationViewProps {
  /** Content to wrap */
  children: React.ReactNode;
  /** Whether annotation mode is enabled (default: true in __DEV__) */
  enabled?: boolean;
  /** Callback when annotation is created */
  onAnnotationCreated?: (annotation: Partial<Annotation>) => void;
  /** Style for the container */
  style?: any;
}

/**
 * Format detected component info for display
 */
function formatDetectedElement(codeInfo: { relativePath?: string; lineNumber?: number; componentName?: string } | null): string | undefined {
  if (!codeInfo) return undefined;
  const filename = codeInfo.relativePath?.split('/').pop();
  if (filename) {
    return codeInfo.lineNumber ? `${filename}:${codeInfo.lineNumber}` : filename;
  }
  return codeInfo.componentName;
}

export function AgenationView({
  children,
  enabled = true,
  onAnnotationCreated,
  style,
}: AgenationViewProps) {
  // No-op in production
  if (!__DEV__ || !enabled) {
    return <View style={style}>{children}</View>;
  }

  const [annotations, setAnnotations] = useState<Partial<Annotation>[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [pendingTap, setPendingTap] = useState<{ x: number; y: number } | null>(null);
  const [pendingDetection, setPendingDetection] = useState<ComponentDetection | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnnotationMode, setIsAnnotationMode] = useState(true);
  const contentRef = useRef<View>(null);

  // Toolbar handlers
  const handleToggleMode = useCallback(() => {
    setIsAnnotationMode(prev => !prev);
  }, []);

  const handleCopyMarkdown = useCallback(async () => {
    if (annotations.length === 0) return;

    const markdown = annotations
      .map((ann, i) => {
        const location = ann.elementPath
          ? `${ann.elementPath}${ann.element ? ` (${ann.element})` : ''}`
          : ann.element || 'Unknown';
        return `${i + 1}. **${location}**\n   ${ann.comment || '(no comment)'}`;
      })
      .join('\n\n');

    await copyToClipboard(markdown);
    debugLog('Copied annotations to clipboard');
  }, [annotations]);

  const handleClearAll = useCallback(() => {
    setAnnotations([]);
  }, []);

  const handleOverlayTouch = useCallback(
    (e: GestureResponderEvent): boolean => {
      const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
      const locationX = touch.locationX ?? touch.pageX;
      const locationY = touch.locationY ?? touch.pageY;

      debugLog('AgenationView touch at:', locationX, locationY);

      setPendingTap({ x: locationX, y: locationY });
      setSelectedIndex(null);
      setPendingDetection(null);
      setPopupVisible(true);

      // Detect component
      detectComponentAtPoint(contentRef.current, locationX, locationY)
        .then(detection => {
          setPendingDetection(detection);
        })
        .catch(() => {});

      return true;
    },
    []
  );

  const handleMarkerPress = useCallback((index: number) => {
    const ann = annotations[index];
    setSelectedIndex(index);
    setPendingTap({ x: ann.x!, y: ann.y! });
    setPopupVisible(true);
  }, [annotations]);

  const handlePopupSave = useCallback((comment: string) => {
    if (selectedIndex !== null) {
      // Update existing
      setAnnotations(prev => prev.map((ann, i) =>
        i === selectedIndex ? { ...ann, comment } : ann
      ));
    } else if (pendingTap && pendingDetection?.codeInfo) {
      // Create new
      const newAnnotation: Partial<Annotation> = {
        x: pendingTap.x,
        y: pendingTap.y,
        comment,
        element: pendingDetection.codeInfo.componentName || 'Unknown',
        elementPath: pendingDetection.codeInfo.relativePath || '',
        timestamp: Date.now(),
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      onAnnotationCreated?.(newAnnotation);
    }

    setPopupVisible(false);
    setPendingTap(null);
    setPendingDetection(null);
    setSelectedIndex(null);
  }, [selectedIndex, pendingTap, pendingDetection, onAnnotationCreated]);

  const handlePopupCancel = useCallback(() => {
    setPopupVisible(false);
    setPendingTap(null);
    setPendingDetection(null);
    setSelectedIndex(null);
  }, []);

  const handlePopupDelete = useCallback(() => {
    if (selectedIndex !== null) {
      setAnnotations(prev => prev.filter((_, i) => i !== selectedIndex));
    }
    setPopupVisible(false);
    setPendingTap(null);
    setSelectedIndex(null);
  }, [selectedIndex]);

  return (
    <View style={[styles.container, style]} ref={contentRef} collapsable={false}>
      {/* Content */}
      {children}

      {/* Touch overlay (only when annotation mode enabled and popup closed) */}
      {isAnnotationMode && !popupVisible && (
        <View
          style={styles.overlay}
          onStartShouldSetResponder={handleOverlayTouch}
        />
      )}

      {/* Annotation markers */}
      {annotations.map((ann, index) => (
        <AnnotationMarker
          key={index}
          annotation={ann as Annotation}
          index={index}
          isSelected={selectedIndex === index}
          onPress={() => handleMarkerPress(index)}
        />
      ))}

      {/* Annotation popup */}
      <AnnotationPopup
        annotation={selectedIndex !== null ? annotations[selectedIndex] as Annotation : null}
        position={pendingTap || { x: 0, y: 0 }}
        visible={popupVisible}
        onSave={handlePopupSave}
        onCancel={handlePopupCancel}
        onDelete={selectedIndex !== null ? handlePopupDelete : undefined}
        detectedElement={formatDetectedElement(pendingDetection?.codeInfo || null)}
      />

      {/* Toolbar */}
      <Toolbar
        isAnnotationMode={isAnnotationMode}
        annotationCount={annotations.length}
        onToggleMode={handleToggleMode}
        onCopyMarkdown={handleCopyMarkdown}
        onClearAll={handleClearAll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
