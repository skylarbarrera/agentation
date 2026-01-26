import { useState, useEffect, useCallback } from 'react';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { debugError } from '../utils/debug';
import type { Annotation, OutputDetailLevel } from '../types';
import { saveAnnotations, loadAnnotations } from '../utils/storage';
import { generateId, getTimestamp, copyToClipboard } from '../utils/helpers';
import { detectComponentAtPoint, formatElementPath, getComponentType } from '../utils/componentDetection';
import { generateMarkdown } from '../utils/markdownGeneration';
import { getNavigationInfo, NavigationResolver } from '../utils/navigationDetection';

export interface UseAnnotationsOptions {
  screenName: string;
  initialAnnotations?: Annotation[];
  onAnnotationCreated?: (annotation: Annotation) => void;
  onAnnotationUpdated?: (annotation: Annotation) => void;
  onAnnotationDeleted?: ((annotation: Annotation) => void) | ((annotationId: string) => void);
  onMarkdownCopied?: (markdown: string) => void;
  copyToClipboard?: boolean;
  navigationResolver?: NavigationResolver;
}

export interface UseAnnotationsReturn {
  annotations: Annotation[];
  loading: boolean;
  createAnnotation: (
    x: number,
    y: number,
    viewInstance: unknown,
    comment: string
  ) => Promise<Annotation | null>;
  updateAnnotation: (id: string, comment: string) => void;
  deleteAnnotation: (id: string) => void;
  clearAll: () => void;
  copyMarkdown: (outputDetail?: OutputDetailLevel) => Promise<void>;
  getAnnotation: (id: string) => Annotation | undefined;
}

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
  } = options;

  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnotationsFromStorage();
  }, [screenName]);

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
          fullPath,
          nearbyElements,
          isFixed,
        } = detection;

        const screenDims = Dimensions.get('window');
        const navInfo = getNavigationInfo(navigationResolver);

        const annotation: Annotation = {
          id: generateId(),
          x,
          y,
          comment,
          element: codeInfo.componentName || 'Unknown',
          elementPath: formatElementPath(codeInfo),
          timestamp: getTimestamp(),
          componentType: getComponentType(codeInfo),
          sourcePath: codeInfo.relativePath,
          lineNumber: codeInfo.lineNumber,
          columnNumber: codeInfo.columnNumber,
          boundingBox: bounds || undefined,
          parentComponents,
          accessibility,
          testID,
          nearbyText: textContent,
          fullPath,
          nearbyElements,
          isFixed,
          routeName: navInfo?.routeName,
          routeParams: navInfo?.routeParams,
          navigationPath: navInfo?.navigationPath,
          platform: Platform.OS as 'ios' | 'android' | 'web',
          screenDimensions: {
            width: screenDims.width,
            height: screenDims.height,
          },
          pixelRatio: PixelRatio.get(),
        };

        setAnnotations(prev => [...prev, annotation]);
        onAnnotationCreated?.(annotation);

        return annotation;
      } catch (error) {
        debugError('Failed to create annotation:', error);
        return null;
      }
    },
    [onAnnotationCreated]
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
      const annotation = annotations.find(a => a.id === id);

      setAnnotations(prev => prev.filter(ann => ann.id !== id));

      if (onAnnotationDeleted && annotation) {
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

      if (shouldCopyToClipboard) {
        await copyToClipboard(output.content);
      }

      onMarkdownCopied?.(output.content);
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
