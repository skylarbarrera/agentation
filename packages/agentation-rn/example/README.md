# agentation-rn example

**Requires:** macOS, Xcode 15+, Node 18+, pnpm

## Run

```bash
# From repo root
pnpm install
cd packages/agentation-rn && pnpm build

# First time (builds native app)
cd example && npx pod-install ios && pnpm ios

# After first build (fast restart)
pnpm start  # then press i
```

## Using it

Tap **✦** in the bottom-right to activate. Tap any component to highlight it, long press to annotate. Copy gives you markdown, Send to Agent fires `onSubmit`. The event log at the bottom shows all callbacks firing live.
