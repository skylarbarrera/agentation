# @agentation/plugin-reanimated

> ⚠️ **Experimental** - API may change

Reanimated animation state plugin for [Agentation RN](https://github.com/skylarbarrera/agentation).

Captures animation state when annotating components, so AI agents can see exactly what animations are running and their current values.

## Installation

```bash
npm install @agentation/plugin-reanimated reanimated-pause-state
```

### Babel Setup

Add the babel plugin **before** Reanimated's plugin:

```js
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'reanimated-pause-state/babel',   // MUST be before reanimated
    'react-native-reanimated/plugin', // MUST be last
  ],
};
```

## Usage

```tsx
import { Agentation } from 'agentation-rn';
import { reanimatedPausePlugin } from '@agentation/plugin-reanimated';

export function App() {
  return (
    <Agentation plugins={[reanimatedPausePlugin()]}>
      <Root />
    </Agentation>
  );
}
```

## What It Does

1. Adds a **pause/play button** to the toolbar
2. When paused, **freezes all Reanimated animations**
3. When you annotate a component, **captures animation state** for that component
4. Includes animation data in the copied markdown output

## Example Output

When you annotate an animated component, the markdown includes:

```markdown
## Animation State at Pause

### `translateY` (repeat)

| Property | Value |
|----------|-------|
| **Current** | `-24.89` |
| From → To | 0 → 0 |
| Elapsed | 10267ms |
| Location | `src/components/BouncingBall.tsx:29` |
| Component | `BouncingBall` |
| Repeat | infinite |
```

## Component Matching

The plugin automatically matches animations to the component you annotated:

- Tap on `BouncingBall` → shows only `BouncingBall`'s animations
- Uses component names from the babel plugin
- Falls back to file/line proximity if no name match

### For Best Results

Use named function components:

```tsx
// ✅ Good - component name captured
function BouncingBall() {
  const translateY = useSharedValue(0);
  translateY.value = withRepeat(withTiming(-100), -1, true);
  // ...
}

// ❌ Avoid - no name to match
const BouncingBall = () => { ... }
```

## API

### `reanimatedPausePlugin()`

Creates the plugin instance.

### `isReanimatedPauseStateAvailable()`

Check if reanimated-pause-state is installed.

```ts
import { isReanimatedPauseStateAvailable } from '@agentation/plugin-reanimated';

if (isReanimatedPauseStateAvailable()) {
  console.log('Ready!');
}
```

## Requirements

- `agentation-rn` >= 0.1.0
- `reanimated-pause-state` >= 0.1.0
- `react-native-reanimated` >= 3.0.0

## License

MIT
