# agentation-rn

React Native support for [Agentation](https://agentation.dev) - Visual feedback for AI coding agents.

Tap components in your app to create annotations, then copy structured markdown output for AI tools like Claude Code.

## Installation

```bash
npm install agentation-rn
# or
yarn add agentation-rn
# or
pnpm add agentation-rn
```

### Peer Dependencies

```bash
npm install react-native-safe-area-context
```

Optional (for enhanced features):
```bash
npm install @callstack/liquid-glass react-native-svg
```

## Quick Start

```tsx
import { Agentation } from 'agentation-rn';

export default function App() {
  return (
    <Agentation
      onAnnotationAdd={(annotation) => console.log('Added:', annotation)}
      onCopy={(markdown) => {
        // Send to your AI tool
        console.log('Markdown:', markdown);
      }}
    >
      <YourApp />
    </Agentation>
  );
}
```

## Features

- **Tap to Annotate** - Tap any component to create an annotation
- **Component Detection** - Automatically identifies React components with file paths and line numbers
- **Structured Output** - Generates AI-ready markdown with element context
- **4 Detail Levels** - compact, standard, detailed, forensic
- **Settings Persistence** - Saves preferences via AsyncStorage
- **Navigation Support** - Detects React Navigation routes
- **MCP Integration** - Connect to AI agents via Model Context Protocol (v2)
- **Session Management** - Group annotations by screen/route (v2)
- **Intent & Severity** - Classify feedback: fix/change/question + blocking/important/suggestion (v2)
- **Webhooks** - HTTP callbacks for annotation events (v2)

## V2 Features (MCP Integration)

### Connect to AI Agents

```tsx
<Agentation
  endpoint="http://localhost:4848"  // MCP server URL
  onSessionCreated={(sessionId) => console.log('Session:', sessionId)}
  webhookUrl="https://api.example.com/webhook"  // Optional webhook
>
  <YourApp />
</Agentation>
```

### Start the MCP Server

```bash
# Install globally
npm install -g agentation-rn-mcp

# Or run with npx
npx agentation-rn-mcp

# Options
npx agentation-rn-mcp --port 4848 --http-only
```

### Claude Code Configuration

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agentation-rn": {
      "command": "npx",
      "args": ["agentation-rn-mcp"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `agentation_list_sessions` | List all feedback sessions |
| `agentation_get_session` | Get session with annotations |
| `agentation_get_pending` | Get pending for session |
| `agentation_get_all_pending` | Get all pending annotations |
| `agentation_acknowledge` | Mark annotation acknowledged |
| `agentation_resolve` | Mark annotation resolved |
| `agentation_dismiss` | Dismiss annotation with reason |
| `agentation_reply` | Add reply to annotation thread |
| `agentation_wait_for_action` | Wait for "Send to Agent" button |

## API

### `<Agentation>`

Main wrapper component. Provides annotation functionality to your entire app.

```tsx
<Agentation
  // Callbacks
  onAnnotationAdd={(annotation) => {}}     // Called when annotation created
  onAnnotationUpdate={(annotation) => {}}  // Called when annotation edited
  onAnnotationDelete={(annotation) => {}}  // Called when annotation deleted
  onAnnotationsClear={(annotations) => {}} // Called when all cleared
  onCopy={(markdown) => {}}                // Called when markdown copied

  // V2 MCP Integration
  endpoint="http://192.168.x.x:4848"       // MCP server URL
  initialSessionId="abc123"                 // Rejoin existing session
  onSessionCreated={(sessionId) => {}}     // Called when session created
  webhookUrl="https://..."                  // Webhook for events

  // Options
  disabled={false}                          // Disable annotation mode
  copyToClipboard={true}                    // Auto-copy to clipboard
>
  <YourApp />
</Agentation>
```

### Mobile-Specific APIs

#### `useAgentationScroll`

Required for ScrollViews - keeps annotation markers positioned correctly during scroll.

```tsx
import { useAgentationScroll } from 'agentation-rn';

function MyScreen() {
  const { onScroll, scrollEventThrottle } = useAgentationScroll();

  return (
    <ScrollView
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
    >
      {/* Your content */}
    </ScrollView>
  );
}
```

#### `<AgenationView>`

For Modals and Sheets - provides isolated annotation context since iOS modals render outside the normal view hierarchy.

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

### Hooks

#### `useAnnotations`

Low-level hook for custom annotation UIs.

```tsx
import { useAnnotations } from 'agentation-rn';

const {
  annotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  clearAnnotations,
  copyToClipboard,
  settings,
  updateSettings,
} = useAnnotations({ screenName: 'MyScreen' });
```

#### `useAgentationSync`

Hook for MCP server synchronization.

```tsx
import { useAgentationSync } from 'agentation-rn';

const {
  connectionStatus,   // 'disconnected' | 'connecting' | 'connected'
  isConnected,
  sessionId,
  session,
  syncAnnotation,
  syncAll,
  sendToAgent,        // "Send to Agent" action
  reconnect,
} = useAgentationSync({
  endpoint: 'http://192.168.x.x:4848',
  routeName: 'HomeScreen',
  autoSync: true,
});
```

### Utilities

```tsx
import {
  // Component detection
  detectComponent,
  identifyElement, // alias for detectComponent
  formatElementPath,
  getElementPath,  // alias for formatElementPath

  // Markdown generation
  generateMarkdown,
  generateSimpleMarkdown,

  // Storage
  saveAnnotations,
  loadAnnotations,
  clearAnnotations,

  // V2 Sync
  createSession,
  syncAnnotation,
  requestAction,

  // Helpers
  copyToClipboard,
  generateId,
} from 'agentation-rn';
```

## V2 Types

```typescript
// Annotation with V2 protocol fields
type Annotation = {
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;

  // V2 Protocol fields
  sessionId?: string;
  intent?: 'fix' | 'change' | 'question' | 'approve';
  severity?: 'blocking' | 'important' | 'suggestion';
  status?: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  thread?: ThreadMessage[];

  // RN-specific
  componentType?: string;
  sourcePath?: string;
  lineNumber?: number;
  routeName?: string;
};

type Session = {
  id: string;
  url: string;  // routeName in RN
  status: 'active' | 'approved' | 'closed';
  createdAt: string;
};

type ThreadMessage = {
  id: string;
  role: 'human' | 'agent';
  content: string;
  timestamp: number;
};
```

## Platform Support

| Platform | Status |
|----------|--------|
| iOS | Supported |
| Android | Supported |
| React Native | >= 0.72.0 |
| React | >= 18.0.0 |

### Navigation Support

| Library | Status |
|---------|--------|
| React Navigation | Supported |
| Expo Router | Coming soon |

## Output Example

When you copy annotations, you get structured markdown:

```markdown
# App Feedback - MyScreen

## Annotation 1
- **Element:** Button (src/components/Button.tsx:42)
- **Comment:** This button should be larger
- **Intent:** fix
- **Severity:** important
- **Position:** x: 150, y: 320

## Annotation 2
- **Element:** Text (src/screens/Home.tsx:18)
- **Comment:** Font size too small on mobile
- **Intent:** change
- **Severity:** suggestion
- **Position:** x: 20, y: 180
```

## Running the Example

```bash
cd packages/agentation-rn/example
pnpm install

# Start MCP server (in separate terminal)
cd ../agentation-rn-mcp
npx agentation-rn-mcp --http-only

# iOS
pnpm ios

# Android
pnpm android
```

## Architecture

```
┌─────────────────┐    HTTP     ┌─────────────────┐    stdio    ┌─────────────┐
│   RN App        │────────────▶│  MCP Server     │◀───────────▶│ Claude Code │
│  (Expo/Metro)   │   :4848     │  (Node.js)      │     MCP     │   (Agent)   │
└─────────────────┘             └────────┬────────┘             └─────────────┘
                                         │
                                    ┌────▼────┐
                                    │ SQLite  │
                                    │~/.agentation-rn/│
                                    └─────────┘
```

## License

PolyForm-Shield-1.0.0
