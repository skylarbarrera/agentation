/**
 * Agentation CLI
 *
 * Usage:
 *   npx agentation server [--port 4747]
 *   npx agentation init
 *   npx agentation doctor
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { spawn, execSync } from "child_process";

const command = process.argv[2];

// ============================================================================
// INIT COMMAND - Interactive setup wizard
// ============================================================================

async function runInit() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Agentation Setup Wizard                     ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Step 1: Detect project
  const cwd = process.cwd();
  const hasPackageJson = fs.existsSync(path.join(cwd, "package.json"));
  const hasNextConfig =
    fs.existsSync(path.join(cwd, "next.config.js")) ||
    fs.existsSync(path.join(cwd, "next.config.mjs")) ||
    fs.existsSync(path.join(cwd, "next.config.ts"));

  console.log(`📁 Project directory: ${cwd}`);
  if (hasNextConfig) {
    console.log(`   Detected: Next.js project`);
  } else if (hasPackageJson) {
    console.log(`   Detected: Node.js project`);
  }
  console.log();

  // Step 2: Check Claude Code config
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const claudeConfigPath = path.join(homeDir, ".claude", "claude_code_config.json");
  const hasClaudeConfig = fs.existsSync(claudeConfigPath);

  if (hasClaudeConfig) {
    console.log(`✓ Found Claude Code config at ${claudeConfigPath}`);
  } else {
    console.log(`○ No Claude Code config found at ${claudeConfigPath}`);
  }
  console.log();

  // Step 3: Ask about MCP server
  console.log(`The Agentation MCP server allows Claude Code to receive`);
  console.log(`real-time annotations and respond to feedback.`);
  console.log();

  const setupMcp = await question(`Set up MCP server integration? [Y/n] `);
  const wantsMcp = setupMcp.toLowerCase() !== "n";

  if (wantsMcp) {
    let port = 4747;
    const portAnswer = await question(`HTTP server port [4747]: `);
    if (portAnswer && !isNaN(parseInt(portAnswer, 10))) {
      port = parseInt(portAnswer, 10);
    }

    // Create or update Claude config
    let config: Record<string, unknown> = {};
    if (hasClaudeConfig) {
      try {
        config = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
      } catch {
        console.log(`   Warning: Could not parse existing config, creating new one`);
      }
    }

    // Ensure mcpServers exists
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }

    // Add agentation server
    (config.mcpServers as Record<string, unknown>).agentation = {
      command: "npx",
      args: port === 4747 ? ["agentation", "server"] : ["agentation", "server", "--port", String(port)],
    };

    // Ensure directory exists
    const claudeDir = path.dirname(claudeConfigPath);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
    console.log();
    console.log(`✓ Updated ${claudeConfigPath}`);
    console.log();

    // Show React component setup
    console.log(`Next, add the component to your app:`);
    console.log();
    console.log(`  import { PageToolbar } from "agentation";`);
    console.log();
    console.log(`  // In your layout or app component:`);
    console.log(`  <PageToolbar endpoint="http://localhost:${port}" />`);
    console.log();

    // Test connection
    const testNow = await question(`Start server and test connection? [Y/n] `);
    if (testNow.toLowerCase() !== "n") {
      console.log();
      console.log(`Starting server on port ${port}...`);

      // Start server in background
      const server = spawn("npx", ["agentation", "server", "--port", String(port)], {
        stdio: "inherit",
        detached: false,
      });

      // Wait a moment for server to start
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test health endpoint
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) {
          console.log();
          console.log(`✓ Server is running on http://localhost:${port}`);
          console.log(`✓ MCP tools available to Claude Code`);
          console.log();
          console.log(`Press Ctrl+C to stop the server.`);

          // Keep running
          await new Promise(() => {});
        } else {
          console.log(`✗ Server health check failed: ${response.status}`);
          server.kill();
        }
      } catch (err) {
        console.log(`✗ Could not connect to server: ${err}`);
        server.kill();
      }
    }
  }

  console.log();
  console.log(`Setup complete! Run 'npx agentation doctor' to verify your setup.`);
  rl.close();
}

// ============================================================================
// DOCTOR COMMAND - Diagnostic checks
// ============================================================================

async function runDoctor() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    Agentation Doctor                           ║
╚═══════════════════════════════════════════════════════════════╝
`);

  let allPassed = true;
  const results: Array<{ name: string; status: "pass" | "fail" | "warn"; message: string }> = [];

  // Check 1: Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  if (majorVersion >= 18) {
    results.push({ name: "Node.js", status: "pass", message: `${nodeVersion} (18+ required)` });
  } else {
    results.push({ name: "Node.js", status: "fail", message: `${nodeVersion} (18+ required)` });
    allPassed = false;
  }

  // Check 2: Package installed
  const cwd = process.cwd();
  const nodeModulesPath = path.join(cwd, "node_modules", "agentation");
  if (fs.existsSync(nodeModulesPath)) {
    results.push({ name: "Package installed", status: "pass", message: "agentation in node_modules" });
  } else {
    results.push({ name: "Package installed", status: "warn", message: "Not in current project's node_modules" });
  }

  // Check 3: Claude Code config
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const claudeConfigPath = path.join(homeDir, ".claude", "claude_code_config.json");
  if (fs.existsSync(claudeConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
      if (config.mcpServers?.agentation) {
        results.push({ name: "Claude Code config", status: "pass", message: "MCP server configured" });
      } else {
        results.push({ name: "Claude Code config", status: "warn", message: "Config exists but no agentation MCP entry" });
      }
    } catch {
      results.push({ name: "Claude Code config", status: "fail", message: "Could not parse config file" });
      allPassed = false;
    }
  } else {
    results.push({ name: "Claude Code config", status: "warn", message: "No config found at ~/.claude/claude_code_config.json" });
  }

  // Check 4: Server connectivity (try default port)
  try {
    const response = await fetch("http://localhost:4747/health", { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      results.push({ name: "Server (port 4747)", status: "pass", message: "Running and healthy" });
    } else {
      results.push({ name: "Server (port 4747)", status: "warn", message: `Responded with ${response.status}` });
    }
  } catch {
    results.push({ name: "Server (port 4747)", status: "warn", message: "Not running (start with: npx agentation server)" });
  }

  // Print results
  for (const r of results) {
    const icon = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "○";
    const color = r.status === "pass" ? "\x1b[32m" : r.status === "fail" ? "\x1b[31m" : "\x1b[33m";
    console.log(`${color}${icon}\x1b[0m ${r.name}: ${r.message}`);
  }

  console.log();
  if (allPassed) {
    console.log(`All checks passed!`);
  } else {
    console.log(`Some checks failed. Run 'npx agentation init' to fix.`);
    process.exit(1);
  }
}

// ============================================================================
// COMMAND ROUTER
// ============================================================================

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
  // Dynamic import to avoid loading server code for other commands
  import("./server/index.js").then(({ startHttpServer, startMcpServer }) => {
    const args = process.argv.slice(3);
    let port = 4747;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--port" && args[i + 1]) {
        const parsed = parseInt(args[i + 1], 10);
        if (!isNaN(parsed) && parsed > 0 && parsed < 65536) {
          port = parsed;
        }
        i++;
      }
    }

    startHttpServer(port);
    startMcpServer().catch((err) => {
      console.error("MCP server error:", err);
      process.exit(1);
    });
  });
} else if (command === "help" || command === "--help" || command === "-h" || !command) {
  console.log(`
agentation - Visual feedback for AI coding agents

Usage:
  agentation init                    Interactive setup wizard
  agentation server [--port <port>]  Start the annotation server (default: 4747)
  agentation doctor                  Check your setup and diagnose issues
  agentation help                    Show this help message

Commands:
  init      Guided setup that configures Claude Code to use the MCP server.
            Creates or updates ~/.claude/claude_code_config.json.

  server    Starts both an HTTP server and MCP server for collecting annotations.
            The HTTP server receives annotations from the React component.
            The MCP server exposes tools for Claude Code to read/act on annotations.

  doctor    Runs diagnostic checks on your setup:
            - Node.js version
            - Package installation
            - Claude Code configuration
            - Server connectivity

Examples:
  npx agentation init                Set up Agentation in your project
  npx agentation server              Start server on default port 4747
  npx agentation server --port 8080  Start server on port 8080
  npx agentation doctor              Check if everything is configured correctly
`);
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Run 'agentation help' for usage information.");
  process.exit(1);
}
