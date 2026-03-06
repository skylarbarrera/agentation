# agentation-rn — Web Parity Plan (Detailed)

_Spec only. Parity only. No add-ons._

---

## Current State (Before)

### File Structure
```
src/
  components/
    Agentation.tsx           610 lines  — God component: 13 useState, 45 hooks total
    AgenationView.tsx         82 lines  — Simple wrapper view
    AnnotationMarker.tsx     122 lines  — Clean
    AnnotationPopup.tsx      432 lines  — Clean
    Icons.tsx                535 lines  — Clean, NOT exported
    Toolbar.tsx              981 lines  — God component: settings + expanded + FAB all in one
  context/
    AgenationContext.ts       45 lines  — Thin context definition
  hooks/
    useAgentationScroll.ts    68 lines
    useAgentationSync.ts     198 lines
    useAnnotations.ts        186 lines
    useToolbarAnimations.ts  112 lines
    useToolbarSettings.ts     89 lines
  types/
    index.ts                 900 lines  — Shared + RN-specific types mixed together
    plugin.ts                 72 lines
    v2.ts                     38 lines  — Protocol enums (duplicated from web/MCP)
  utils/
    animations.ts             45 lines
    componentDetection.ts    182 lines
    debug.ts                  28 lines
    fiberTraversal.ts        156 lines
    helpers.ts                34 lines
    markdownGeneration.ts    446 lines
    navigationDetection.ts   124 lines
    storage.ts               443 lines  — V1 + V2 + sync markers + settings, all mixed
    sync.ts                  245 lines
    webhooks.ts               82 lines
  index.ts                    50 lines  — Missing: Icons, AnnotationPopup, storage utils
```

**Total: 25 files, ~7,600 LOC, 0 tests**

### What's Exported (index.ts)
```ts
// Components
Agentation, AgenationView

// Hooks
useAnnotations, useAgentationScroll, useAgentationSync

// Context
AgenationContext, AgenationContextValue

// Types
Annotation, AgenationProps, DemoAnnotation, AgentationPlugin, PluginExtra,
AnnotationMarkerProps, AnnotationPopupProps,
AnnotationIntent, AnnotationSeverity, AnnotationStatus, Session, ...

// Utils (various scattered exports)
NavigationInfo, NavigationResolver, isAnnotation, isValidCodeInfo
```

### What Web Exports That RN Doesn't
```ts
// Components
AnnotationPopupCSS        → RN has AnnotationPopup but doesn't export it
Icons (all SVG components) → RN has Icons.tsx but doesn't export it

// Utils
loadAnnotations, saveAnnotations, getStorageKey, clearAnnotations,
loadAllAnnotations  → RN has these in storage.ts but doesn't export from index.ts

// Props
onSubmit              → Web has it, RN doesn't have the prop at all
```

### Naming Issues
- `AgenationProps` — missing 't', should be `AgentationProps`
- `AgenationContext` — same typo
- `AgenationView` — same typo

---

## Target State (After)

### File Structure Changes
```
src/
  components/
    Agentation.tsx           ~80 lines  — Shell: disabled check + Provider + children
    AgentationProvider.tsx   ~150 lines — NEW: all shared state, context value construction
    AnnotationOverlay.tsx    ~200 lines — NEW: touch capture, hit-testing, marker rendering
    AgenationView.tsx         82 lines  — Unchanged (deprecated alias added)
    AnnotationMarker.tsx     122 lines  — Unchanged
    AnnotationPopup.tsx      432 lines  — Unchanged, NOW EXPORTED
    Icons.tsx                535 lines  — Unchanged, NOW EXPORTED
    toolbar/
      Toolbar.tsx            ~100 lines — Container + FAB button only
      ToolbarExpanded.tsx    ~250 lines — Expanded state: action buttons, badge count
      SettingsPanel.tsx      ~250 lines — All settings UI
  context/
    AgentationContext.ts      45 lines  — Renamed (typo fix), deprecated alias kept
  hooks/                                — Unchanged
  types/
    shared.ts                ~120 lines — NEW: types identical to web, tagged // @shared
    rn.ts                    ~180 lines — NEW: RN-specific Annotation extensions
    index.ts                 ~100 lines — Re-exports: Annotation = SharedAnnotation & RNExtensions
    plugin.ts                 72 lines  — Unchanged
    v2.ts                              — DELETED: moved into shared.ts
  utils/                               — Unchanged (just add // @shared tags)
  index.ts                   ~80 lines — Updated: add missing exports
```

### What Changes in index.ts Exports

**Added:**
```ts
// Components (web parity)
export { AnnotationPopup } from './components/AnnotationPopup';
export type { AnnotationPopupProps } from './components/AnnotationPopup';
export * from './components/Icons';  // All icon components

// Props (web parity)
export type { AgentationProps } from './types';  // Fixed typo
export type { AgenationProps } from './types';    // Deprecated alias

// Storage utils (web parity)
export {
  loadAnnotations,
  saveAnnotations,
  getStorageKey,
  clearAnnotations,
  loadAllAnnotations,
} from './utils/storage';

// Sync utils (web parity)
export type { ActionResponse } from './utils/sync';
```

**Renamed (deprecated aliases kept):**
```ts
AgenationProps    → AgentationProps
AgenationContext  → AgentationContext
AgenationView    → AgentationView (keep both)
```

### Props Before vs After

```ts
// BEFORE (AgenationProps)
interface AgenationProps {
  children: React.ReactNode;
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
  copyToClipboard?: boolean;
  disabled?: boolean;
  storageKey?: string;
  onAnnotationModeEnabled?: () => void;
  onAnnotationModeDisabled?: () => void;
  zIndexBase?: number;
  toolbarOffset?: { x?: number; y?: number };
  theme?: { primary?: string; success?: string; danger?: string };
  endpoint?: string;
  initialSessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
  webhookUrl?: string;
  plugins?: AgentationPlugin[];
  // deprecated callbacks...
}

// AFTER (AgentationProps) — additions marked with ✚
interface AgentationProps {
  children: React.ReactNode;
  demoAnnotations?: DemoAnnotation[];
  demoDelay?: number;
  enableDemoMode?: boolean;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationsClear?: (annotations: Annotation[]) => void;
  onCopy?: (markdown: string) => void;
  onSubmit?: (output: string, annotations: Annotation[]) => void;  // ✚ WEB PARITY
  copyToClipboard?: boolean;
  disabled?: boolean;
  storageKey?: string;
  onAnnotationModeEnabled?: () => void;
  onAnnotationModeDisabled?: () => void;
  zIndexBase?: number;
  toolbarOffset?: { x?: number; y?: number };
  theme?: { primary?: string; success?: string; danger?: string };
  endpoint?: string;
  sessionId?: string;          // ✚ RENAMED from initialSessionId (web parity)
  initialSessionId?: string;   // deprecated alias
  onSessionCreated?: (sessionId: string) => void;
  webhookUrl?: string;
  plugins?: AgentationPlugin[];
}
```

### Types Before vs After

**BEFORE:** Everything in one 900-line `types/index.ts`

**AFTER:** Split into 3 files:

```ts
// types/shared.ts (~120 lines) — identical to web, tagged // @shared
// These types are protocol-level and must stay in sync with web + MCP

// @shared — candidate for agentation-types package
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
  cssClasses?: string;
  nearbyElements?: string;
  computedStyles?: string;
  fullPath?: string;
  accessibility?: string;
  isMultiSelect?: boolean;
  isFixed?: boolean;
  reactComponents?: string;
  elementBoundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  // Protocol fields
  sessionId?: string;
  url?: string;
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;
  status?: AnnotationStatus;
  thread?: ThreadMessage[];
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: 'human' | 'agent';
  authorId?: string;
  _syncedTo?: string;
};

// @shared
export type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve';
export type AnnotationSeverity = 'blocking' | 'important' | 'suggestion';
export type AnnotationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
export type SessionStatus = 'active' | 'approved' | 'closed';
export type Session = { id: string; url: string; status: SessionStatus; ... };
export type ThreadMessage = { id: string; role: 'human' | 'agent'; content: string; timestamp: number };
export type DemoAnnotation = { selector: string; comment: string; selectedText?: string };
```

```ts
// types/rn.ts (~180 lines) — RN-only extensions
export interface RNAnnotationExtensions {
  componentType?: string;
  sourcePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  testID?: string;
  routeName?: string;
  routeParams?: Record<string, unknown>;
  navigationPath?: string;
  platform?: 'ios' | 'android' | 'web';
  screenDimensions?: { width: number; height: number };
  pixelRatio?: number;
  pluginExtras?: Record<string, PluginExtra>;
  parentComponents?: string[];
}
```

```ts
// types/index.ts (~100 lines) — merge + re-export
import type { Annotation as SharedAnnotation } from './shared';
import type { RNAnnotationExtensions } from './rn';

export type Annotation = SharedAnnotation & RNAnnotationExtensions;

// Re-export everything
export * from './shared';
export * from './rn';
export * from './plugin';
```

---

## Sync/Storage Utils — Shared Tagging

No code changes, just comments identifying what's shared:

```ts
// utils/sync.ts
// @shared — these functions have identical signatures to web's utils/sync.ts
export async function listSessions(endpoint: string): Promise<Session[]> { ... }
export async function createSession(...): Promise<Session> { ... }
export async function getSession(...): Promise<SessionWithAnnotations> { ... }
export async function syncAnnotation(...): Promise<Annotation> { ... }
export async function updateAnnotation(...): Promise<Annotation> { ... }
export async function deleteAnnotation(...): Promise<void> { ... }
export async function requestAction(...): Promise<ActionResponse> { ... }

// @rn-only — RN-specific additions
export async function checkHealth(...): Promise<boolean> { ... }
export async function getPendingAnnotations(...): Promise<Annotation[]> { ... }
export async function getAllPendingAnnotations(...): Promise<...> { ... }
```

```ts
// utils/storage.ts
// @shared-interface — same function signatures as web, different backend (AsyncStorage vs localStorage)
export async function loadAnnotations(...): Promise<Annotation[]> { ... }
export async function saveAnnotations(...): Promise<void> { ... }
export function getStorageKey(...): string { ... }
export async function clearAnnotations(...): Promise<void> { ... }
export async function loadAllAnnotations(): Promise<Map<string, Annotation[]>> { ... }
export async function saveAnnotationsWithSyncMarker(...): Promise<void> { ... }
export async function getUnsyncedAnnotations(...): Promise<Annotation[]> { ... }
export async function clearSyncMarkers(...): Promise<void> { ... }
export async function loadSessionId(...): Promise<string | null> { ... }
export async function saveSessionId(...): Promise<void> { ... }
export async function clearSessionId(...): Promise<void> { ... }

// @rn-only
export async function saveSettings(...): Promise<void> { ... }
export async function loadSettings(): Promise<...> { ... }
export async function resetSettings(): Promise<void> { ... }
export async function getAllRouteNames(): Promise<string[]> { ... }
export async function getAllSessionIds(): Promise<...> { ... }
```

---

## Tests (Web Parity Only)

### Web has 3 test files:

1. **`page-toolbar-css/index.test.tsx`** (138 lines)
   - Renders without throwing
   - Accepts `onAnnotationAdd` prop
   - Accepts `copyToClipboard` prop
   - Annotation type has all required fields
   - Annotation type accepts optional metadata fields

2. **`react-detection.test.ts`** (363 lines)
   - Mock fiber traversal
   - Component name extraction from fiber
   - Skip patterns (ignores React internals)
   - Hierarchy detection

3. **`source-location.test.ts`** (1211 lines)
   - **Skip** — web-specific (parses source maps from DOM), no RN equivalent

### RN test plan:

**`__tests__/components/Agentation.test.tsx`** (match web test 1)
```ts
describe('Agentation', () => {
  it('renders without throwing')
  it('accepts onAnnotationAdd prop')
  it('accepts onSubmit prop')        // new prop
  it('accepts copyToClipboard prop')
  it('renders nothing when disabled={true}')
})

describe('Annotation type', () => {
  it('has all required shared fields')
  it('accepts optional metadata fields')
  it('accepts RN-specific extension fields')
})
```

**`__tests__/utils/componentDetection.test.ts`** (match web test 2)
```ts
describe('componentDetection', () => {
  it('extracts component name from mock fiber')
  it('skips React internal components')
  it('traverses fiber tree to find meaningful component')
  it('returns Unknown for unresolvable fibers')
})
```

---

## Decomposition Detail

### Agentation.tsx (610 → 80 + 150 + 200)

**BEFORE** — one file does everything:
- Provider setup (context value construction)
- Annotation CRUD state management
- Mode toggle (annotating on/off)
- Touch event handling (onTouchStart/End for hit-testing)
- Marker rendering (map over annotations, render markers)
- Popup state management (which annotation is selected)
- Overlay rendering (translucent overlay in annotation mode)
- Plugin lifecycle (onPause/onResume/onAnnotationCreated)
- Copy/submit action handling
- Settings state passthrough
- Storage persistence
- Sync hookup

**AFTER** — three files, single responsibility each:

**`Agentation.tsx` (~80 lines)** — Entry point shell
```tsx
export function Agentation({ children, disabled, ...props }: AgentationProps) {
  if (disabled) return <>{children}</>;
  return (
    <AgentationProvider {...props}>
      <AnnotationOverlay>
        {children}
      </AnnotationOverlay>
    </AgentationProvider>
  );
}
```

**`AgentationProvider.tsx` (~150 lines)** — All state + context
```tsx
// All useState, useAnnotations, useToolbarSettings, useAgentationSync
// Constructs the context value object
// Handles plugin lifecycle
// Manages annotation CRUD
export function AgentationProvider({ children, ...props }) {
  const annotations = useAnnotations({ storageKey, ... });
  const sync = useAgentationSync({ endpoint, ... });
  const settings = useToolbarSettings();
  // ... construct context value
  return (
    <AgentationContext.Provider value={contextValue}>
      {children}
      <Toolbar ... />
    </AgentationContext.Provider>
  );
}
```

**`AnnotationOverlay.tsx` (~200 lines)** — Touch + markers + popup
```tsx
// Touch event handling (onTouchStart/End)
// Component detection on tap
// Marker rendering (map over annotations)
// Popup state (selected annotation, position)
// Overlay tint when annotation mode active
export function AnnotationOverlay({ children }) {
  const { annotations, annotationMode, ... } = useContext(AgentationContext);
  // ... touch handlers, markers, popup
}
```

### Toolbar.tsx (981 → 100 + 250 + 250)

**BEFORE** — one file does everything:
- FAB rendering (collapsed state)
- Expanded toolbar (action buttons)
- Badge count
- Settings panel (all setting controls)
- Connection status
- Drag to reposition
- Animation (expand/collapse)
- Copy/submit handlers
- Theme colors

**AFTER:**

**`toolbar/Toolbar.tsx` (~100 lines)** — Container + FAB
```tsx
// Drag to reposition
// Collapsed → expanded toggle
// Renders FAB or ToolbarExpanded based on state
```

**`toolbar/ToolbarExpanded.tsx` (~250 lines)** — Action UI
```tsx
// Action buttons (copy, submit, clear, settings toggle)
// Badge with annotation count
// Connection status indicator
```

**`toolbar/SettingsPanel.tsx` (~250 lines)** — Settings UI
```tsx
// All settings controls (output detail, react detection, webhooks, etc.)
// Maps to useToolbarSettings hook
```

---

## Task Checklist

### Phase 1: Merge Upstream
- [ ] `git fetch upstream && git merge upstream/main`
- [ ] Resolve conflicts (likely in types, index.ts)
- [ ] Verify MCP protocol changes in sync.ts match upstream
- [ ] Verify `pointer-events` equivalent in overlay touch handling
- [ ] Test build: `pnpm build`

### Phase 2: API Parity
- [ ] Add `onSubmit` to props type
- [ ] Wire `onSubmit` to toolbar submit button
- [ ] Add `sessionId` prop (alias for `initialSessionId`)
- [ ] Wire `webhookUrl` prop to settings default value
- [ ] Export `AnnotationPopup` + `AnnotationPopupProps` from index.ts
- [ ] Export all icons from index.ts
- [ ] Export storage utils from index.ts (`loadAnnotations`, `saveAnnotations`, `getStorageKey`, `clearAnnotations`, `loadAllAnnotations`)
- [ ] Export `ActionResponse` type from sync.ts
- [ ] Rename `AgenationProps` → `AgentationProps` (keep deprecated alias)
- [ ] Rename `AgenationContext` → `AgentationContext` (keep deprecated alias)

### Phase 3: Decomposition
- [ ] Create `AgentationProvider.tsx` — extract state from Agentation.tsx
- [ ] Create `AnnotationOverlay.tsx` — extract touch/markers from Agentation.tsx
- [ ] Slim `Agentation.tsx` to shell
- [ ] Create `toolbar/Toolbar.tsx` — extract FAB
- [ ] Create `toolbar/ToolbarExpanded.tsx` — extract action buttons
- [ ] Create `toolbar/SettingsPanel.tsx` — extract settings UI
- [ ] Verify all imports resolve after split

### Phase 4: Type Organization
- [ ] Create `types/shared.ts` with web-identical types + `// @shared` tags
- [ ] Create `types/rn.ts` with RN-specific extensions
- [ ] Simplify `types/index.ts` to merge + re-export
- [ ] Delete `types/v2.ts` (moved into shared.ts)
- [ ] Add `// @shared` / `// @rn-only` tags to sync.ts functions
- [ ] Add `// @shared-interface` tags to storage.ts functions

### Phase 5: Tests
- [ ] Set up Jest + React Testing Library
- [ ] Write `Agentation.test.tsx` (match web toolbar test)
- [ ] Write `componentDetection.test.ts` (match web react-detection test)

### Verification
- [ ] `pnpm build` — types compile
- [ ] `pnpm test` — all tests pass
- [ ] Example app loads with no regressions
- [ ] All web props accepted without type errors
- [ ] All web exports available from `import { ... } from 'agentation-rn'`

---

## Estimated Effort

| Phase | Hours | Notes |
|-------|-------|-------|
| 1. Merge | 2-3h | Conflict resolution, verify protocol |
| 2. API parity | 1-2h | Props + exports, mostly wiring |
| 3. Decomposition | 4-5h | Careful extraction, preserve behavior |
| 4. Type organization | 1h | Move + tag, no logic changes |
| 5. Tests | 2-3h | Match web test patterns |
| **Total** | **~12h** | |
