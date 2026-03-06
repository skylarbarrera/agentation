# @agentation/plugin-reanimated

Reanimated animation state plugin for Agentation. Adds pause/play functionality and captures animation state in markdown output.

## Installation

```bash
npm install @agentation/plugin-reanimated reanimated-pause-state
# or
pnpm add @agentation/plugin-reanimated reanimated-pause-state
```

## Usage

```tsx
import { Agentation } from 'agentation-rn';
import { reanimatedPausePlugin } from '@agentation/plugin-reanimated';

export function App() {
  return (
    <Agentation plugins={[reanimatedPausePlugin()]}>
      <YourApp />
    </Agentation>
  );
}
```

## Features

- **Pause/Play Button**: Adds a pause button to the Agentation toolbar that freezes all Reanimated animations
- **Animation State Capture**: When copying annotations, captures the current state of relevant animations in the markdown output

## Requirements

- `agentation-rn` >= 0.1.0
- `react-native-reanimated` >= 3.0.0
- `reanimated-pause-state` >= 0.1.0 (provides the pause/resume functionality)

## How It Works

The plugin uses `reanimated-pause-state` under the hood:

1. When user taps pause, it calls `pause()` to freeze all animations
2. When copying annotations, it captures animation state filtered by the annotated component
3. Animation state is appended to the markdown output for context
