import http from "node:http";
import { SemanticEvent } from "@mozaik-ai/core";
import { bootstrapMesh } from "./index.js";
import { sendEvent } from "./runtime.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3456;

export function createMeshServer() {
  const mesh = bootstrapMesh();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. API: State
    if (url.pathname === "/api/state" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      const loads: Record<string, number> = {};
      mesh.state.agentLoads.forEach((val, key) => {
        loads[key] = val;
      });

      res.end(
        JSON.stringify({
          isHalted: mesh.state.isHalted,
          verifiedInvariants: mesh.state.verifiedInvariants,
          taskAssignments: mesh.state.taskAssignments,
          escalations: mesh.state.escalations,
          agentLoads: loads,
          telemetryCount: mesh.state.telemetryLog.length,
        })
      );
      return;
    }

    // 2. API: Trigger Actions
    if (url.pathname === "/api/action" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const action = payload.action;

          if (action === "invariant_check") {
            const pass = payload.pass !== false;
            const event = SemanticEvent.create(
              "mesh.invariant_check",
              mesh.sensorAgent.getId(),
              {
                rule: payload.rule ?? "ManualLatencyCheck",
                value: pass ? 35 : 120,
                threshold: 100,
              }
            );
            sendEvent(event, mesh.sensorAgent.getId());
          } else if (action === "route_solana") {
            const taskId = `task_solana_${Date.now().toString(36)}`;
            const event = SemanticEvent.create(
              "task.routing_request",
              mesh.humanSupervisor.getId(),
              {
                taskId,
                title: payload.title ?? "Perpetual margin invariant audit",
                requiredSkills: ["rust", "solana", "security-audit"],
                complexity: "high",
                candidateAgentIds: [
                  mesh.solanaRustWorker.getId(),
                  mesh.typescriptApiWorker.getId(),
                  mesh.dataOpsWorker.getId(),
                ],
              }
            );
            sendEvent(event, mesh.humanSupervisor.getId());
          } else if (action === "route_typescript") {
            const taskId = `task_ts_${Date.now().toString(36)}`;
            const event = SemanticEvent.create(
              "task.routing_request",
              mesh.humanSupervisor.getId(),
              {
                taskId,
                title: payload.title ?? "Express API idempotent retry handler",
                requiredSkills: ["typescript", "api", "unit-testing"],
                candidateAgentIds: [
                  mesh.solanaRustWorker.getId(),
                  mesh.typescriptApiWorker.getId(),
                  mesh.dataOpsWorker.getId(),
                ],
              }
            );
            sendEvent(event, mesh.humanSupervisor.getId());
          } else if (action === "route_unsupported") {
            const taskId = `task_unsupported_${Date.now().toString(36)}`;
            const event = SemanticEvent.create(
              "task.routing_request",
              mesh.humanSupervisor.getId(),
              {
                taskId,
                title: "Quantum key distribution proof",
                requiredSkills: ["quantum-crypto", "haskell", "formal-proofs"],
                candidateAgentIds: [
                  mesh.solanaRustWorker.getId(),
                  mesh.typescriptApiWorker.getId(),
                  mesh.dataOpsWorker.getId(),
                ],
              }
            );
            sendEvent(event, mesh.humanSupervisor.getId());
          } else if (action === "benchmark") {
            const count = payload.count ?? 50;
            const start = performance.now();
            for (let i = 0; i < count; i++) {
              const event = SemanticEvent.create(
                "mesh.invariant_check",
                mesh.sensorAgent.getId(),
                {
                  rule: `BurstRule_${i}`,
                  value: 10,
                  threshold: 50,
                }
              );
              sendEvent(event, mesh.sensorAgent.getId());
            }
            const durationMs = performance.now() - start;
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: true,
                count,
                durationMs: durationMs.toFixed(2),
                perEventMs: (durationMs / count).toFixed(4),
              })
            );
            return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, isHalted: mesh.state.isHalted }));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
      return;
    }

    // 3. Web HUD Dashboard HTML
    if (url.pathname === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderDashboardHtml());
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  return { server, mesh };
}

function renderDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JigJoy Concurrent Multi-Agent Mesh HUD</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.3);
      --green: #10b981;
      --red: #ef4444;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .badge-healthy { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }
    .badge-halted { background: rgba(239, 68, 68, 0.2); color: var(--red); border: 1px solid var(--red); }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: var(--green); }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: var(--red); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #93c5fd;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    button {
      background: #1e3a8a;
      color: #fff;
      border: 1px solid #3b82f6;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: #2563eb; transform: translateY(-1px); }
    button.btn-danger { background: rgba(239, 68, 68, 0.2); border-color: var(--red); color: var(--red); }
    button.btn-danger:hover { background: var(--red); color: #fff; }
    .controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .feed { max-height: 280px; overflow-y: auto; font-size: 13px; }
    .feed-item {
      padding: 8px 10px;
      background: #0f172a;
      border-radius: 6px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-pill {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      background: #1e293b;
      font-size: 12px;
      margin: 4px 4px 4px 0;
    }
    footer { margin-top: 40px; text-align: center; color: var(--text-muted); font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 style="font-size: 22px;">⚡ JigJoy Concurrent Multi-Agent Mesh HUD</h1>
      <p style="color: var(--text-muted); font-size: 13px;">NTP Novi Sad / JigJoy AI Hackathon 2026 • Mozaik (@mozaik-ai/core)</p>
    </div>
    <div id="status-badge" class="badge badge-healthy">STATUS: HEALTHY</div>
  </header>

  <div class="grid">
    <!-- Card 1: Mesh Topology -->
    <div class="card">
      <div class="card-title">🌐 Active Mesh Participants</div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">Registered concurrent actors:</p>
      <div>
        <span class="agent-pill">📡 <strong>SensorAgent</strong> (Telemetry)</span>
        <span class="agent-pill">🛡️ <strong>GuardrailAgent</strong> (Safety)</span>
        <span class="agent-pill">🧠 <strong>EinsteinDispatcherAgent</strong> (Matchmaker)</span>
        <span class="agent-pill">🦀 <strong>SolanaRustWorker</strong> (Rust/Solana)</span>
        <span class="agent-pill">⚡ <strong>TypeScriptApiWorker</strong> (TS/API)</span>
        <span class="agent-pill">📊 <strong>DataOpsWorker</strong> (Python/Data)</span>
        <span class="agent-pill">👤 <strong>Supervisor</strong> (Human Fallback)</span>
      </div>
      <div class="controls" style="margin-top: 18px;">
        <button onclick="triggerAction('route_solana')">+ Route Solana Task</button>
        <button onclick="triggerAction('route_typescript')">+ Route TS API Task</button>
        <button onclick="triggerAction('route_unsupported')">+ Route Unsupported Task</button>
      </div>
    </div>

    <!-- Card 2: Invariant Safety Guardrails (Track 1) -->
    <div class="card">
      <div class="card-title">🛡️ Track 1: Guardrail Invariants</div>
      <div class="controls" style="margin-bottom: 12px;">
        <button onclick="triggerAction('invariant_check', { pass: true, rule: 'TokenLatencyThreshold' })">Check Invariant (Pass)</button>
        <button class="btn-danger" onclick="triggerAction('invariant_check', { pass: false, rule: 'MaxAnomalyRatio' })">Trigger Breach (Fail/Halt)</button>
      </div>
      <div id="invariants-feed" class="feed">
        <p style="color: var(--text-muted);">Listening for invariant checks...</p>
      </div>
    </div>

    <!-- Card 3: EINSTEIN Matchmaker Routing (Track 2) -->
    <div class="card">
      <div class="card-title">🧠 Track 2: EINSTEIN Skill Matchmaker</div>
      <div id="assignments-feed" class="feed">
        <p style="color: var(--text-muted);">No task routing events yet.</p>
      </div>
    </div>

    <!-- Card 4: High-Throughput Burst Benchmark -->
    <div class="card">
      <div class="card-title">⚡ Concurrent Event Benchmark</div>
      <p style="font-size: 13px; color: var(--text-muted);">Test concurrent dispatch latency through non-blocking event loop:</p>
      <div class="controls" style="margin: 12px 0;">
        <button onclick="runBenchmark(50)">Run 50-Burst</button>
        <button onclick="runBenchmark(200)">Run 200-Burst</button>
      </div>
      <div id="benchmark-results" style="font-family: monospace; font-size: 13px; color: #60a5fa;">
        Ready for benchmark run.
      </div>
    </div>
  </div>

  <footer>
    <p>Authored by Siddharth Srivastava (@sidsri14) • NTP Novi Sad / JigJoy AI Hackathon 2026</p>
  </footer>

  <script>
    async function fetchState() {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        
        // Status Badge
        const badge = document.getElementById('status-badge');
        if (data.isHalted) {
          badge.textContent = 'STATUS: HALTED (Invariant Breach)';
          badge.className = 'badge badge-halted';
        } else {
          badge.textContent = 'STATUS: HEALTHY';
          badge.className = 'badge badge-healthy';
        }

        // Invariants Feed
        const invFeed = document.getElementById('invariants-feed');
        if (data.verifiedInvariants.length > 0) {
          invFeed.innerHTML = data.verifiedInvariants.slice(-8).reverse().map(inv => \`
            <div class="feed-item">
              <div>
                <strong>\${inv.rule}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">\${inv.detail}</div>
              </div>
              <span class="badge \${inv.passed ? 'badge-pass' : 'badge-fail'}">\${inv.passed ? 'PASS' : 'FAIL'}</span>
            </div>
          \`).join('');
        }

        // Assignments Feed
        const assignFeed = document.getElementById('assignments-feed');
        const items = [];
        data.taskAssignments.slice(-6).reverse().forEach(a => {
          items.push(\`
            <div class="feed-item">
              <div>
                <strong>\${a.taskId}</strong>
                <div style="font-size: 11px; color: #93c5fd;">Assigned: \${a.assignedAgentName}</div>
              </div>
              <span class="badge badge-pass">\${a.matchScore}% FIT</span>
            </div>
          \`);
        });
        data.escalations.slice(-3).reverse().forEach(e => {
          items.push(\`
            <div class="feed-item" style="border-left: 3px solid #f59e0b;">
              <div>
                <strong>\${e.taskId}</strong>
                <div style="font-size: 11px; color: #f59e0b;">Escalated: Supervisor (\${e.reason})</div>
              </div>
              <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">ESCALATED</span>
            </div>
          \`);
        });
        if (items.length > 0) {
          assignFeed.innerHTML = items.join('');
        }
      } catch (e) {
        console.error('State poll error:', e);
      }
    }

    async function triggerAction(action, extra = {}) {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra })
      });
      fetchState();
    }

    async function runBenchmark(count) {
      const out = document.getElementById('benchmark-results');
      out.textContent = \`Dispatching \${count} concurrent events...\`;
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'benchmark', count })
      });
      const data = await res.json();
      out.innerHTML = \`✅ Processed <strong>\${data.count}</strong> events in <strong>\${data.durationMs}ms</strong> (\${data.perEventMs}ms / event)\`;
      fetchState();
    }

    // Auto-poll state every 1.5 seconds
    setInterval(fetchState, 1500);
    fetchState();
  </script>
</body>
</html>`;
}

// Direct execution entrypoint
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { server } = createMeshServer();
  server.listen(PORT, () => {
    console.log(`⚡ JigJoy Concurrent Multi-Agent Mesh HUD running at: http://localhost:${PORT}`);
  });
}
