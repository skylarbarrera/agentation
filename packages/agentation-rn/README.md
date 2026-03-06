# agentation-rn

React Native support for [Agentation](https://agentation.dev) — visual feedback tool for AI coding agents.

Tap any component in your app to annotate it, then copy structured markdown output for AI tools like Claude Code.

## Install

```bash
npm install agentation-rn
```

### Peer Dependencies

```bash
npm install react-native-safe-area-context
```

## Quick Start

```tsx
import { Agentation } from 'agentation-rn';

export default function App() {
  return (
    <Agentation>
      <YourApp />
    </Agentation>
  );
}
```

The toolbar appears in the bottom-right corner. Tap to activate, then tap any component to annotate it.

## Features

- **Tap to annotate** — Tap any component with automatic file/line number identification
- **Component detection** — Identifies React components with source paths via dev tools
- **Structured output** — Copy markdown with selectors, positions, and context
- **4 detail levels** — compact, standard, detailed, forensic
- **Dark/light mode** — Toggle in settings, persists via AsyncStorage
- **Navigation support** — Detects React Navigation routes
- **MCP integration** — Connect to AI agents via Model Context Protocol
- **Plugin system** — Extend with `agentation-reanimated-pause-state` and others

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAnnotationAdd` | `(annotation: Annotation) => void` | — | Called when an annotation is created |
| `onAnnotationDelete` | `(annotation: Annotation) => void` | — | Called when an annotation is deleted |
| `onAnnotationUpdate` | `(annotation: Annotation) => void` | — | Called when an annotation is edited |
| `onAnnotationsClear` | `(annotations: Annotation[]) => void` | — | Called when all annotations are cleared |
| `onCopy` | `(markdown: string) => void` | — | Callback with markdown output when copy is clicked |
| `onSubmit` | `(output: string, annotations: Annotation[]) => void` | — | Called when "Send to Agent" is clicked |
| `copyToClipboard` | `boolean` | `true` | Set to false to prevent writing to clipboard |
| `endpoint` | `string` | — | MCP server URL (e.g., `"http://localhost:4747"`) |
| `sessionId` | `string` | — | Pre-existing session ID to join |
| `onSessionCreated` | `(sessionId: string) => void` | — | Called when a new session is created |
| `webhookUrl` | `string` | — | Webhook URL to receive annotation events |
| `disabled` | `boolean` | `false` | Disable annotation mode entirely (for production builds) |
| `plugins` | `AgentationPlugin[]` | `[]` | Plugins to extend functionality |
| `children` | `ReactNode` | — | **Required** — your app content |

### Programmatic Integration

```tsx
import { Agentation, type Annotation } from 'agentation-rn';

function App() {
  const handleAnnotation = (annotation: Annotation) => {
    console.log(annotation.element);      // "Button"
    console.log(annotation.elementPath);  // "src/components/Button.tsx:42"
    console.log(annotation.boundingBox);  // { x, y, width, height }
    console.log(annotation.componentType); // "TouchableOpacity"
    sendToAgent(annotation);
  };

  return (
    <Agentation
      onAnnotationAdd={handleAnnotation}
      copyToClipboard={false}
    >
      <YourApp />
    </Agentation>
  );
}
```

### MCP Integration

```tsx
<Agentation
  endpoint="http://192.168.x.x:4747"
  sessionId="existing-session-id"         // optional — rejoin existing
  onSessionCreated={(id) => save(id)}
  onSubmit={(output, annotations) => {}}  // fired when "Send to Agent" clicked
  webhookUrl="https://api.example.com/hook"
>
  <YourApp />
</Agentation>
```

## Mobile-Specific APIs

### `useAgentationScroll`

Required for ScrollViews — keeps annotation markers positioned correctly during scroll.

```tsx
import { useAgentationScroll } from 'agentation-rn';

function MyScreen() {
  const { onScroll, scrollEventThrottle } = useAgentationScroll();

  return (
    <ScrollView onScroll={onScroll} scrollEventThrottle={scrollEventThrottle}>
      <YourContent />
    </ScrollView>
  );
}
```

### `<AgenationView>`

For Modals and Sheets — iOS modals render outside the normal view hierarchy and need their own annotation context.

```tsx
import { AgenationView } from 'agentation-rn';
import { Modal } from 'react-native';

function MyModal({ visible, onClose }) {
  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <AgenationView>
        <ModalContent />
      </AgenationView>
    </Modal>
  );
}
```

## Utilities

```tsx
import {
  // Component detection (web parity aliases)
  detectComponent,
  identifyElement,   // alias for detectComponent
  formatElementPath,
  getElementPath,    // alias for formatElementPath

  // Markdown generation
  generateMarkdown,

  // Storage (web parity)
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,
  getStorageKey,

  // Sync
  createSession,
  syncAnnotation,
  requestAction,
  listSessions,
} from 'agentation-rn';
```

## Annotation Type

```typescript
type Annotation = {
  // Required
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;

  // Optional shared fields (web parity)
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  nearbyElements?: string;
  fullPath?: string;
  accessibility?: string;
  isFixed?: boolean;

  // V2 protocol fields
  sessionId?: string;
  url?: string;
  intent?: 'fix' | 'change' | 'question' | 'approve';
  severity?: 'blocking' | 'important' | 'suggestion';
  status?: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  thread?: ThreadMessage[];
  createdAt?: string;
  updatedAt?: string;

  // RN-specific
  componentType?: string;
  sourcePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  testID?: string;
  routeName?: string;
  platform?: 'ios' | 'android' | 'web';
  screenDimensions?: { width: number; height: number };
  pluginExtras?: Record<string, unknown>;
};
```

## Output Example

Standard mode:

```markdown
## Page Feedback: HomeScreen
**Viewport:** 390×844
**Platform:** ios

### 1. LoginButton
**Location:** src/screens/Login.tsx:42
**React:** <App><Auth><LoginButton>
**Selected text:** "Log In"
**Feedback:** Button contrast too low
```

## Platform Support

| Platform | Status |
|----------|--------|
| iOS | ✅ Supported |
| Android | ✅ Supported |
| React Native | ≥ 0.72 |
| React | ≥ 18 |

## License

PolyForm-Shield-1.0.0
