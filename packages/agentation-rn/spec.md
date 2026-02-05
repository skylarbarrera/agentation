# Agentation RN v2 Migration Spec

## Workflow

**Branch:** `feat/v2-migration` (branched from `feat/plugin-system`)
**Spec file:** `packages/agentation-rn/spec.md` (this file)

### Progress Tracking

- [x] Phase 1: Schema Updates
- [x] Phase 2: Storage & Session Management
- [x] Phase 3: MCP Server Package
- [x] Phase 4: Toolbar Updates
- [ ] Phase 5: Webhook Support
- [ ] Phase 6: Sync Infrastructure

### Iteration Process

1. **Start phase:** Check the current phase checkbox as "in progress" `[-]`
2. **Implement:** Complete the phase following the spec
3. **Commit:** `git commit -m "feat(agentation-rn): Phase N - <description>"`
4. **Mark complete:** Check the phase checkbox `[x]`
5. **Stop:** Clear context, continue with next phase in new session

### Resuming Work

When starting a new session:
```
Read packages/agentation-rn/spec.md to see progress
Continue from the next unchecked phase
```

---

## Overview

Migrate `agentation-rn` to v2 feature parity with the web package. The creator confirmed v2 is "DOM-only by design" so RN needs a separate implementation, but we should match the v2 schema and protocol.

## Core Tenets

1. **100% parity with web** - Match v2 types, interfaces, and logic exactly where mobile constraints allow
2. **Copy-first approach** - Copy web source files directly, adapt only what's necessary for RN
3. **Reference links** - Every copied file links back to upstream source
4. **MCP verbatim** - Copy the entire MCP package, rename to `agentation-rn-mcp`
5. **Visual/Animation parity** - Must look and feel identical to web (same colors, shadows, animations, timing)
6. **Minimal dependencies** - Use only RN built-in APIs (Animated, not Reanimated). Add deps only when absolutely necessary

### Tenet Checklist (verify before each phase)

| Phase | Parity Check | Copy Source | Reference Link | Notes |
|-------|--------------|-------------|----------------|-------|
| Phase 1: Schema | Copy web types.ts verbatim | `package/src/types.ts` | `@see github.com/benjitaylor/agentation/.../types.ts` | Add RN fields as extensions, don't modify web fields |
| Phase 2: Storage | Same function signatures | `package/src/utils/storage.ts` | `@see ...storage.ts` | Only change: localStorage->AsyncStorage, sync->async |
| Phase 3: MCP | Exact copy | `mcp/` directory | `@see ...mcp/` | Only change: port 4848, db path |
| Phase 4: Toolbar | Visual parity required | Reference web SCSS | Link to web styles | Same colors, shadows, animations, timing |
| Phase 5: Webhooks | Same payload format | `package/src/...` | Link to web webhook | Match web payload structure exactly |
| Phase 6: Sync | Copy verbatim | `package/src/utils/sync.ts` | `@see ...sync.ts` | No changes - pure fetch API |

## V2 Feature Summary

| Feature | Web v2 | RN Current | RN v2 Target |
|---------|--------|------------|--------------|
| Annotation schema | Full AFS schema | Basic fields | Full AFS schema |
| Sessions | Per-URL sessions | Per-screen storage | Per-route sessions |
| MCP integration | 9 tools via stdio | None | Separate MCP package |
| Status lifecycle | pending->acknowledged->resolved | None | Full lifecycle |
| Threading | Agent/human replies | None | Full threading |
| Webhooks | HTTP POST callbacks | None | Webhook support |
| "Send to Agent" | Action request button | None | Toolbar button |
| Intent/Severity | Classification fields | None | Classification UI |

---

## Upstream Source References

All files should include a header comment linking to upstream:

```typescript
/**
 * Copied from upstream web package with RN adaptations
 * @see https://github.com/benjitaylor/agentation/blob/main/package/src/types.ts
 */
```

### Files to Copy Directly (No/Minimal Changes)

| Upstream File | RN File | Changes Needed |
|---------------|---------|----------------|
| `package/src/types.ts` | `src/types/v2.ts` | Add RN-specific fields as extensions |
| `package/src/utils/sync.ts` | `src/utils/sync.ts` | None - pure fetch API |
| `mcp/src/types.ts` | `../agentation-rn-mcp/src/types.ts` | None |
| `mcp/src/server/mcp.ts` | `../agentation-rn-mcp/src/server/mcp.ts` | None |
| `mcp/src/server/http.ts` | `../agentation-rn-mcp/src/server/http.ts` | Port 4848 (avoid 4747 conflict) |
| `mcp/src/server/store.ts` | `../agentation-rn-mcp/src/server/store.ts` | None |
| `mcp/src/server/sqlite.ts` | `../agentation-rn-mcp/src/server/sqlite.ts` | db path ~/.agentation-rn/ |
| `mcp/src/server/events.ts` | `../agentation-rn-mcp/src/server/events.ts` | None |
| `mcp/src/cli.ts` | `../agentation-rn-mcp/src/cli.ts` | Add RN-specific help text |

### Files to Adapt (Same Structure, RN APIs)

| Upstream File | RN File | Changes Needed |
|---------------|---------|----------------|
| `package/src/utils/storage.ts` | `src/utils/storage.ts` | localStorage -> AsyncStorage |

---

## Phase 1: Schema Updates

**Goal:** Copy web types.ts verbatim, extend with RN-specific fields

### Approach

1. Create `src/types/v2.ts` - exact copy of upstream `package/src/types.ts`
2. Update `src/types/index.ts` to import from v2 and re-export with extensions

### V2 Schema (from spec - web implementation pending)

```typescript
// Core v2 types to implement
export type Annotation = {
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;        // Web-only (keep for parity)
  nearbyElements?: string;
  computedStyles?: string;    // Web-only (keep for parity)
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  reactComponents?: string;
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;

  // Protocol fields (NEW in v2)
  sessionId?: string;
  url?: string;
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;
  status?: AnnotationStatus;
  thread?: ThreadMessage[];
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: "human" | "agent";
  authorId?: string;

  // Local sync tracking
  _syncedTo?: string;
};

export type AnnotationIntent = "fix" | "change" | "question" | "approve";
export type AnnotationSeverity = "blocking" | "important" | "suggestion";
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

export type Session = {
  id: string;
  url: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
};

export type SessionStatus = "active" | "approved" | "closed";

export type SessionWithAnnotations = Session & {
  annotations: Annotation[];
};

export type ThreadMessage = {
  id: string;
  role: "human" | "agent";
  content: string;
  timestamp: number;
};
```

### RN Extensions (add to existing types)

```typescript
// RN-specific fields added to Annotation
interface RNAnnotationExtensions {
  componentType?: string;     // RN component type (TouchableOpacity, etc.)
  sourcePath?: string;        // Relative path to source
  lineNumber?: number;        // Line in source
  columnNumber?: number;      // Column in source
  testID?: string;            // RN testID
  routeName?: string;         // Navigation route (RN equivalent of url)
  routeParams?: Record<string, unknown>;
  navigationPath?: string;    // Full navigation path
  platform?: 'ios' | 'android';
  screenDimensions?: { width: number; height: number };
  pluginExtras?: Record<string, PluginExtra>;
}

// In RN, Session uses routeName instead of url
interface RNSession extends Omit<Session, 'url'> {
  routeName: string;          // RN equivalent of url
  url?: string;               // Optional, for parity
}
```

---

## Phase 2: Storage & Session Management

**Goal:** Copy web storage.ts structure, adapt for AsyncStorage

### Copy structure, replace APIs

```typescript
// Web uses localStorage
const stored = localStorage.getItem(getStorageKey(pathname));
localStorage.setItem(getStorageKey(pathname), JSON.stringify(annotations));

// RN uses AsyncStorage (same signatures, async)
const stored = await AsyncStorage.getItem(getStorageKey(routeName));
await AsyncStorage.setItem(getStorageKey(routeName), JSON.stringify(annotations));
```

### Functions to copy (same signatures)

| Function | Description |
|----------|-------------|
| `getStorageKey(pathname)` | Returns storage key for route |
| `loadAnnotations(pathname)` | Load annotations for route |
| `saveAnnotations(pathname, annotations)` | Save annotations |
| `clearAnnotations(pathname)` | Clear route annotations |
| `loadAllAnnotations()` | Load all annotations across routes |
| `saveAnnotationsWithSyncMarker(pathname, annotations, sessionId)` | Save with sync tracking |
| `getUnsyncedAnnotations(pathname, sessionId?)` | Get unsynced annotations |
| `clearSyncMarkers(pathname)` | Remove sync markers |
| `getSessionStorageKey(pathname)` | Returns session storage key |
| `loadSessionId(pathname)` | Load session ID for route |
| `saveSessionId(pathname, sessionId)` | Save session ID |
| `clearSessionId(pathname)` | Clear session ID |

### Key changes for RN

1. **Async API** - All functions return Promise (AsyncStorage is async)
2. **Route-based** - `pathname` becomes `routeName`
3. **Same constants** - Keep `STORAGE_PREFIX`, `SESSION_PREFIX`, `DEFAULT_RETENTION_DAYS`

---

## Phase 3: MCP Server Package

**Goal:** Copy web's `mcp/` package verbatim as `agentation-rn-mcp`

### Copy process

```bash
# Step 1: Copy entire mcp/ directory
cp -r upstream:mcp/ packages/agentation-rn-mcp/

# Step 2: Update package.json
{
  "name": "agentation-rn-mcp",
  "description": "MCP server for Agentation React Native",
  "bin": {
    "agentation-rn-mcp": "./dist/cli.js"
  }
}

# Step 3: Minimal changes
- Port: 4848 (default, avoid 4747 conflict with web)
- DB path: ~/.agentation-rn/store.db (separate from web)
- CLI help: mention React Native
```

### MCP Tools (identical to web)

All 9 tools from web v2:

| Tool | Description |
|------|-------------|
| `agentation_list_sessions` | List all sessions |
| `agentation_get_session` | Get session with annotations |
| `agentation_get_pending` | Get pending for session |
| `agentation_get_all_pending` | Get all pending |
| `agentation_acknowledge` | Mark acknowledged |
| `agentation_resolve` | Mark resolved |
| `agentation_dismiss` | Dismiss with reason |
| `agentation_reply` | Add thread message |
| `agentation_wait_for_action` | Block until action |

### Architecture

```
+----------------+    HTTP     +----------------+    stdio    +-------------+
|   RN App       |------------>|  HTTP Server   |<----------->| Claude Code |
|  (Expo/Metro)  |   :4848     |  (Node.js)     |     MCP     |   (Agent)   |
+----------------+             +--------+-------+             +-------------+
                                        |
                                   +----v----+
                                   | SQLite  |
                                   |~/.agentation-rn/|
                                   +---------+
```

### Why copy, not share?

The creator said "v2 is DOM-only by design so RN would need a separate package." Having a separate MCP package:
- Avoids coupling RN to web release cycle
- Allows RN-specific DB path/port defaults
- Can add RN-specific features later (navigation context, etc.)

---

## Phase 4: Toolbar Updates

**Goal:** Add v2 UI features to RN toolbar (match web behavior, adapt UI for mobile)

### Parity requirements

**Props must match web:**
```typescript
// From web PageToolbar props - copy these exactly
endpoint?: string;               // MCP server URL
initialSessionId?: string;       // Session to rejoin
onSessionCreated?: (id: string) => void;
webhookUrl?: string;             // Webhook endpoint
enableDemoMode?: boolean;        // Demo mode
demoAnnotations?: DemoAnnotation[];
demoDelay?: number;
```

**Toolbar settings must match web:**
```typescript
// From web ToolbarSettings - copy exactly
type ToolbarSettings = {
  outputDetail: OutputDetailLevel;   // 'compact'|'standard'|'detailed'|'forensic'
  autoClearAfterCopy: boolean;       // Clear on copy/send
  annotationColor: string;           // Marker color
  blockInteractions: boolean;        // Block UI during annotation
  reactEnabled: boolean;             // React component detection
  markerClickBehavior: 'edit'|'delete';
  webhookUrl: string;
  webhooksEnabled: boolean;
};
```

### New toolbar capabilities

1. **"Send to Agent" button** (IconSendArrow)
   - Match web: `requestAction(endpoint, sessionId, output)` from sync.ts
   - Shows delivery confirmation matching web's `ActionResponse`

2. **Intent/Severity picker** (in annotation popup)
   - Copy web's options exactly:
   - Intent: `fix | change | question | approve`
   - Severity: `blocking | important | suggestion`

3. **Status indicators on markers**
   - Match web styling for each status:
   - Pending: default
   - Acknowledged: checkmark badge
   - Resolved: green checkmark
   - Dismissed: strikethrough/gray

4. **Connection status indicator**
   - Match web: `'disconnected' | 'connecting' | 'connected'`
   - 10-second health check interval (same as web)

### Files to modify
- `packages/agentation-rn/src/components/Toolbar.tsx`
- `packages/agentation-rn/src/components/AnnotationPopup.tsx`
- `packages/agentation-rn/src/components/AnnotationMarker.tsx`
- `packages/agentation-rn/src/components/Icons.tsx` (add new icons)

---

## Phase 5: Webhook Support

**Goal:** Fire webhooks on annotation events (match web format exactly)

### Implementation

Add `webhookUrl` prop to Agentation component (same as web):

```tsx
<Agentation
  webhookUrl="https://api.example.com/agentation-webhook"
>
```

### Events to fire (match web exactly)

| Event | Trigger |
|-------|---------|
| `annotation.created` | New annotation created |
| `annotation.updated` | Comment edited |
| `annotation.deleted` | Annotation deleted |
| `session.updated` | Session status changed |
| `action.requested` | "Send to Agent" clicked |

### Webhook payload (copy web's ActionRequest type)

```typescript
// From upstream:mcp/src/types.ts - copy exactly
type ActionRequest = {
  sessionId: string;
  annotations: Annotation[];
  output: string;         // Pre-formatted markdown
  timestamp: string;      // ISO 8601
};

// For RN, add routeName for context (extension, not replacement)
type RNActionRequest = ActionRequest & {
  routeName?: string;     // RN navigation route
};
```

### Implementation details

Copy web's webhook logic from `mcp/src/server/http.ts:sendWebhooks()`:
- Fire-and-forget (don't wait for response)
- Log errors but don't throw
- Support multiple webhook URLs via comma-separated config

---

## Phase 6: Sync Infrastructure

**Goal:** Copy web's sync.ts verbatim, integrate with RN

### Copy verbatim

The sync.ts file is pure fetch API - works in RN without changes:

```typescript
// These functions work identically in web and RN
export async function listSessions(endpoint: string): Promise<Session[]>
export async function createSession(endpoint: string, url: string): Promise<Session>
export async function getSession(endpoint: string, sessionId: string): Promise<SessionWithAnnotations>
export async function syncAnnotation(endpoint: string, sessionId: string, annotation: Annotation): Promise<Annotation>
export async function updateAnnotation(endpoint: string, annotationId: string, data: Partial<Annotation>): Promise<Annotation>
export async function deleteAnnotation(endpoint: string, annotationId: string): Promise<void>
export async function requestAction(endpoint: string, sessionId: string, output: string): Promise<ActionResponse>
```

### New hook: `useAgentationSync`

Wraps sync.ts functions with RN-specific behavior:

```typescript
const {
  isConnected,        // Health check status
  connectionStatus,   // 'disconnected' | 'connecting' | 'connected'
  sessionId,          // Current session ID
  sync,               // Force sync all annotations
} = useAgentationSync({
  serverUrl: 'http://192.168.1.x:4848',  // Dev machine IP
  autoSync: true,
  routeName: currentRouteName
});
```

### Connection flow (match web)

```typescript
// Same as web package/src/components/page-toolbar-css/index.tsx:580-680
useEffect(() => {
  // 1. On mount, try to join existing session or create new
  // 2. Health check every 10 seconds
  // 3. On reconnect, sync local annotations
}, [endpoint, routeName]);
```

### Props to add to Agentation

```typescript
interface AgenationProps {
  // ... existing props

  // V2 MCP integration (match web prop names)
  endpoint?: string;              // MCP HTTP server URL (web uses 'endpoint')
  initialSessionId?: string;      // Session to rejoin
  onSessionCreated?: (sessionId: string) => void;
}
```

---

## Design Decisions (Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session reuse | Reuse existing | Match web behavior - returning to screen shows annotations |
| Multi-device | Single device | Simpler; most devs use one simulator |
| Package location | This monorepo | Easier development; `packages/agentation-rn-mcp/` |
| Status updates | Polling (10s) | Match web - health check only, no real-time agent->app |

**Note on status updates:** Web v2 does NOT have real-time agent->browser updates. The "connected" status is just a 10-second health check. Agents can acknowledge/resolve but the browser only sees updates when it refreshes or re-fetches. We'll match this behavior.

---

## Implementation Order & Commit Templates

Each phase gets its own commit. Use these templates:

| Phase | Commit Message |
|-------|----------------|
| Phase 1 | `feat(agentation-rn): add v2 schema types with upstream parity` |
| Phase 2 | `feat(agentation-rn): add v2 session-based storage` |
| Phase 3 | `feat(agentation-rn-mcp): add MCP server package` |
| Phase 4 | `feat(agentation-rn): add v2 toolbar features (intent, severity, send)` |
| Phase 5 | `feat(agentation-rn): add webhook support` |
| Phase 6 | `feat(agentation-rn): add MCP sync infrastructure` |

**Order:**
1. **Schema updates** (Phase 1) - Foundation for everything else
2. **Storage & Sessions** (Phase 2) - Required for MCP integration
3. **MCP server package** (Phase 3) - Core v2 capability
4. **Toolbar updates** (Phase 4) - Intent/severity, Send to Agent, status
5. **Webhooks** (Phase 5) - Nice-to-have integration point
6. **Sync infrastructure** (Phase 6) - Connect app to server

---

## Files Summary

### Modify
- `packages/agentation-rn/src/types/index.ts` - Add v2 schema fields
- `packages/agentation-rn/src/utils/storage.ts` - Session-based storage
- `packages/agentation-rn/src/components/Toolbar.tsx` - Send to Agent button
- `packages/agentation-rn/src/components/AnnotationPopup.tsx` - Intent/severity
- `packages/agentation-rn/src/components/AnnotationMarker.tsx` - Status indicators
- `packages/agentation-rn/src/components/Icons.tsx` - New icons

### Create
- `packages/agentation-rn/src/types/v2.ts` - V2 schema types
- `packages/agentation-rn/src/utils/sessions.ts` - Session management
- `packages/agentation-rn/src/utils/sync.ts` - Server sync functions
- `packages/agentation-rn/src/hooks/useAgentationSync.ts` - Server sync hook
- `packages/agentation-rn-mcp/` - New MCP server package

---

## Visual & Animation Parity

**Goal:** RN toolbar must look and feel identical to web. Copy exact values.

### Design Tokens (copy exactly)

```typescript
// Colors - from web SCSS
const COLORS = {
  blue: '#3c82f7',
  red: '#ff3b30',
  green: '#34c759',
  background: '#1a1a1a',
  backgroundHover: '#2a2a2a',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.08)',
};

// Shadows - from web SCSS
const SHADOWS = {
  toolbar: '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)',
  popup: '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  badge: '0 1px 3px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
};

// Sizing - from web SCSS
const SIZING = {
  toolbarWidth: 297,        // expanded with server connection
  toolbarWidthNoServer: 257, // expanded without server
  toolbarCollapsed: 44,
  toolbarBorderRadius: 24,  // 1.5rem
  badgeSize: 18,
  popupWidth: 280,
  popupBorderRadius: 16,
};
```

### Animation Keyframes (match web exactly)

**Use React Native's built-in `Animated` API only - NO Reanimated dependency**

| Animation | Web CSS | RN Animated |
|-----------|---------|-------------|
| `toolbarEnter` | scale(0.5) rotate(90deg) -> scale(1) rotate(0deg), 500ms | `Animated.parallel([scale, rotate])` |
| `markerIn` | scale(0.3) -> scale(1), easeOut | `Animated.spring()` or `Animated.timing()` |
| `markerOut` | scale(1) -> scale(0.3), easeIn | `Animated.timing()` |
| `popupEnter` | scale(0.95) translateY(4px) -> scale(1) translateY(0), 200ms | `Animated.parallel([scale, translateY])` |
| `popupExit` | reverse, 150ms | `Animated.timing()` |
| `shake` | translateX oscillation, 250ms | `Animated.sequence([...])` |
| `scaleIn` | scale(0.85) -> scale(1), opacity 0->1 | `Animated.parallel([scale, opacity])` |
| `fadeIn/Out` | opacity 0<->1 | `Animated.timing()` |

### Easing Curves (copy web values)

```typescript
import { Easing } from 'react-native';

// Web uses cubic-bezier - convert to RN Easing.bezier
const EASINGS = {
  // cubic-bezier(0.19, 1, 0.22, 1) - "ease-out-expo" feel
  smooth: Easing.bezier(0.19, 1, 0.22, 1),
  // cubic-bezier(0.34, 1.2, 0.64, 1) - bouncy entrance
  bouncy: Easing.bezier(0.34, 1.2, 0.64, 1),
  // cubic-bezier(0.34, 1.56, 0.64, 1) - popup spring
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  // cubic-bezier(0.16, 1, 0.3, 1) - chevron rotation
  chevron: Easing.bezier(0.16, 1, 0.3, 1),
};
```

### Dependency Policy

**Core package must use ONLY:**
- React Native built-in APIs (`Animated`, `LayoutAnimation`, etc.)
- No external animation libraries (Reanimated, Moti, etc.)

**Optional plugins can use Reanimated** (e.g., `plugin-reanimated` for pause state)

### Animation Durations (copy web values)

```typescript
const DURATIONS = {
  toolbarEnter: 500,
  toolbarExpand: 400,     // width transition
  markerIn: 200,          // marker enter
  markerOut: 200,         // marker exit
  popupEnter: 200,
  popupExit: 150,
  shake: 250,
  badgeEnter: 300,        // with 400ms delay
  settingsPanel: 200,
  blur: 800,              // control content blur transition
};
```

### Specific Visual Details

**Toolbar:**
- Dark background `#1a1a1a`
- Rounded corners `1.5rem` (24px)
- Collapse to 44px circle
- Badge: `18px` height, `$blue` background, `0.625rem` font

**Popup:**
- Dark background `#1a1a1a`
- Rounded corners `16px`
- Width `280px`
- Box shadow with inset border effect

**Markers:**
- Numbered circles with `$blue` default
- Scale on hover (1.1x)
- Tooltip below on hover

---

## Do NOT Change (Parity Requirements)

These must remain identical to web - any deviation breaks protocol compatibility:

| Item | Why |
|------|-----|
| Annotation type structure | Agents expect consistent schema |
| Session type structure | MCP tools depend on these fields |
| ThreadMessage type | Agent replies use this format |
| MCP tool names | Claude Code configured for these names |
| MCP tool parameters | Agent tooling expects these signatures |
| HTTP API endpoints | `/sessions`, `/annotations/:id`, etc. |
| Webhook payload format | External integrations expect this |
| Status enum values | `pending\|acknowledged\|resolved\|dismissed` |
| Intent enum values | `fix\|change\|question\|approve` |
| Severity enum values | `blocking\|important\|suggestion` |
| Storage key prefixes | `feedback-annotations-`, `agentation-session-` |

### Allowed RN Extensions (additive only)

These can be added but must not replace web fields:

| Field | Purpose |
|-------|---------|
| `routeName` | RN navigation route (in addition to `url`) |
| `componentType` | RN component type |
| `sourcePath`, `lineNumber` | RN source location |
| `testID` | RN testID |
| `pluginExtras` | RN plugin system data |
| `platform` | `ios\|android` |

---

## Verification Plan

1. **Schema:** TypeScript compiles, existing annotations still load
2. **Sessions:** Annotations grouped by route, persist across app restarts
3. **MCP server:** `npx agentation-rn-mcp` starts, Claude Code can connect
4. **Toolbar:** "Send to Agent" delivers to MCP server
5. **Status:** Agent can acknowledge/resolve, markers update in app
6. **Webhooks:** External endpoint receives POST on events
7. **Parity test:** Web MCP server can read RN annotations (schema compatible)
8. **Visual test:** Side-by-side screenshot comparison of web vs RN toolbar
9. **Animation test:** Video capture shows matching animation timing and easing
