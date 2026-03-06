/**
 * Agentation component tests
 * Matches web: package/src/components/page-toolbar-css/index.test.tsx
 *
 * Tests prop API surface and Annotation type shape.
 * No rendering (unit test only — rendering requires full RN environment).
 */

import type { Annotation, AgentationProps, AgenationProps, DemoAnnotation } from '../../types';

// =============================================================================
// AgentationProps type tests
// =============================================================================

describe('AgentationProps', () => {
  it('accepts onAnnotationAdd prop', () => {
    const props: AgentationProps = {
      children: null,
      onAnnotationAdd: (annotation: Annotation) => {
        expect(annotation).toHaveProperty('id');
      },
    };
    expect(props.onAnnotationAdd).toBeDefined();
  });

  it('accepts onAnnotationDelete prop', () => {
    const props: AgentationProps = {
      children: null,
      onAnnotationDelete: (annotation: Annotation) => {
        expect(annotation.id).toBeDefined();
      },
    };
    expect(props.onAnnotationDelete).toBeDefined();
  });

  it('accepts onAnnotationUpdate prop', () => {
    const props: AgentationProps = {
      children: null,
      onAnnotationUpdate: (_annotation: Annotation) => {},
    };
    expect(props.onAnnotationUpdate).toBeDefined();
  });

  it('accepts onAnnotationsClear prop', () => {
    const props: AgentationProps = {
      children: null,
      onAnnotationsClear: (annotations: Annotation[]) => {
        expect(Array.isArray(annotations)).toBe(true);
      },
    };
    expect(props.onAnnotationsClear).toBeDefined();
  });

  it('accepts onCopy prop', () => {
    const props: AgentationProps = {
      children: null,
      onCopy: (markdown: string) => {
        expect(typeof markdown).toBe('string');
      },
    };
    expect(props.onCopy).toBeDefined();
  });

  it('accepts onSubmit prop (web parity)', () => {
    const props: AgentationProps = {
      children: null,
      onSubmit: (output: string, annotations: Annotation[]) => {
        expect(typeof output).toBe('string');
        expect(Array.isArray(annotations)).toBe(true);
      },
    };
    expect(props.onSubmit).toBeDefined();
  });

  it('accepts copyToClipboard prop', () => {
    const propsTrue: AgentationProps = { children: null, copyToClipboard: true };
    const propsFalse: AgentationProps = { children: null, copyToClipboard: false };
    expect(propsTrue.copyToClipboard).toBe(true);
    expect(propsFalse.copyToClipboard).toBe(false);
  });

  it('accepts endpoint prop (web parity)', () => {
    const props: AgentationProps = {
      children: null,
      endpoint: 'http://localhost:4747',
    };
    expect(props.endpoint).toBe('http://localhost:4747');
  });

  it('accepts sessionId prop (web parity)', () => {
    const props: AgentationProps = {
      children: null,
      sessionId: 'session-abc-123',
    };
    expect(props.sessionId).toBe('session-abc-123');
  });

  it('accepts onSessionCreated prop', () => {
    const props: AgentationProps = {
      children: null,
      onSessionCreated: (id: string) => {
        expect(typeof id).toBe('string');
      },
    };
    expect(props.onSessionCreated).toBeDefined();
  });

  it('accepts webhookUrl prop', () => {
    const props: AgentationProps = {
      children: null,
      webhookUrl: 'https://hooks.example.com/agentation',
    };
    expect(props.webhookUrl).toBeDefined();
  });

  it('accepts disabled prop', () => {
    const props: AgentationProps = { children: null, disabled: true };
    expect(props.disabled).toBe(true);
  });

  it('accepts all props together', () => {
    const props: AgentationProps = {
      children: null,
      onAnnotationAdd: jest.fn(),
      onAnnotationDelete: jest.fn(),
      onAnnotationUpdate: jest.fn(),
      onAnnotationsClear: jest.fn(),
      onCopy: jest.fn(),
      onSubmit: jest.fn(),
      copyToClipboard: true,
      endpoint: 'http://localhost:4747',
      sessionId: 'sess-123',
      onSessionCreated: jest.fn(),
      webhookUrl: 'https://example.com/hook',
      disabled: false,
    };
    expect(props).toBeDefined();
  });

  it('AgenationProps is a deprecated alias for AgentationProps', () => {
    // Both should accept the same shape
    const props: AgenationProps = {
      children: null,
      onAnnotationAdd: jest.fn(),
    };
    expect(props).toBeDefined();
  });
});

// =============================================================================
// Annotation type tests
// Matches web: describe('Annotation type') in page-toolbar-css/index.test.tsx
// =============================================================================

describe('Annotation type', () => {
  it('includes all required fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 50,
      y: 100,
      comment: 'Test comment',
      element: 'Button',
      elementPath: 'src/components/Button.tsx',
      timestamp: Date.now(),
    };

    expect(annotation.id).toBe('test-id');
    expect(annotation.x).toBe(50);
    expect(annotation.y).toBe(100);
    expect(annotation.comment).toBe('Test comment');
    expect(annotation.element).toBe('Button');
    expect(annotation.elementPath).toBe('src/components/Button.tsx');
    expect(typeof annotation.timestamp).toBe('number');
  });

  it('allows optional shared metadata fields (web parity)', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 50,
      y: 100,
      comment: 'Test comment',
      element: 'Button',
      elementPath: 'src/components/Button.tsx',
      timestamp: Date.now(),
      selectedText: 'Selected text content',
      boundingBox: { x: 100, y: 200, width: 150, height: 40 },
      nearbyText: 'Context around the element',
      nearbyElements: 'div, span, a',
      fullPath: 'Screen > ScrollView > Form > Button',
      accessibility: 'role=button, aria-label=Submit',
      isMultiSelect: false,
      isFixed: false,
      // Web parity fields (not populated in RN but present for protocol compat)
      cssClasses: 'btn btn-primary',
      computedStyles: 'color: blue',
      reactComponents: '<App><Screen><Button>',
    };

    expect(annotation.selectedText).toBe('Selected text content');
    expect(annotation.boundingBox).toEqual({ x: 100, y: 200, width: 150, height: 40 });
    expect(annotation.fullPath).toBe('Screen > ScrollView > Form > Button');
    expect(annotation.accessibility).toBe('role=button, aria-label=Submit');
    expect(annotation.isMultiSelect).toBe(false);
    expect(annotation.isFixed).toBe(false);
  });

  it('allows RN-specific extension fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 50,
      y: 100,
      comment: 'Test comment',
      element: 'Button',
      elementPath: 'src/components/Button.tsx',
      timestamp: Date.now(),
      // RN-specific
      componentType: 'TouchableOpacity',
      sourcePath: 'src/components/Button.tsx',
      lineNumber: 42,
      columnNumber: 5,
      testID: 'submit-button',
      routeName: 'HomeScreen',
      platform: 'ios',
      screenDimensions: { width: 390, height: 844 },
      pixelRatio: 3,
    };

    expect(annotation.componentType).toBe('TouchableOpacity');
    expect(annotation.lineNumber).toBe(42);
    expect(annotation.testID).toBe('submit-button');
    expect(annotation.routeName).toBe('HomeScreen');
    expect(annotation.platform).toBe('ios');
  });

  it('allows V2 protocol fields', () => {
    const annotation: Annotation = {
      id: 'test-id',
      x: 50,
      y: 100,
      comment: 'Test comment',
      element: 'Button',
      elementPath: 'src/components/Button.tsx',
      timestamp: Date.now(),
      sessionId: 'sess-abc',
      intent: 'fix',
      severity: 'blocking',
      status: 'pending',
      createdAt: new Date().toISOString(),
      authorId: 'user-123',
    };

    expect(annotation.sessionId).toBe('sess-abc');
    expect(annotation.intent).toBe('fix');
    expect(annotation.severity).toBe('blocking');
    expect(annotation.status).toBe('pending');
  });
});

// =============================================================================
// DemoAnnotation type tests
// =============================================================================

describe('DemoAnnotation type', () => {
  it('includes required fields', () => {
    const demo: DemoAnnotation = {
      selector: 'Button.tsx:42',
      comment: 'This button needs better contrast',
    };
    expect(demo.selector).toBe('Button.tsx:42');
    expect(demo.comment).toBeDefined();
  });

  it('allows optional selectedText', () => {
    const demo: DemoAnnotation = {
      selector: 'Button.tsx:42',
      comment: 'This button needs better contrast',
      selectedText: 'Submit',
    };
    expect(demo.selectedText).toBe('Submit');
  });
});
