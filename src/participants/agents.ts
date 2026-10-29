import { createAgent, createHuman } from "@mozaik-ai/core";
import { invariantCheckHandler } from "../situations/mesh-situations.js";

/**
 * Sensor Agent: Monitors concurrent data inputs and emits evaluation events.
 */
export const sensorAgent = createAgent({
  name: "SensorAgent",
  capabilities: [],
  instruction: "Ingest telemetry, parse structure, and trigger invariant checks on the mesh.",
  tools: [],
  handlers: [],
});

/**
 * Guardrail Agent: Validates invariants and guards against unsafe actions.
 */
export const guardrailAgent = createAgent({
  name: "GuardrailAgent",
  capabilities: [],
  instruction: "Evaluate invariant constraints across all concurrent event streams.",
  tools: [],
  handlers: [invariantCheckHandler],
});

/**
 * Human Supervisor / Observer.
 */
export const humanSupervisor = createHuman({
  name: "Supervisor",
  capabilities: [],
  handlers: [],
});
