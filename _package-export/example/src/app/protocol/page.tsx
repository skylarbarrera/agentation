"use client";

import { Footer } from "../Footer";
import { CodeBlock } from "../components/CodeBlock";

function ToolName({ children }: { children: string }) {
  return (
    <h3 style={{ fontFamily: "'SF Mono', monospace", fontSize: "0.75rem", letterSpacing: "-0.01em" }}>
      {children}
    </h3>
  );
}

export default function ProtocolPage() {
  return (
    <>
      <article className="article">
        <header>
          <h1>MCP Integration</h1>
          <p className="tagline">
            Connect AI agents to structured annotations via Model Context Protocol
          </p>
        </header>

        <section>
          <h2 id="quick-start">Quick Start</h2>
          <p>
            Start the MCP server in your project directory:
          </p>
          <CodeBlock
            language="bash"
            copyable
            code={`npx agentation server`}
          />
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.75rem" }}>
            This starts both the MCP server (for agents) and HTTP server (for the browser toolbar).
            The toolbar connects automatically when the server is running.
          </p>
        </section>

        <section>
          <h2 id="why-structured-feedback">Why Structure?</h2>
          <p>
            When a user clicks a misaligned button to report it, your agent receives the exact
            component path (<code>ProductPage &gt; AddToCartButton</code>), its CSS state,
            bounding box, and what&apos;s wrong &mdash; no guessing from vague chat descriptions.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "50%", fontWeight: 500, color: "rgba(0,0,0,0.7)" }}>
                  Chat-based feedback
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontWeight: 500, color: "rgba(0,0,0,0.7)" }}>
                  Agentation
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                  &quot;The button on the product page is broken&quot;
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                  Element, path, component, styles, position
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                  Ephemeral &mdash; lost after session
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)" }}>
                  Persistent until resolved
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)" }}>
                  No priority system
                </td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)" }}>
                  Intent + severity for prioritization
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 id="how-it-works">How It Works</h2>
          <ol style={{ paddingLeft: "1.25rem" }}>
            <li><strong>Reviewer</strong> clicks an element and adds feedback in the browser</li>
            <li><strong>Browser</strong> captures element context and syncs to server (HTTP)</li>
            <li><strong>Agent</strong> polls for pending annotations via MCP</li>
            <li><strong>Agent</strong> acknowledges, fixes the code, then resolves</li>
            <li><strong>Reviewer</strong> sees status update, can reopen if needed</li>
          </ol>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.75rem" }}>
            The reviewer is typically human, but could also be an automated system &mdash;
            enabling multi-agent workflows, automated QA, or CI/CD visual regression feedback.
          </p>
        </section>

        <section>
          <h2 id="annotation-lifecycle">Annotation Lifecycle</h2>
          <p style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.7)" }}>
            pending → acknowledged → resolved | dismissed
          </p>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.5rem" }}>
            Reviewers can reopen resolved annotations if the fix didn&apos;t work.
          </p>
        </section>

        <section>
          <h2 id="mcp-tools">MCP Tools</h2>
          <p>
            Seven tools are available via the <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">Model Context Protocol</a>:
          </p>

          <ToolName>agentation_list_sessions</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            List all active annotation sessions. Use this to discover which pages have feedback.
          </p>
          <CodeBlock
            language="json"
            code={`// Response
{
  "sessions": [
    { "id": "sess_abc", "url": "http://localhost:3000/products", "status": "active" }
  ]
}`}
          />

          <ToolName>agentation_get_session</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Get a session with all its annotations. Input: <code>sessionId</code>
          </p>

          <ToolName>agentation_get_pending</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Get annotations waiting for attention. Input: <code>sessionId</code>
          </p>
          <CodeBlock
            language="json"
            code={`// Response
{
  "count": 1,
  "annotations": [{
    "id": "ann_123",
    "comment": "Button is cut off on mobile",
    "element": "button",
    "elementPath": "body > main > .hero > button.cta",
    "reactComponents": "App > LandingPage > HeroSection > Button",
    "intent": "fix",
    "severity": "blocking",
    "nearbyText": "Add to Cart"
  }]
}`}
          />

          <ToolName>agentation_acknowledge</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Mark as seen. Lets the reviewer know you&apos;re working on it. Input: <code>annotationId</code>
          </p>

          <ToolName>agentation_resolve</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Mark as done after fixing. Input: <code>annotationId</code>, optional <code>summary</code>.
            When a summary is provided, it&apos;s also posted to the annotation thread as an agent message.
          </p>
          <CodeBlock
            language="json"
            code={`// Request
{ "annotationId": "ann_123", "summary": "Fixed padding on mobile breakpoint" }

// Response
{ "resolved": true, "annotationId": "ann_123", "summary": "Fixed padding..." }`}
          />

          <ToolName>agentation_dismiss</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Decline to address, with a reason. Input: <code>annotationId</code>, <code>reason</code>
          </p>

          <ToolName>agentation_reply</ToolName>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)" }}>
            Ask a clarifying question or send an update. Input: <code>annotationId</code>, <code>message</code>
          </p>
        </section>

        <section>
          <h2 id="annotation-schema">Annotation Schema</h2>
          <p>
            MCP tools exchange annotations in the <a href="/spec">Agentation Format</a>.
            Key fields agents receive:
          </p>
          <CodeBlock
            language="typescript"
            code={`{
  id: string;                 // For acknowledge/resolve calls
  comment: string;            // Human feedback
  elementPath: string;        // CSS selector path
  reactComponents?: string;   // Component tree (when available)
  intent?: "fix" | "change" | "question" | "approve";
  severity?: "blocking" | "important" | "suggestion";
  status: "pending" | "acknowledged" | "resolved" | "dismissed";
}`}
          />
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.5rem" }}>
            See the <a href="/spec">full schema specification</a> for all available fields.
          </p>
        </section>

        <section>
          <h2 id="agent-configuration">Agent Configuration</h2>
          <p>
            Add Agentation as an MCP server in your agent&apos;s config:
          </p>
          <CodeBlock
            language="json"
            copyable
            code={`// In ~/.claude.json under projects.<your-project-path>
{
  "mcpServers": {
    "agentation": {
      "command": "npx",
      "args": ["agentation", "server"]
    }
  }
}`}
          />
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.75rem" }}>
            Works with any MCP-compatible agent. The HTTP server runs on port 4747 by default.
            Use <code>--mcp-only</code> if running the HTTP server separately.
          </p>
        </section>

        <section>
          <h2 id="example-workflow">Example Workflow</h2>
          <CodeBlock
            language="typescript"
            code={`// 1. Agent checks for feedback
const pending = await agentation_get_pending({ sessionId: "sess_abc" });
// → 1 annotation: "Button is cut off on mobile" (blocking)

// 2. Agent acknowledges
await agentation_acknowledge({ annotationId: "ann_123" });
// Reviewer sees: "Agent is working on this"

// 3. Agent fixes the code
// ... edits Button.tsx to fix mobile padding ...

// 4. Agent resolves
await agentation_resolve({
  annotationId: "ann_123",
  summary: "Added responsive padding for mobile viewports"
});
// Reviewer sees: "Resolved by agent"`}
          />
        </section>

        <section>
          <h2 id="http-api">HTTP API</h2>
          <p>
            The browser component syncs annotations via HTTP. The server exposes:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", marginTop: "1rem" }}>
            <tbody>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", width: "4rem", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  List all sessions
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  POST
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Create a new session
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions/:id
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Get session with annotations
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions/:id/pending
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Get pending annotations only
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions/:id/events
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  SSE stream for session
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  POST
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /sessions/:id/annotations
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Add an annotation
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /annotations/:id
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Get a single annotation
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  PATCH
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /annotations/:id
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Update an annotation
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  DELETE
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /annotations/:id
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Delete an annotation
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  POST
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /annotations/:id/thread
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Add a thread message
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /events?domain=...
                </td>
                <td style={{ padding: "0.375rem 0", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Site-level SSE stream
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.8125rem", color: "rgba(0,0,0,0.4)" }}>
                  GET
                </td>
                <td style={{ padding: "0.375rem 0", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                  /health
                </td>
                <td style={{ padding: "0.375rem 0", color: "rgba(0,0,0,0.5)", textAlign: "right" }}>
                  Server health check
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.75rem" }}>
            The React component handles this automatically when you set the <code>endpoint</code> prop.
          </p>
        </section>

        <section>
          <h2 id="real-time-events">Real-Time Events (SSE)</h2>
          <p>
            Subscribe to real-time events via Server-Sent Events:
          </p>
          <CodeBlock
            language="bash"
            code={`# Session-level: events for a single page
curl -N http://localhost:4747/sessions/:id/events

# Site-level: events across ALL pages for a domain
curl -N "http://localhost:4747/events?domain=localhost:3001"

# Reconnect after disconnect (replay missed events)
curl -N -H "Last-Event-ID: 42" http://localhost:4747/sessions/:id/events`}
          />
          <p style={{ marginTop: "0.75rem" }}>
            Events are wrapped in the <a href="/spec">AgentationEvent envelope</a>:
          </p>
          <CodeBlock
            language="typescript"
            code={`event: annotation.created
id: 42
data: {"type":"annotation.created","sessionId":"sess_abc","sequence":42,"payload":{...}}`}
          />
          <p style={{ marginTop: "0.75rem" }}>
            <strong>Event types:</strong>
          </p>
          <ul style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.65)", marginTop: "0.25rem" }}>
            <li><code>annotation.created</code> &mdash; New annotation added</li>
            <li><code>annotation.updated</code> &mdash; Annotation modified (comment, status, etc.)</li>
            <li><code>annotation.deleted</code> &mdash; Annotation removed</li>
            <li><code>session.created</code> &mdash; New session started</li>
            <li><code>session.updated</code> &mdash; Session status changed</li>
            <li><code>session.closed</code> &mdash; Session closed</li>
            <li><code>thread.message</code> &mdash; New message in annotation thread</li>
          </ul>
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.5rem" }}>
            Use <code>Last-Event-ID</code> header to resume from a specific sequence number after disconnect.
            The server stores events for 7 days (configurable via <code>AGENTATION_EVENT_RETENTION_DAYS</code>).
          </p>
        </section>

        <section>
          <h2 id="persistence">Persistence</h2>
          <p>
            Sessions and annotations persist to SQLite by default:
          </p>
          <CodeBlock
            language="bash"
            code={`~/.agentation/store.db   # SQLite database`}
          />
          <p style={{ fontSize: "0.8125rem", color: "rgba(0,0,0,0.55)", marginTop: "0.5rem" }}>
            Set <code>AGENTATION_STORE=memory</code> to use in-memory storage (no persistence).
          </p>
        </section>
      </article>

      <Footer />
    </>
  );
}
