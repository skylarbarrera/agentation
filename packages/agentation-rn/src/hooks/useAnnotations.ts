/**
 * useAnnotations Hook
 * Manages annotation state, storage, and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { debugError } from '../utils/debug';
import type { Annotation, OutputDetailLevel, AgentationPlugin, PluginContext, PluginExtra } from '../types';
import { saveAnnotations, loadAnnotations } from '../utils/storage';
import { generateId, getTimestamp, copyToClipboard } from '../utils/helpers';
import { detectComponentAtPoint, formatElementPath, getComponentType } from '../utils/componentDetection';
import { generateMarkdown } from '../utils/markdownGeneration';
import { getNavigationInfo, NavigationResolver } from '../utils/navigationDetection';

export interface UseAnnotationsOptions {
  /** Screen name for storage key */
  screenName: string;

  /** Initial annotations (demo mode) */
  initialAnnotations?: Annotation[];

  /** Callback when annotation created */
  onAnnotationCreated?: (annotation: Annotation) => void;

  /** Callback when annotation updated */
  onAnnotationUpdated?: (annotation: Annotation) => void;

  /**
   * Callback when annotation deleted
   * Web parity: receives full annotation object
   * Legacy: receives just the ID (deprecated)
   */
  onAnnotationDeleted?: ((annotation: Annotation) => void) | ((annotationId: string) => void);

  /** Callback when markdown copied */
  onMarkdownCopied?: (markdown: string) => void;

  /**
   * Whether to copy to clipboard when copy button is clicked
   * Web parity: default true
   */
  copyToClipboard?: boolean;

  /**
   * Custom navigation resolver for route detection
   * Use this to integrate with navigation libraries other than React Navigation
   */
  navigationResolver?: NavigationResolver;

  /**
   * Plugins to call for extra markdown content
   * Each plugin's getExtras() is called when copying markdown
   */
  plugins?: AgentationPlugin[];
}

export interface UseAnnotationsReturn {
  /** Current annotations */
  annotations: Annotation[];

  /** Whether annotations are loading from storage */
  loading: boolean;

  /** Create new annotation from tap */
  createAnnotation: (
    x: number,
    y: number,
    viewInstance: unknown,
    comment: string
  ) => Promise<Annotation | null>;

  /** Update existing annotation */
  updateAnnotation: (id: string, comment: string) => void;

  /** Delete annotation */
  deleteAnnotation: (id: string) => void;

  /** Clear all annotations */
  clearAll: () => void;

  /** Generate and copy markdown */
  copyMarkdown: (outputDetail?: OutputDetailLevel) => Promise<void>;

  /** Get annotation by ID */
  getAnnotation: (id: string) => Annotation | undefined;
}

/**
 * Hook for managing annotations
 */
export function useAnnotations(
  options: UseAnnotationsOptions
): UseAnnotationsReturn {
  const {
    screenName,
    initialAnnotations = [],
    onAnnotationCreated,
    onAnnotationUpdated,
    onAnnotationDeleted,
    onMarkdownCopied,
    copyToClipboard: shouldCopyToClipboard = true,
    navigationResolver,
    plugins = [],
  } = options;

  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [loading, setLoading] = useState(true);

  // Load annotations from storage on mount
  useEffect(() => {
    loadAnnotationsFromStorage();
  }, [screenName]);

  // Save annotations when they change
  useEffect(() => {
    if (!loading) {
      saveAnnotationsToStorage();
    }
  }, [annotations, loading]);

  const loadAnnotationsFromStorage = async () => {
    try {
      setLoading(true);
      const loaded = await loadAnnotations(screenName);

      if (loaded.length > 0) {
        setAnnotations(loaded);
      }
    } catch (error) {
      debugError('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAnnotationsToStorage = async () => {
    try {
      await saveAnnotations(screenName, annotations);
    } catch (error) {
      debugError('Failed to save annotations:', error);
    }
  };

  const createAnnotation = useCallback(
    async (
      x: number,
      y: number,
      viewInstance: unknown,
      comment: string
    ): Promise<Annotation | null> => {
      try {
        // Detect component using coordinates and view ref
        const detection = await detectComponentAtPoint(viewInstance, x, y);

        if (!detection.success || !detection.codeInfo) {
          debugError('Component detection failed:', detection.error);
          return null;
        }

        const {
          codeInfo,
          bounds,
          parentComponents,
          accessibility,
          testID,
          textContent,
          // Web parity fields
          fullPath,
          nearbyElements,
          isFixed,
        } = detection;

        // Get device/environment context
        const screenDims = Dimensions.get('window');
        const navInfo = getNavigationInfo(navigationResolver);

        // Create annotation with all available data
        const annotation: Annotation = {
          id: generateId(),
          x,
          y,
          comment,
          element: codeInfo.componentName || 'Unknown',
          elementPath: formatElementPath(codeInfo),
          timestamp: getTimestamp(),

          // Component info
          componentType: getComponentType(codeInfo),
          sourcePath: codeInfo.relativePath,
          lineNumber: codeInfo.lineNumber,
          columnNumber: codeInfo.columnNumber,
          boundingBox: bounds || undefined,

          // Context from hierarchy
          parentComponents,
          accessibility,
          testID,
          nearbyText: textContent, // Map textContent to nearbyText for compatibility

          // Web parity fields
          fullPath,
          nearbyElements,
          isFixed,

          // Navigation context (RN equivalent of URL)
          routeName: navInfo?.routeName,
          routeParams: navInfo?.routeParams,
          navigationPath: navInfo?.navigationPath,

          // Device context
          platform: Platform.OS as 'ios' | 'android' | 'web',
          screenDimensions: {
            width: screenDims.width,
            height: screenDims.height,
          },
          pixelRatio: PixelRatio.get(),
        };

        // Capture plugin extras at annotation time (preserves state like animation snapshots)
        if (plugins.length > 0) {
          const ctx: PluginContext = {
            screenName,
            targetFile: codeInfo.relativePath,
            targetLine: codeInfo.lineNumber,
            componentName: codeInfo.componentName,
            parentComponents,
          };

          const pluginExtras: Record<string, PluginExtra> = {};
          for (const plugin of plugins) {
            if (plugin.getExtras) {
              try {
                const extra = plugin.getExtras(ctx);
                if (extra) {
                  pluginExtras[plugin.id] = extra;
                }
              } catch (e) {
                debugError(`Plugin ${plugin.id} getExtras failed:`, e);
              }
            }
          }

          if (Object.keys(pluginExtras).length > 0) {
            annotation.pluginExtras = pluginExtras;
          }
        }

        // Add to state
        setAnnotations(prev => [...prev, annotation]);

        // Callback
        onAnnotationCreated?.(annotation);

        return annotation;
      } catch (error) {
        debugError('Failed to create annotation:', error);
        return null;
      }
    },
    [onAnnotationCreated, plugins, screenName]
  );

  const updateAnnotation = useCallback(
    (id: string, comment: string) => {
      setAnnotations(prev =>
        prev.map(ann =>
          ann.id === id
            ? { ...ann, comment, timestamp: getTimestamp() }
            : ann
        )
      );

      const updated = annotations.find(a => a.id === id);
      if (updated) {
        onAnnotationUpdated?.({ ...updated, comment });
      }
    },
    [annotations, onAnnotationUpdated]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      // Find annotation before deleting (for callback)
      const annotation = annotations.find(a => a.id === id);

      setAnnotations(prev => prev.filter(ann => ann.id !== id));

      // Call callback with annotation if found, otherwise ID
      if (onAnnotationDeleted && annotation) {
        // Try to call with full annotation (web API)
        // If callback expects string, TypeScript will handle it
        (onAnnotationDeleted as (annotation: Annotation) => void)(annotation);
      }
    },
    [onAnnotationDeleted, annotations]
  );

  const clearAll = useCallback(() => {
    setAnnotations([]);
  }, []);

  const copyMarkdownFn = useCallback(async (outputDetail?: OutputDetailLevel) => {
    try {
      const output = generateMarkdown(annotations, screenName, outputDetail);
      let finalContent = output.content;

      // Collect stored plugin extras from all annotations
      // (captured at annotation time to preserve state like animation snapshots)
      const allExtras: PluginExtra[] = [];
      const seenPlugins = new Set<string>();

      for (const annotation of annotations) {
        if (annotation.pluginExtras) {
          for (const [pluginId, extra] of Object.entries(annotation.pluginExtras)) {
            // Include each plugin's extras (could dedupe by pluginId if needed)
            if (!seenPlugins.has(pluginId)) {
              allExtras.push(extra);
              seenPlugins.add(pluginId);
            }
          }
        }
      }

      // Append extras to markdown
      if (allExtras.length > 0) {
        finalContent += '\n---\n\n## Plugin Data\n\n';
        for (const extra of allExtras) {
          finalContent += extra.markdown + '\n\n';
        }
      }

      // Only copy to clipboard if enabled (web parity)
      if (shouldCopyToClipboard) {
        await copyToClipboard(finalContent);
      }

      // Always call callback with markdown content
      onMarkdownCopied?.(finalContent);
    } catch (error) {
      debugError('Failed to copy markdown:', error);
      throw error;
    }
  }, [annotations, screenName, onMarkdownCopied, shouldCopyToClipboard]);

  const getAnnotation = useCallback(
    (id: string) => {
      return annotations.find(ann => ann.id === id);
    },
    [annotations]
  );

  return {
    annotations,
    loading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
    copyMarkdown: copyMarkdownFn,
    getAnnotation,
  };
}
