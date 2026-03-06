# agentation-rn — Example App

Demo app for [agentation-rn](../README.md). Shows annotation, component detection, scroll/modal support, and MCP sync.

## Prerequisites

- **macOS** (iOS build requires Xcode)
- **Xcode 15+** — install from Mac App Store
- **Node.js 18+** — `node --version`
- **pnpm** — `npm install -g pnpm`
- **iOS Simulator** — comes with Xcode (or a physical iPhone)

> This uses `expo-dev-client` (a custom dev build), **not** Expo Go. You need to run a native build once.

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/skylarbarrera/agentation.git
cd agentation

# Install all workspace deps (from repo root)
pnpm install
```

### 2. Build the agentation-rn package

```bash
cd packages/agentation-rn
pnpm build
```

### 3. Install example deps and build for iOS

```bash
cd example

# Install CocoaPods (first time only)
npx pod-install ios

# Build and launch on iOS Simulator
pnpm ios
```

This compiles the native app and opens it in the iOS Simulator. Takes ~2–3 min the first time.

---

## Running After First Build

Once the native app is installed on the simulator, you can use the faster dev server:

```bash
cd packages/agentation-rn/example
pnpm start
```

Then press `i` to open in iOS Simulator — no rebuild needed.

---

## What's in the Example

| Screen | What it shows |
|--------|--------------|
| **Home** | Overview, quick start, component annotation demo |
| **Settings** | Demo settings UI (good for testing toggle/list annotations) |
| **Profile** | Demo profile UI |
| **ScrollView** | `useAgentationScroll` — markers stay pinned during scroll |
| **Modal** | `AgenationView` — annotations inside iOS modals |
| **Animations** | Animated components to annotate |

### Using the Toolbar

1. Tap the **✦ sparkle icon** in the bottom-right to activate annotation mode
2. **Tap** any component — see it highlighted with its file path
3. **Long press** to create an annotation and write feedback
4. Tap **Copy** to get markdown output
5. Tap **Send to Agent** to fire `onSubmit` (check the event log panel at the bottom)

### Event Log

A dev-only panel at the bottom of the screen shows every callback firing in real time — `onAnnotationAdd`, `onCopy`, `onSubmit`, etc. Useful for verifying the API is wired correctly.

---

## Troubleshooting

**`pod install` fails**
```bash
sudo gem install cocoapods
cd ios && pod install
```

**Simulator not found**
Open Xcode → Preferences → Components → download a simulator

**Metro bundler port conflict**
```bash
pnpm start --port 8082
```

**Build errors after pulling new changes**
```bash
# Rebuild the package first
cd packages/agentation-rn && pnpm build
# Then re-run the example
cd example && pnpm ios
```
