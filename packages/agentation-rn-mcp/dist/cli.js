#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server/sqlite.ts
var sqlite_exports = {};
__export(sqlite_exports, {
  createDatabase: () => createDatabase,
  createSession: () => createSession,
  deleteAnnotation: () => deleteAnnotation,
  findSessionByUrl: () => findSessionByUrl,
  getAllPendingAnnotations: () => getAllPendingAnnotations,
  getAnnotation: () => getAnnotation,
  getAnnotationsForSession: () => getAnnotationsForSession,
  getPendingAnnotations: () => getPendingAnnotations,
  getSession: () => getSession,
  getSessionWithAnnotations: () => getSessionWithAnnotations,
  listSessions: () => listSessions,
  updateAnnotation: () => updateAnnotation,
  updateSessionStatus: () => updateSessionStatus,
  upsertAnnotation: () => upsertAnnotation
});
function expandPath(path2) {
  if (path2.startsWith("~")) {
    return path2.replace("~", (0, import_os.homedir)());
  }
  return (0, import_path.resolve)(path2);
}
function ensureDir(filePath) {
  const dir = (0, import_path.dirname)(filePath);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
}
function createDatabase(dbPath) {
  const expandedPath = expandPath(dbPath);
  ensureDir(expandedPath);
  const db = new import_better_sqlite3.default(expandedPath);
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
function updateSessionStatus(db, sessionId, status) {
  const stmt = db.prepare(`
    UPDATE sessions
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);
  const result = stmt.run(status, (/* @__PURE__ */ new Date()).toISOString(), sessionId);
  return result.changes > 0;
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
var import_better_sqlite3, import_fs, import_path, import_os;
var init_sqlite = __esm({
  "src/server/sqlite.ts"() {
    "use strict";
    import_better_sqlite3 = __toESM(require("better-sqlite3"));
    import_fs = require("fs");
    import_path = require("path");
    import_os = require("os");
  }
});

// src/utils.ts
var utils_exports = {};
__export(utils_exports, {
  generateId: () => generateId,
  parseWebhookUrls: () => parseWebhookUrls
});
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function parseWebhookUrls(urlString) {
  if (!urlString) return [];
  return urlString.split(",").map((url) => url.trim()).filter((url) => url.length > 0);
}
var init_utils = __esm({
  "src/utils.ts"() {
    "use strict";
  }
});

// src/server/http.ts
var http_exports = {};
__export(http_exports, {
  createHttpServer: () => createHttpServer,
  onAction: () => onAction,
  startHttpServer: () => startHttpServer
});
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
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
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
var import_express, import_cors, VERSION, actionListeners;
var init_http = __esm({
  "src/server/http.ts"() {
    "use strict";
    import_express = __toESM(require("express"));
    import_cors = __toESM(require("cors"));
    init_sqlite();
    init_utils();
    VERSION = "0.1.0";
    actionListeners = /* @__PURE__ */ new Map();
  }
});

// src/server/mcp.ts
var mcp_exports = {};
__export(mcp_exports, {
  createMcpServer: () => createMcpServer,
  startMcpServer: () => startMcpServer
});
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
  const server = new import_server.Server(
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
  server.setRequestHandler(import_types.ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });
  server.setRequestHandler(import_types.CallToolRequestSchema, async (request) => {
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
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  console.error("Agentation RN MCP server running on stdio");
}
var import_server, import_stdio, import_types, TOOLS;
var init_mcp = __esm({
  "src/server/mcp.ts"() {
    "use strict";
    import_server = require("@modelcontextprotocol/sdk/server/index.js");
    import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
    import_types = require("@modelcontextprotocol/sdk/types.js");
    init_sqlite();
    init_http();
    init_utils();
    TOOLS = [
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
  }
});

// src/types.ts
var types_exports = {};
__export(types_exports, {
  DEFAULT_CONFIG: () => DEFAULT_CONFIG
});
var DEFAULT_CONFIG;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    DEFAULT_CONFIG = {
      port: 4848,
      dbPath: "~/.agentation-rn/store.db"
    };
  }
});

// src/cli.ts
var readline = __toESM(require("readline"));
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_child_process = require("child_process");
var command = process.argv[2];
var DEFAULT_PORT = 4848;
var CONFIG_KEY = "agentation-rn";
var PACKAGE_NAME = "agentation-rn-mcp";
async function runInit() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const question = (q) => new Promise((resolve2) => rl.question(q, resolve2));
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551             Agentation RN MCP Setup Wizard                     \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
`);
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const claudeConfigPath = path.join(homeDir, ".claude", "claude_code_config.json");
  const hasClaudeConfig = fs.existsSync(claudeConfigPath);
  if (hasClaudeConfig) {
    console.log(`\u2713 Found Claude Code config at ${claudeConfigPath}`);
  } else {
    console.log(`\u25CB No Claude Code config found at ${claudeConfigPath}`);
  }
  console.log();
  console.log(`The Agentation RN MCP server allows Claude Code to receive`);
  console.log(`real-time annotations from your React Native app.`);
  console.log();
  const setupMcp = await question(`Set up MCP server integration? [Y/n] `);
  const wantsMcp = setupMcp.toLowerCase() !== "n";
  if (wantsMcp) {
    let port = DEFAULT_PORT;
    const portAnswer = await question(`HTTP server port [${DEFAULT_PORT}]: `);
    if (portAnswer && !isNaN(parseInt(portAnswer, 10))) {
      port = parseInt(portAnswer, 10);
    }
    let config = {};
    if (hasClaudeConfig) {
      try {
        config = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
      } catch {
        console.log(`   Warning: Could not parse existing config, creating new one`);
      }
    }
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }
    config.mcpServers[CONFIG_KEY] = {
      command: PACKAGE_NAME,
      args: port === DEFAULT_PORT ? ["server"] : ["server", "--port", String(port)]
    };
    const claudeDir = path.dirname(claudeConfigPath);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
    console.log();
    console.log(`\u2713 Updated ${claudeConfigPath}`);
    console.log();
    const testNow = await question(`Start server and test connection? [Y/n] `);
    if (testNow.toLowerCase() !== "n") {
      console.log();
      console.log(`Starting server on port ${port}...`);
      const server = (0, import_child_process.spawn)(PACKAGE_NAME, ["server", "--port", String(port)], {
        stdio: "inherit",
        detached: false
      });
      await new Promise((resolve2) => setTimeout(resolve2, 2e3));
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) {
          console.log();
          console.log(`\u2713 Server is running on http://localhost:${port}`);
          console.log(`\u2713 MCP tools available to Claude Code`);
          console.log();
          console.log(`Press Ctrl+C to stop the server.`);
          await new Promise(() => {
          });
        } else {
          console.log(`\u2717 Server health check failed: ${response.status}`);
          server.kill();
        }
      } catch (err) {
        console.log(`\u2717 Could not connect to server: ${err}`);
        server.kill();
      }
    }
  }
  console.log();
  console.log(`Setup complete! Run '${PACKAGE_NAME} doctor' to verify your setup.`);
  rl.close();
}
async function runDoctor() {
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                  Agentation RN MCP Doctor                      \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
`);
  let allPassed = true;
  const results = [];
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  if (majorVersion >= 18) {
    results.push({ name: "Node.js", status: "pass", message: `${nodeVersion} (18+ required)` });
  } else {
    results.push({ name: "Node.js", status: "fail", message: `${nodeVersion} (18+ required)` });
    allPassed = false;
  }
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const claudeConfigPath = path.join(homeDir, ".claude", "claude_code_config.json");
  if (fs.existsSync(claudeConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
      if (config.mcpServers?.[CONFIG_KEY]) {
        results.push({ name: "Claude Code config", status: "pass", message: "MCP server configured" });
      } else {
        results.push({ name: "Claude Code config", status: "warn", message: `Config exists but no ${CONFIG_KEY} MCP entry` });
      }
    } catch {
      results.push({ name: "Claude Code config", status: "fail", message: "Could not parse config file" });
      allPassed = false;
    }
  } else {
    results.push({ name: "Claude Code config", status: "warn", message: "No config found at ~/.claude/claude_code_config.json" });
  }
  try {
    const response = await fetch(`http://localhost:${DEFAULT_PORT}/health`, { signal: AbortSignal.timeout(2e3) });
    if (response.ok) {
      results.push({ name: `Server (port ${DEFAULT_PORT})`, status: "pass", message: "Running and healthy" });
    } else {
      results.push({ name: `Server (port ${DEFAULT_PORT})`, status: "warn", message: `Responded with ${response.status}` });
    }
  } catch {
    results.push({ name: `Server (port ${DEFAULT_PORT})`, status: "warn", message: `Not running (start with: ${PACKAGE_NAME} server)` });
  }
  const dbPath = path.join(homeDir, ".agentation-rn", "store.db");
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    const sizeKb = Math.round(stats.size / 1024);
    results.push({ name: "Database", status: "pass", message: `${dbPath} (${sizeKb}KB)` });
  } else {
    results.push({ name: "Database", status: "warn", message: "Not created yet (will be created on first server start)" });
  }
  for (const r of results) {
    const icon = r.status === "pass" ? "\u2713" : r.status === "fail" ? "\u2717" : "\u25CB";
    const color = r.status === "pass" ? "\x1B[32m" : r.status === "fail" ? "\x1B[31m" : "\x1B[33m";
    console.log(`${color}${icon}\x1B[0m ${r.name}: ${r.message}`);
  }
  console.log();
  if (allPassed) {
    console.log(`All checks passed!`);
  } else {
    console.log(`Some checks failed. Run '${PACKAGE_NAME} init' to fix.`);
    process.exit(1);
  }
}
async function runServer() {
  const { createDatabase: createDatabase2 } = await Promise.resolve().then(() => (init_sqlite(), sqlite_exports));
  const { createHttpServer: createHttpServer2, startHttpServer: startHttpServer2 } = await Promise.resolve().then(() => (init_http(), http_exports));
  const { createMcpServer: createMcpServer2, startMcpServer: startMcpServer2 } = await Promise.resolve().then(() => (init_mcp(), mcp_exports));
  const { parseWebhookUrls: parseWebhookUrls2 } = await Promise.resolve().then(() => (init_utils(), utils_exports));
  const { DEFAULT_CONFIG: DEFAULT_CONFIG2 } = await Promise.resolve().then(() => (init_types(), types_exports));
  const args = process.argv.slice(3);
  let port = DEFAULT_CONFIG2.port;
  let dbPath = DEFAULT_CONFIG2.dbPath;
  let webhook;
  let httpOnly = false;
  let mcpOnly = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--port":
      case "-p":
        port = parseInt(args[++i], 10);
        break;
      case "--db":
        dbPath = args[++i];
        break;
      case "--webhook":
        webhook = args[++i];
        break;
      case "--http-only":
        httpOnly = true;
        break;
      case "--mcp-only":
        mcpOnly = true;
        break;
    }
  }
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const expandedDbPath = dbPath.replace(/^~/, homeDir);
  const db = createDatabase2(expandedDbPath);
  console.error(`Database: ${expandedDbPath}`);
  const webhookUrls = parseWebhookUrls2(webhook);
  if (webhookUrls.length > 0) {
    console.error(`Webhooks: ${webhookUrls.join(", ")}`);
  }
  if (!mcpOnly) {
    const httpApp = createHttpServer2(db, webhookUrls);
    await startHttpServer2(httpApp, port);
  }
  if (!httpOnly) {
    const mcpServer = createMcpServer2(db);
    await startMcpServer2(mcpServer);
  }
}
function showHelp() {
  console.log(`
${PACKAGE_NAME} - MCP server for Agentation React Native

Usage:
  ${PACKAGE_NAME} init                    Interactive setup wizard
  ${PACKAGE_NAME} server [options]        Start the annotation server
  ${PACKAGE_NAME} doctor                  Check your setup and diagnose issues
  ${PACKAGE_NAME} help                    Show this help message

Server Options:
  --port, -p <port>    HTTP server port (default: ${DEFAULT_PORT})
  --db <path>          Database path (default: ~/.agentation-rn/store.db)
  --webhook <urls>     Webhook URL(s) for events (comma-separated)
  --http-only          Only start HTTP server (no MCP stdio)
  --mcp-only           Only start MCP server (no HTTP)

Commands:
  init      Guided setup that configures Claude Code to use the MCP server.
            Creates or updates ~/.claude/claude_code_config.json.

  server    Starts both an HTTP server and MCP server for collecting annotations.
            The HTTP server receives annotations from the React Native app.
            The MCP server exposes tools for Claude Code to read/act on annotations.

  doctor    Runs diagnostic checks on your setup:
            - Node.js version
            - Claude Code configuration
            - Server connectivity
            - Database file

Examples:
  ${PACKAGE_NAME} init                Set up Agentation RN MCP
  ${PACKAGE_NAME} server              Start server on default port ${DEFAULT_PORT}
  ${PACKAGE_NAME} server --port 5000  Start server on port 5000
  ${PACKAGE_NAME} doctor              Check if everything is configured correctly

MCP Tools (available to Claude Code):
  - agentation_list_sessions     List all feedback sessions
  - agentation_get_session       Get session with annotations
  - agentation_get_pending       Get pending for session
  - agentation_get_all_pending   Get all pending annotations
  - agentation_acknowledge       Mark annotation acknowledged
  - agentation_resolve           Mark annotation resolved
  - agentation_dismiss           Dismiss annotation
  - agentation_reply             Add reply to thread
  - agentation_wait_for_action   Wait for "Send to Agent"
`);
}
if (command === "init") {
  runInit().catch((err) => {
    console.error("Init failed:", err);
    process.exit(1);
  });
} else if (command === "doctor") {
  runDoctor().catch((err) => {
    console.error("Doctor failed:", err);
    process.exit(1);
  });
} else if (command === "server") {
  runServer().catch((err) => {
    console.error("Server failed:", err);
    process.exit(1);
  });
} else if (command === "help" || command === "--help" || command === "-h" || !command) {
  showHelp();
} else {
  console.error(`Unknown command: ${command}`);
  console.error(`Run '${PACKAGE_NAME} help' for usage information.`);
  process.exit(1);
}
//# sourceMappingURL=cli.js.map