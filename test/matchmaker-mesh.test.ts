import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { SemanticEvent } from "@mozaik-ai/core";
import { bootstrapMesh } from "../src/index.js";
import { sendEvent } from "../src/runtime.js";
import { computeMatchScore } from "../src/situations/matchmaker-situations.js";

describe("EINSTEIN Matchmaker / Autonomous Skill Routing Suite", () => {
  let mesh: ReturnType<typeof bootstrapMesh>;

  before(() => {
    mesh = bootstrapMesh();
  });

  test("computeMatchScore calculates correct overlap and load penalties", () => {
    const required = ["rust", "solana", "security-audit"];
    const perfectAgent = ["rust", "solana", "security-audit", "math"];
    const partialAgent = ["rust", "c++", "linux"];

    // 100% match, 0 load -> 100
    assert.strictEqual(computeMatchScore(required, perfectAgent, 0), 100);

    // 100% match, 2 active load -> 100 - (2 * 15) = 70
    assert.strictEqual(computeMatchScore(required, perfectAgent, 2), 70);

    // 33.3% match, 0 load -> round(33.3) = 33
    assert.strictEqual(computeMatchScore(required, partialAgent, 0), 33);
  });

  test("routes Solana/Rust task to SolanaRustWorker with high fitness score", () => {
    const taskId = "task_bittern_solana_001";
    const routingEvent = SemanticEvent.create(
      "task.routing_request",
      mesh.humanSupervisor.getId(),
      {
        taskId,
        title: "Bittern Labs Solana Perpetual Position Bug Fix",
        requiredSkills: ["rust", "solana", "security-audit"],
        complexity: "high",
        candidateAgentIds: [
          mesh.solanaRustWorker.getId(),
          mesh.typescriptApiWorker.getId(),
          mesh.dataOpsWorker.getId(),
        ],
      }
    );

    sendEvent(routingEvent, mesh.humanSupervisor.getId());

    const assignment = mesh.state.taskAssignments.find((a) => a.taskId === taskId);
    assert.ok(assignment, "Task assignment should be recorded");
    assert.strictEqual(assignment.assignedAgentName, "SolanaRustWorker");
    assert.strictEqual(assignment.matchScore, 100);
    assert.strictEqual(mesh.state.getAgentLoad(mesh.solanaRustWorker.getId()), 1);
  });

  test("routes TypeScript API task to TypeScriptApiWorker", () => {
    const taskId = "task_upwork_catalog_ts_002";
    const routingEvent = SemanticEvent.create(
      "task.routing_request",
      mesh.humanSupervisor.getId(),
      {
        taskId,
        title: "Node.js Express API Bug Reproduction",
        requiredSkills: ["typescript", "api", "unit-testing"],
        candidateAgentIds: [
          mesh.solanaRustWorker.getId(),
          mesh.typescriptApiWorker.getId(),
          mesh.dataOpsWorker.getId(),
        ],
      }
    );

    sendEvent(routingEvent, mesh.humanSupervisor.getId());

    const assignment = mesh.state.taskAssignments.find((a) => a.taskId === taskId);
    assert.ok(assignment, "Task assignment should be recorded");
    assert.strictEqual(assignment.assignedAgentName, "TypeScriptApiWorker");
    assert.strictEqual(assignment.matchScore, 100);
  });

  test("escalates to Supervisor when required skills have no qualified candidate", () => {
    const taskId = "task_unsupported_haskell_quantum_003";
    const routingEvent = SemanticEvent.create(
      "task.routing_request",
      mesh.humanSupervisor.getId(),
      {
        taskId,
        title: "Quantum Cryptography Proof in Coq",
        requiredSkills: ["quantum-computing", "coq-proofs", "haskell"],
        candidateAgentIds: [
          mesh.solanaRustWorker.getId(),
          mesh.typescriptApiWorker.getId(),
          mesh.dataOpsWorker.getId(),
        ],
      }
    );

    sendEvent(routingEvent, mesh.humanSupervisor.getId());

    const escalation = mesh.state.escalations.find((e) => e.taskId === taskId);
    assert.ok(escalation, "Task should be escalated to supervisor");
    assert.ok(escalation.reason.includes("below threshold"));
  });
});
