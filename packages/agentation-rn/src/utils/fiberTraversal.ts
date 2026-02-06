/**
 * Fiber Traversal - Using React Native's built-in Inspector API
 *
 * Uses getInspectorDataForViewAtPoint from the React DevTools hook
 * which is the official way to get component info in React Native.
 */

import { findNodeHandle } from 'react-native';
import { debugLog } from './debug';

export interface FiberCodeInfo {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  componentName?: string;
}

export interface InspectorData {
  hierarchy: Array<{
    name: string;
    source?: {
      fileName: string;
      lineNumber: number;
      columnNumber?: number;
    };
    // RN Inspector provides getInspectorData method on hierarchy items
    getInspectorData?: (findNodeHandle: any) => {
      props: Record<string, any>;
      measure: (callback: (x: number, y: number, width: number, height: number, left: number, top: number) => void) => void;
    };
  }>;
  selectedIndex: number;
  frame: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  touchedViewTag?: number;
}

// Declare the global hook type
declare global {
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: {
    renderers?: Map<number, any>;
    getFiberRoots?: (rendererId: number) => Set<any>;
  } | undefined;
}

/**
 * Get inspector data for a view at specific coordinates
 * This uses React Native's built-in inspector API
 */
export function getInspectorDataForViewAtPoint(
  viewRef: any,
  x: number,
  y: number
): Promise<InspectorData | null> {
  return new Promise((resolve) => {
    const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || !hook.renderers) {
      debugLog(' No DevTools hook');
      resolve(null);
      return;
    }

    debugLog(' Renderers available:', hook.renderers.size);

    // Get the renderer's inspector function (via rendererConfig, not directly on renderer)
    for (const [rendererId, renderer] of hook.renderers) {
      const hasAPI = !!renderer?.rendererConfig?.getInspectorDataForViewAtPoint;
      debugLog(' Renderer', rendererId, 'has rendererConfig.getInspectorDataForViewAtPoint:', hasAPI);

      if (renderer?.rendererConfig?.getInspectorDataForViewAtPoint) {
        try {
          renderer.rendererConfig.getInspectorDataForViewAtPoint(
            viewRef,
            x,
            y,
            (data: any) => {
              debugLog(' Inspector data received');
              if (data) {
                debugLog(' Hierarchy length:', data.hierarchy?.length);
                debugLog(' Selected index:', data.selectedIndex);
                // Log each hierarchy item
                data.hierarchy?.forEach((item: any, i: number) => {
                  debugLog(`Hierarchy[${i}]: name=${item.name}, hasSource=${!!item.source}`);
                  if (item.source) {
                    debugLog(`  Source: ${item.source.fileName}:${item.source.lineNumber}`);
                  }
                });
              } else {
                debugLog(' No data returned from inspector');
              }
              resolve(data);
            }
          );
          return;
        } catch (e) {
          debugLog(' getInspectorDataForViewAtPoint error:', e);
        }
      }
    }

    resolve(null);
  });
}

/**
 * Get Fiber node from React Native view instance
 * Fallback method when inspector API isn't available
 */
export function getFiberFromInstance(instance: any): any | null {
  if (!instance) return null;

  // If it's a number (native tag), try to find via DevTools hook
  if (typeof instance === 'number') {
    return getFiberFromNativeTag(instance);
  }

  // If it's an object, try internal properties
  if (typeof instance === 'object') {
    for (const key of Object.keys(instance)) {
      if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
        return instance[key];
      }
    }

    const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && hook.renderers) {
      for (const [, renderer] of hook.renderers) {
        if (renderer.findFiberByHostInstance) {
          try {
            const fiber = renderer.findFiberByHostInstance(instance);
            if (fiber) return fiber;
          } catch (e) {
            // Ignore
          }
        }
      }
    }
  }

  return null;
}

function getFiberFromNativeTag(tag: number): any | null {
  debugLog(' getFiberFromNativeTag called with tag:', tag);
  const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || !hook.renderers || !hook.getFiberRoots) {
    debugLog(' Missing hook parts:', {
      hook: !!hook,
      renderers: !!hook?.renderers,
      getFiberRoots: !!hook?.getFiberRoots,
    });
    return null;
  }

  for (const [rendererId] of hook.renderers) {
    const roots = hook.getFiberRoots(rendererId);
    debugLog(' Renderer', rendererId, 'roots:', roots?.size || 0);
    for (const root of roots) {
      const fiber = findFiberByNativeTag(root.current, tag);
      if (fiber) {
        debugLog(' Found fiber for tag', tag);
        return fiber;
      }
    }
  }
  debugLog(' No fiber found for tag', tag);
  return null;
}

function findFiberByNativeTag(fiber: any, tag: number): any | null {
  if (!fiber) return null;
  if (fiber.stateNode && fiber.stateNode._nativeTag === tag) return fiber;
  const childResult = findFiberByNativeTag(fiber.child, tag);
  if (childResult) return childResult;
  return findFiberByNativeTag(fiber.sibling, tag);
}

/**
 * Find nearest user component with source info
 * Checks both React 18's _debugSource and react-native-dev-inspector's __callerSource prop
 */
export function findNearestUserComponentWithSource(fiber: any): FiberCodeInfo | null {
  if (!fiber) return null;

  let current = fiber;
  let iterations = 0;

  while (current && iterations < 50) {
    iterations++;

    // React 18 style: _debugSource on fiber
    if (current._debugSource) {
      debugLog(' Found _debugSource on fiber');
      return {
        fileName: current._debugSource.fileName || 'unknown',
        lineNumber: current._debugSource.lineNumber || 0,
        columnNumber: current._debugSource.columnNumber,
        componentName: getComponentName(current),
      };
    }

    // React 19 + react-native-dev-inspector: __callerSource in props
    const props = current.memoizedProps || current.pendingProps;
    if (props && props.__callerSource) {
      debugLog(' Found __callerSource in props:', JSON.stringify(props.__callerSource));
      return {
        fileName: props.__callerSource.fileName || 'unknown',
        lineNumber: props.__callerSource.lineNumber || 0,
        columnNumber: props.__callerSource.columnNumber,
        componentName: getComponentName(current),
      };
    }

    current = current.return;
  }

  return null;
}

/**
 * Find any user component (even without source)
 */
export function findNearestUserComponent(fiber: any): FiberCodeInfo | null {
  if (!fiber) return null;

  let current = fiber;
  let iterations = 0;
  let hostName: string | null = null;

  while (current && iterations < 50) {
    iterations++;
    const type = current.type;

    if (type && typeof type === 'string' && !hostName) {
      hostName = type;
    }

    if (type && typeof type === 'function') {
      const name = type.displayName || type.name;
      if (name && name !== 'Anonymous' && !name.startsWith('_')) {
        return {
          fileName: 'unknown',
          lineNumber: 0,
          componentName: name,
        };
      }
    }

    current = current.return;
  }

  if (hostName) {
    return {
      fileName: 'unknown',
      lineNumber: 0,
      componentName: hostName,
    };
  }

  return null;
}

function getComponentName(fiber: any): string {
  if (!fiber || !fiber.type) return 'Unknown';
  const type = fiber.type;
  if (typeof type === 'function') return type.displayName || type.name || 'Anonymous';
  if (typeof type === 'string') return type;
  return 'Unknown';
}

export function extractRelativePath(absolutePath: string): string {
  if (!absolutePath) return 'unknown';
  const markers = ['/src/', '/app/', '/components/', '/screens/'];
  for (const marker of markers) {
    const index = absolutePath.indexOf(marker);
    if (index !== -1) return absolutePath.slice(index + 1);
  }
  const parts = absolutePath.split('/');
  return parts[parts.length - 1] || absolutePath;
}

export function isComponentDetectionAvailable(): boolean {
  return __DEV__ && !!global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
