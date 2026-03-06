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

## MCP Server (optional)

The example app connects to the Agentation MCP server at `http://localhost:4747` for syncing annotations to AI agents. Without it you'll see a "Network request failed" error on launch — this is safe to dismiss, the app works fully offline.

To enable sync, run the MCP server in a separate terminal:

```bash
# From repo root
cd mcp && pnpm start
```

This starts the HTTP server on port 4747. See [`mcp/README.md`](../../../mcp/README.md) for full configuration options.

## Using it

Tap **✦** in the bottom-right to activate. Tap any component to highlight it, long press to annotate. Copy gives you markdown, Send to Agent fires `onSubmit`. The event log at the bottom shows all callbacks firing live.
