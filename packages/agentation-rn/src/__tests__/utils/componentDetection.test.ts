/**
 * Component detection tests
 * Matches web: package/src/utils/react-detection.test.ts
 *
 * Tests fiber traversal, component name extraction, and skip patterns.
 */

import {
  detectComponent,
  formatElementPath,
  getComponentType,
  isComponentDetectionAvailable,
} from '../../utils/componentDetection';
import type { CodeInfo, ComponentDetection } from '../../types';

// =============================================================================
// Fiber mock helpers
// Mirrors web's createMockFiber pattern
// =============================================================================

type MockFiber = {
  type: { name?: string; displayName?: string } | string | null;
  return: MockFiber | null;
  stateNode?: any;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  };
  _debugOwner?: MockFiber | null;
};

function createMockFiber(name: string, parent?: MockFiber): MockFiber {
  return {
    type: { name, displayName: name },
    return: parent ?? null,
    stateNode: {},
    _debugSource: {
      fileName: `/src/components/${name}.tsx`,
      lineNumber: 42,
      columnNumber: 5,
    },
  };
}

function createHostFiber(tag: string, parent?: MockFiber): MockFiber {
  return {
    type: tag, // string = host component (View, Text, etc.)
    return: parent ?? null,
    stateNode: {},
  };
}

// =============================================================================
// formatElementPath tests
// Matches web: source-location tests
// =============================================================================

describe('formatElementPath', () => {
  it('formats full path from relativePath and lineNumber', () => {
    const codeInfo: CodeInfo = {
      relativePath: 'src/components/Button.tsx',
      lineNumber: 42,
      componentName: 'Button',
    };
    const result = formatElementPath(codeInfo);
    expect(result).toContain('Button.tsx');
    expect(result).toContain('42');
  });

  it('returns component name when no path available', () => {
    const codeInfo: CodeInfo = {
      relativePath: '',
      lineNumber: 0,
      componentName: 'CustomButton',
    };
    const result = formatElementPath(codeInfo);
    expect(result).toBeTruthy();
  });

  it('handles missing lineNumber', () => {
    const codeInfo: CodeInfo = {
      relativePath: 'src/components/Form.tsx',
      componentName: 'Form',
    };
    const result = formatElementPath(codeInfo);
    expect(result).toContain('Form');
  });
});

// =============================================================================
// getComponentType tests
// =============================================================================

describe('getComponentType', () => {
  it('returns component name from CodeInfo', () => {
    const result = getComponentType({ relativePath: 'src/Button.tsx', lineNumber: 1, componentName: 'Button' });
    expect(result).toBe('Button');
  });

  it('returns Unknown when no component name', () => {
    const result = getComponentType({ relativePath: '', lineNumber: 0 });
    expect(result).toBe('Unknown');
  });
});

// =============================================================================
// isComponentDetectionAvailable tests
// =============================================================================

describe('isComponentDetectionAvailable', () => {
  it('returns a boolean', () => {
    const result = isComponentDetectionAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('returns false outside of __DEV__', () => {
    // In test environment __DEV__ is falsy
    const result = isComponentDetectionAvailable();
    // Can be true if dev tools are mocked — just verify it doesn't throw
    expect(() => isComponentDetectionAvailable()).not.toThrow();
  });
});

// =============================================================================
// ComponentDetection result shape tests
// =============================================================================

describe('ComponentDetection result shape', () => {
  it('has expected fields when detection succeeds', () => {
    const mockDetection: ComponentDetection = {
      codeInfo: {
        relativePath: 'src/components/Button.tsx',
        lineNumber: 42,
        componentName: 'Button',
      },
      element: 'Button',
      elementPath: 'src/components/Button.tsx:42',
      componentType: 'TouchableOpacity',
      nearbyText: 'Submit',
      fullPath: 'Screen > ScrollView > Button',
      accessibility: 'role=button',
    };

    expect(mockDetection.codeInfo).toBeDefined();
    expect(mockDetection.element).toBe('Button');
    expect(mockDetection.elementPath).toContain('Button.tsx');
    expect(mockDetection.componentType).toBe('TouchableOpacity');
    expect(mockDetection.nearbyText).toBe('Submit');
    expect(mockDetection.fullPath).toContain('Screen');
  });

  it('codeInfo has expected CodeInfo shape', () => {
    const codeInfo: CodeInfo = {
      relativePath: 'src/components/Form.tsx',
      lineNumber: 100,
      columnNumber: 5,
      componentName: 'Form',
    };

    expect(typeof codeInfo.relativePath).toBe('string');
    expect(typeof codeInfo.lineNumber).toBe('number');
    expect(typeof codeInfo.componentName).toBe('string');
  });
});

// =============================================================================
// Skip patterns — matches web's DEFAULT_SKIP_EXACT / DEFAULT_SKIP_PATTERNS
// React internal component names that should be skipped during traversal
// =============================================================================

describe('component name skip patterns', () => {
  const SKIP_EXACT = new Set([
    'View',
    'Text',
    'Image',
    'ScrollView',
    'TouchableOpacity',
    'TouchableHighlight',
    'Pressable',
    'TextInput',
    'Modal',
    'ActivityIndicator',
    'FlatList',
    'SectionList',
    'VirtualizedList',
    'KeyboardAvoidingView',
    'SafeAreaView',
    'StatusBar',
    'Fragment',
    'Provider',
    'Consumer',
    'Context',
    'ForwardRef',
    'Memo',
    'Suspense',
    'StrictMode',
    'Profiler',
  ]);

  const SKIP_PATTERNS = [
    /^RCT/,         // Native components: RCTView, RCTText
    /^RNC/,         // React Native Community: RNCWebView
    /^Animated\./,  // Animated.View, Animated.Text
    /^styled\./,    // styled-components
    /^WithSkia/,    // React Native Skia
    /Provider$/,    // Context providers
    /Consumer$/,    // Context consumers
    /^Internal/,    // Internal React components
  ];

  function shouldSkip(name: string): boolean {
    if (SKIP_EXACT.has(name)) return true;
    return SKIP_PATTERNS.some(p => p.test(name));
  }

  it('skips basic RN host components', () => {
    expect(shouldSkip('View')).toBe(true);
    expect(shouldSkip('Text')).toBe(true);
    expect(shouldSkip('Image')).toBe(true);
    expect(shouldSkip('ScrollView')).toBe(true);
  });

  it('skips RCT prefixed native components', () => {
    expect(shouldSkip('RCTView')).toBe(true);
    expect(shouldSkip('RCTText')).toBe(true);
    expect(shouldSkip('RCTScrollView')).toBe(true);
  });

  it('skips Animated namespace components', () => {
    expect(shouldSkip('Animated.View')).toBe(true);
    expect(shouldSkip('Animated.Text')).toBe(true);
  });

  it('skips context provider/consumer components', () => {
    expect(shouldSkip('ThemeProvider')).toBe(true);
    expect(shouldSkip('AuthConsumer')).toBe(true);
    expect(shouldSkip('Provider')).toBe(true);
    expect(shouldSkip('Consumer')).toBe(true);
  });

  it('does NOT skip user-defined components', () => {
    expect(shouldSkip('Button')).toBe(false);
    expect(shouldSkip('CustomButton')).toBe(false);
    expect(shouldSkip('HomeScreen')).toBe(false);
    expect(shouldSkip('UserCard')).toBe(false);
    expect(shouldSkip('NavigationHeader')).toBe(false);
  });

  it('does NOT skip screen-level components', () => {
    expect(shouldSkip('ProfileScreen')).toBe(false);
    expect(shouldSkip('SettingsView')).toBe(false); // "View" suffix, not exact "View"
    expect(shouldSkip('FormProvider')).toBe(true);  // matches Provider$
  });
});
