// src/types.ts
var DEFAULT_CONFIG = {
  port: 4848,
  dbPath: "~/.agentation-rn/store.db"
};

// src/server/sqlite.ts
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { homedir } from "os";
function expandPath(path) {
  if (path.startsWith("~")) {
    return path.replace("~", homedir());
  }
  return resolve(path);
}
function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
function createDatabase(dbPath) {
  const expandedPath = expandPath(dbPath);
  ensureDir(expandedPath);
  const db = new Database(expandedPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT,
      project_id TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_annotations_session ON annotations(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_url ON sessions(url);
  `);
  return db;
}
function createSession(db, id, url, projectId, metadata) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const stmt = db.prepare(`
    INSERT INTO sessions (id, url, status, created_at, project_id, metadata)
    VALUES (?, ?, 'active', ?, ?, ?)
  `);
  stmt.run(id, url, now, projectId ?? null, metadata ? JSON.stringify(metadata) : null);
  return {
    id,
    url,
    status: "active",
    createdAt: now,
    projectId,
    metadata
  };
}
function getSession(db, sessionId) {
  const stmt = db.prepare(`
    SELECT id, url, status, created_at, updated_at, project_id, metadata
    FROM sessions
    WHERE id = ?
  `);
  const row = stmt.get(sessionId);
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? void 0,
    projectId: row.project_id ?? void 0,
    metadata: row.metadata ? JSON.parse(row.metadata) : void 0
  };
}
function getSessionWithAnnotations(db, sessionId) {
  const session = getSession(db, sessionId);
  if (!session) return null;
  const annotations = getAnnotationsForSession(db, sessionId);
  return {
    ...session,
    annotations
  };
}
function listSessions(db, status, limit = 100) {
  let query = `
    SELECT id, url, status, created_at, updated_at, project_id, metadata
    FROM sessions
  `;
  const params = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? void 0,
    projectId: row.project_id ?? void 0,
    metadata: row.metadata ? JSON.parse(row.metadata) : void 0
  }));
}
function findSessionByUrl(db, url) {
  const stmt = db.prepare(`
    SELECT id, url, status, created_at, updated_at, project_id, metadata
    FROM sessions
    WHERE url = ? AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const row = stmt.get(url);
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? void 0,
    projectId: row.project_id ?? void 0,
    metadata: row.metadata ? JSON.parse(row.metadata) : void 0
  };
}
function upsertAnnotation(db, annotation) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const data = JSON.stringify(annotation);
  const stmt = db.prepare(`
    INSERT INTO annotations (id, session_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    annotation.id,
    annotation.sessionId,
    data,
    annotation.createdAt ?? now,
    now
  );
  return annotation;
}
function getAnnotation(db, annotationId) {
  const stmt = db.prepare(`
    SELECT data FROM annotations WHERE id = ?
  `);
  const row = stmt.get(annotationId);
  if (!row) return null;
  return JSON.parse(row.data);
}
function getAnnotationsForSession(db, sessionId) {
  const stmt = db.prepare(`
    SELECT data FROM annotations
    WHERE session_id = ?
    ORDER BY created_at ASC
  `);
  const rows = stmt.all(sessionId);
  return rows.map((row) => JSON.parse(row.data));
}
function updateAnnotation(db, annotationId, updates) {
  const existing = getAnnotation(db, annotationId);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return upsertAnnotation(db, updated);
}
function deleteAnnotation(db, annotationId) {
  const stmt = db.prepare("DELETE FROM annotations WHERE id = ?");
  const result = stmt.run(annotationId);
  return result.changes > 0;
}
function getPendingAnnotations(db, sessionId) {
  const annotations = getAnnotationsForSession(db, sessionId);
  return annotations.filter((a) => a.status === "pending" || !a.status);
}
function getAllPendingAnnotations(db) {
  const stmt = db.prepare(`
    SELECT data FROM annotations
    ORDER BY created_at ASC
  `);
  const rows = stmt.all();
  const annotations = rows.map((row) => JSON.parse(row.data));
  return annotations.filter((a) => a.status === "pending" || !a.status);
}

// src/server/http.ts
import express from "express";
import cors from "cors";

// src/utils.ts
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function parseWebhookUrls(urlString) {
  if (!urlString) return [];
  return urlString.split(",").map((url) => url.trim()).filter((url) => url.length > 0);
}

// src/server/http.ts
var VERSION = "0.1.0";
var actionListeners = /* @__PURE__ */ new Map();
function onAction(sessionId, listener) {
  const listeners = actionListeners.get(sessionId) ?? [];
  listeners.push(listener);
  actionListeners.set(sessionId, listeners);
  return () => {
    const updated = (actionListeners.get(sessionId) ?? []).filter((l) => l !== listener);
    if (updated.length === 0) {
      actionListeners.delete(sessionId);
    } else {
      actionListeners.set(sessionId, updated);
    }
  };
}
function emitAction(request) {
  const listeners = actionListeners.get(request.sessionId) ?? [];
  listeners.forEach((listener) => listener(request));
}
async function sendWebhooks(urls, payload) {
  for (const url of urls) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error(`Webhook failed for ${url}:`, error);
    }
  }
}
function createHttpServer(db, webhookUrls = []) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => {
    const response = { status: "ok", version: VERSION };
    res.json(response);
  });
  app.get("/sessions", (req, res) => {
    const status = req.query.status;
    const limit = parseInt(req.query.limit) || 100;
    const sessions = listSessions(
      db,
      status,
      limit
    );
    res.json(sessions);
  });
  app.post("/sessions", (req, res) => {
    const { url, projectId, metadata } = req.body;
    if (!url) {
      res.status(400).json({ error: "url is required" });
      return;
    }
    const existing = findSessionByUrl(db, url);
    if (existing) {
      res.json(existing);
      return;
    }
    const id = generateId();
    const session = createSession(db, id, url, projectId, metadata);
    res.status(201).json(session);
  });
  app.get("/sessions/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    const session = getSessionWithAnnotations(db, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  });
  app.post("/sessions/:sessionId/annotations", (req, res) => {
    const { sessionId } = req.params;
    const annotation = req.body;
    const session = getSession(db, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (!annotation.id) {
      annotation.id = generateId();
    }
    annotation.sessionId = sessionId;
    annotation.createdAt = annotation.createdAt ?? (/* @__PURE__ */ new Date()).toISOString();
    annotation.status = annotation.status ?? "pending";
    const saved = upsertAnnotation(db, annotation);
    if (webhookUrls.length > 0) {
      sendWebhooks(webhookUrls, {
        event: "annotation.created",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: { sessionId, annotation: saved }
      });
    }
    res.status(201).json(saved);
  });
  app.patch("/annotations/:annotationId", (req, res) => {
    const { annotationId } = req.params;
    const updates = req.body;
    const updated = updateAnnotation(db, annotationId, updates);
    if (!updated) {
      res.status(404).json({ error: "Annotation not found" });
      return;
    }
    if (webhookUrls.length > 0) {
      sendWebhooks(webhookUrls, {
        event: "annotation.updated",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: { annotation: updated }
      });
    }
    res.json(updated);
  });
  app.delete("/annotations/:annotationId", (req, res) => {
    const { annotationId } = req.params;
    const annotation = getAnnotation(db, annotationId);
    const deleted = deleteAnnotation(db, annotationId);
    if (!deleted) {
      res.status(404).json({ error: "Annotation not found" });
      return;
    }
    if (webhookUrls.length > 0 && annotation) {
      sendWebhooks(webhookUrls, {
        event: "annotation.deleted",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: { annotation }
      });
    }
    res.status(204).send();
  });
  app.get("/sessions/:sessionId/pending", (req, res) => {
    const { sessionId } = req.params;
    const session = getSession(db, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const pending = getPendingAnnotations(db, sessionId);
    res.json(pending);
  });
  app.get("/pending", (_req, res) => {
    const pending = getAllPendingAnnotations(db);
    res.json(pending);
  });
  app.post("/sessions/:sessionId/action", (req, res) => {
    const { sessionId } = req.params;
    const { annotations, output } = req.body;
    const session = getSession(db, sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const actionRequest = {
      sessionId,
      annotations,
      output,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    emitAction(actionRequest);
    if (webhookUrls.length > 0) {
      sendWebhooks(webhookUrls, {
        event: "action.requested",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: actionRequest
      });
    }
    const response = {
      success: true,
      actionId: generateId()
    };
    res.json(response);
  });
  return app;
}
function startHttpServer(app, port) {
  return new Promise((resolve2) => {
    app.listen(port, () => {
      console.log(`Agentation RN MCP HTTP server running on port ${port}`);
      resolve2();
    });
  });
}

// src/server/mcp.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
var TOOLS = [
  {
    name: "agentation_list_sessions",
    description: "List all feedback sessions. Returns sessions with their status and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "approved", "closed"],
          description: "Filter by session status"
        },
        limit: {
          type: "number",
          description: "Maximum number of sessions to return (default: 100)"
        }
      }
    }
  },
  {
    name: "agentation_get_session",
    description: "Get a specific session with all its annotations.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to retrieve"
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "agentation_get_pending",
    description: "Get all pending (unresolved) annotations for a specific session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "agentation_get_all_pending",
    description: "Get all pending annotations across all sessions.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "agentation_acknowledge",
    description: "Mark an annotation as acknowledged. Use this when you've seen the feedback and are working on it.",
    inputSchema: {
      type: "object",
      properties: {
        annotationId: {
          type: "string",
          description: "The annotation ID to acknowledge"
        }
      },
      required: ["annotationId"]
    }
  },
  {
    name: "agentation_resolve",
    description: "Mark an annotation as resolved. Use this when you've addressed the feedback.",
    inputSchema: {
      type: "object",
      properties: {
        annotationId: {
          type: "string",
          description: "The annotation ID to resolve"
        },
        message: {
          type: "string",
          description: "Optional resolution message explaining what was done"
        }
      },
      required: ["annotationId"]
    }
  },
  {
    name: "agentation_dismiss",
    description: "Dismiss an annotation. Use this for feedback that won't be addressed.",
    inputSchema: {
      type: "object",
      properties: {
        annotationId: {
          type: "string",
          description: "The annotation ID to dismiss"
        },
        reason: {
          type: "string",
          description: "Reason for dismissing the annotation"
        }
      },
      required: ["annotationId", "reason"]
    }
  },
  {
    name: "agentation_reply",
    description: "Add a reply to an annotation thread. Use this to ask clarifying questions or provide updates.",
    inputSchema: {
      type: "object",
      properties: {
        annotationId: {
          type: "string",
          description: "The annotation ID to reply to"
        },
        message: {
          type: "string",
          description: "The reply message"
        }
      },
      required: ["annotationId", "message"]
    }
  },
  {
    name: "agentation_wait_for_action",
    description: 'Wait for the user to click "Send to Agent" in the app. Blocks until action is received or timeout.',
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to wait on"
        },
        timeoutMs: {
          type: "number",
          description: "Timeout in milliseconds (default: 60000)"
        }
      },
      required: ["sessionId"]
    }
  }
];
function handleListSessions(db, input) {
  const sessions = listSessions(db, input.status, input.limit);
  return JSON.stringify(sessions, null, 2);
}
function handleGetSession(db, input) {
  const session = getSessionWithAnnotations(db, input.sessionId);
  if (!session) {
    return JSON.stringify({ error: "Session not found" });
  }
  return JSON.stringify(session, null, 2);
}
function handleGetPending(db, input) {
  const pending = getPendingAnnotations(db, input.sessionId);
  return JSON.stringify(pending, null, 2);
}
function handleGetAllPending(db) {
  const pending = getAllPendingAnnotations(db);
  return JSON.stringify(pending, null, 2);
}
function handleAcknowledge(db, input) {
  const updated = updateAnnotation(db, input.annotationId, {
    status: "acknowledged"
  });
  if (!updated) {
    return JSON.stringify({ error: "Annotation not found" });
  }
  return JSON.stringify({ success: true, annotation: updated });
}
function handleResolve(db, input) {
  const annotation = getAnnotation(db, input.annotationId);
  if (!annotation) {
    return JSON.stringify({ error: "Annotation not found" });
  }
  const thread = annotation.thread ?? [];
  if (input.message) {
    thread.push({
      id: generateId(),
      role: "agent",
      content: input.message,
      timestamp: Date.now()
    });
  }
  const updated = updateAnnotation(db, input.annotationId, {
    status: "resolved",
    resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
    resolvedBy: "agent",
    thread
  });
  return JSON.stringify({ success: true, annotation: updated });
}
function handleDismiss(db, input) {
  const annotation = getAnnotation(db, input.annotationId);
  if (!annotation) {
    return JSON.stringify({ error: "Annotation not found" });
  }
  const thread = annotation.thread ?? [];
  thread.push({
    id: generateId(),
    role: "agent",
    content: `Dismissed: ${input.reason}`,
    timestamp: Date.now()
  });
  const updated = updateAnnotation(db, input.annotationId, {
    status: "dismissed",
    thread
  });
  return JSON.stringify({ success: true, annotation: updated });
}
function handleReply(db, input) {
  const annotation = getAnnotation(db, input.annotationId);
  if (!annotation) {
    return JSON.stringify({ error: "Annotation not found" });
  }
  const thread = annotation.thread ?? [];
  thread.push({
    id: generateId(),
    role: "agent",
    content: input.message,
    timestamp: Date.now()
  });
  const updated = updateAnnotation(db, input.annotationId, { thread });
  return JSON.stringify({ success: true, annotation: updated });
}
async function handleWaitForAction(input) {
  const timeout = input.timeoutMs ?? 6e4;
  return new Promise((resolve2) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve2(JSON.stringify({ timeout: true, message: "No action received within timeout" }));
    }, timeout);
    const cleanup = onAction(input.sessionId, (request) => {
      clearTimeout(timer);
      resolve2(JSON.stringify(request, null, 2));
    });
  });
}
function createMcpServer(db) {
  const server = new Server(
    {
      name: "agentation-rn-mcp",
      version: "0.1.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      let result;
      switch (name) {
        case "agentation_list_sessions":
          result = handleListSessions(db, args);
          break;
        case "agentation_get_session":
          result = handleGetSession(db, args);
          break;
        case "agentation_get_pending":
          result = handleGetPending(db, args);
          break;
        case "agentation_get_all_pending":
          result = handleGetAllPending(db);
          break;
        case "agentation_acknowledge":
          result = handleAcknowledge(db, args);
          break;
        case "agentation_resolve":
          result = handleResolve(db, args);
          break;
        case "agentation_dismiss":
          result = handleDismiss(db, args);
          break;
        case "agentation_reply":
          result = handleReply(db, args);
          break;
        case "agentation_wait_for_action":
          result = await handleWaitForAction(args);
          break;
        default:
          result = JSON.stringify({ error: `Unknown tool: ${name}` });
      }
      return {
        content: [{ type: "text", text: result }]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: JSON.stringify({ error: message }) }],
        isError: true
      };
    }
  });
  return server;
}
async function startMcpServer(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agentation RN MCP server running on stdio");
}
export {
  DEFAULT_CONFIG,
  createDatabase,
  createHttpServer,
  createMcpServer,
  generateId,
  parseWebhookUrls,
  startHttpServer,
  startMcpServer
};
//# sourceMappingURL=index.mjs.map