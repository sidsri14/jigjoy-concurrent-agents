import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createMeshServer } from "../src/server.js";

describe("JigJoy Mesh Server & HUD Suite", () => {
  let serverInstance: Server;
  let baseUrl: string;

  before(async () => {
    const { server } = createMeshServer();
    serverInstance = server;
    await new Promise<void>((resolve) => {
      serverInstance.listen(0, () => {
        const addr = serverInstance.address();
        if (typeof addr === "object" && addr) {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      serverInstance.close(() => resolve());
    });
  });

  test("GET / returns HTML dashboard with UTF-8 encoding", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get("content-type");
    assert.ok(contentType?.includes("text/html"));
    const html = await res.text();
    assert.ok(html.includes("JigJoy Concurrent Multi-Agent Mesh"));
    assert.ok(html.includes("GuardrailAgent"));
    assert.ok(html.includes("EinsteinDispatcherAgent"));
  });

  test("GET /api/state returns valid agent mesh telemetry", async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(typeof data.isHalted, "boolean");
    assert.ok(Array.isArray(data.verifiedInvariants));
    assert.ok(Array.isArray(data.taskAssignments));
    assert.strictEqual(typeof data.agentLoads, "object");
  });

  test("POST /api/action executes benchmark action and returns throughput timing", async () => {
    const res = await fetch(`${baseUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "benchmark", count: 20 }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json() as any;
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.count, 20);
    assert.ok(Number(data.durationMs) >= 0);
  });
});
