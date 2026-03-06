/**
 * useAnnotations Hook
 * Manages annotation state and operations
 *
 * NOTE: Storage loading/saving is handled by the parent component (Agentation)
 * to avoid setState-during-render issues with async effects.
 */

import { useState, useCallback } from 'react';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { debugError } from '../utils/debug';
import type { Annotation, OutputDetailLevel, AgentationPlugin, PluginContext, PluginExtra } from '../types';
import { generateId, getTimestamp, copyToClipboard } from '../utils/helpers';
import { detectComponentAtPoint, formatElementPath, getComponentType } from '../utils/componentDetection';
import { generateMarkdown } from '../utils/markdownGeneration';
import { getNavigationInfo, NavigationResolver } from '../utils/navigationDetection';

export interface UseAnnotationsOptions {
  /** Screen name for context (no longer used for storage) */
  screenName?: string;

  /** Initial annotations (demo mode) */
  initialAnnotations?: Annotation[];

  /** Callback when annotation created */
  onAnnotationAdd?: (annotation: Annotation) => void;

  /** Callback when annotation updated */
  onAnnotationUpdate?: (annotation: Annotation) => void;

  /** Callback when annotation deleted */
  onAnnotationDelete?: (annotation: Annotation) => void;

  /** Callback when markdown copied */
  onCopy?: (markdown: string) => void;

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
    screenName = 'default',
    initialAnnotations = [],
    onAnnotationAdd,
    onAnnotationUpdate,
    onAnnotationDelete,
    onCopy,
    copyToClipboard: shouldCopyToClipboard = true,
    navigationResolver,
    plugins = [],
  } = options;

  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);

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
        onAnnotationAdd?.(annotation);

        return annotation;
      } catch (error) {
        debugError('Failed to create annotation:', error);
        return null;
      }
    },
    [navigationResolver, onAnnotationAdd, plugins, screenName]
  );

  const updateAnnotation = useCallback(
    (id: string, comment: string) => {
      let updatedAnnotation: Annotation | undefined;

      setAnnotations(prev =>
        prev.map(ann => {
          if (ann.id === id) {
            updatedAnnotation = { ...ann, comment, timestamp: getTimestamp() };
            return updatedAnnotation;
          }
          return ann;
        })
      );

      if (updatedAnnotation) {
        onAnnotationUpdate?.(updatedAnnotation);
      }
    },
    [onAnnotationUpdate]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      let deletedAnnotation: Annotation | undefined;

      setAnnotations(prev => {
        deletedAnnotation = prev.find(ann => ann.id === id);
        return prev.filter(ann => ann.id !== id);
      });

      if (deletedAnnotation) {
        onAnnotationDelete?.(deletedAnnotation);
      }
    },
    [onAnnotationDelete]
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
      onCopy?.(finalContent);
    } catch (error) {
      debugError('Failed to copy markdown:', error);
      throw error;
    }
  }, [annotations, screenName, onCopy, shouldCopyToClipboard]);

  const getAnnotation = useCallback(
    (id: string) => {
      return annotations.find(ann => ann.id === id);
    },
    [annotations]
  );

  return {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    clearAll,
    copyMarkdown: copyMarkdownFn,
    getAnnotation,
  };
}
