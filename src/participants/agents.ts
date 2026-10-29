import { createAgent, createHuman } from "@mozaik-ai/core";
import { invariantCheckHandler } from "../situations/mesh-situations.js";
import { taskRoutingHandler } from "../situations/matchmaker-situations.js";

/**
 * Sensor Agent: Monitors concurrent data inputs and emits evaluation events.
 */
export const sensorAgent = createAgent({
  name: "SensorAgent",
  capabilities: ["telemetry-ingestion", "event-streaming"],
  instruction: "Ingest telemetry, parse structure, and trigger invariant checks on the mesh.",
  tools: [],
  handlers: [],
});

/**
 * Guardrail Agent: Validates invariants and guards against unsafe actions.
 */
export const guardrailAgent = createAgent({
  name: "GuardrailAgent",
  capabilities: ["safety-invariants", "policy-enforcement"],
  instruction: "Evaluate invariant constraints across all concurrent event streams.",
  tools: [],
  handlers: [invariantCheckHandler],
});

/**
 * EINSTEIN Matchmaker Dispatcher Agent (Track 2):
 * Dynamically routes incoming task specifications to the best-suited specialized agent.
 */
export const dispatcherAgent = createAgent({
  name: "EinsteinDispatcherAgent",
  capabilities: ["skill-matching", "workload-balancing", "task-routing"],
  instruction: "Analyze incoming tasks, evaluate candidate agent skill overlap and active load, and dispatch assignments.",
  tools: [],
  handlers: [taskRoutingHandler],
});

/**
 * Specialized Worker 1: Solana & Systems Rust Engineer
 */
export const solanaRustWorker = createAgent({
  name: "SolanaRustWorker",
  capabilities: ["rust", "solana", "smart-contracts", "security-audit", "checked-arithmetic"],
  instruction: "Execute Rust backend and Solana program audits, patch vulnerabilities, and write regression tests.",
  tools: [],
  handlers: [],
});

/**
 * Specialized Worker 2: Full-Stack TypeScript & API Engineer
 */
export const typescriptApiWorker = createAgent({
  name: "TypeScriptApiWorker",
  capabilities: ["typescript", "node.js", "api", "express", "unit-testing"],
  instruction: "Reproduce and patch Node.js / TypeScript API bugs and deliver automated test suites.",
  tools: [],
  handlers: [],
});

/**
 * Specialized Worker 3: Data & Autonomous AI Pipelines Engineer
 */
export const dataOpsWorker = createAgent({
  name: "DataOpsWorker",
  capabilities: ["python", "etl", "data-pipelines", "telemetry", "evals"],
  instruction: "Process data pipelines, orchestrate agent telemetry, and execute model evaluation loops.",
  tools: [],
  handlers: [],
});

/**
 * Human Supervisor / Observer (Fallback recipient for unroutable tasks).
 */
export const humanSupervisor = createHuman({
  name: "Supervisor",
  capabilities: ["oversight", "manual-intervention"],
  handlers: [],
});
