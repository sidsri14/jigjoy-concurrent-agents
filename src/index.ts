import "dotenv/config";
import { OpenAIChatCompletions, SemanticEvent } from "@mozaik-ai/core";
import {
  initializeRuntime,
  join,
  sendEvent,
  sendMessage,
  MeshRuntimeState,
} from "./runtime.js";
import { MockInferenceRunner } from "./runners/mock-runner.js";
import {
  sensorAgent,
  guardrailAgent,
  humanSupervisor,
} from "./participants/agents.js";

let initializedState: MeshRuntimeState | null = null;

export function bootstrapMesh(customRunner?: MockInferenceRunner) {
  if (initializedState) {
    return { state: initializedState, sensorAgent, guardrailAgent, humanSupervisor };
  }

  const state = new MeshRuntimeState();
  initializedState = state;

  initializeRuntime({
    state,
    inferenceRunnerConfig: {
      supportedModels: [
        {
          endpoint: new OpenAIChatCompletions(),
          specification: {
            name: "mesh-model",
            provider: "openai",
            supportsReasoningEffort: false,
            supportedReasoningEfforts: [],
            supportsStreaming: false,
            contextWindowSize: 100000,
            supportedContextItemTypes: [],
            maxOutputTokens: 100000,
            supportsFunctionCalling: false,
            supportsStructuredOutput: false,
          },
        },
      ],
      runner: customRunner ?? new MockInferenceRunner(),
    },
  });

  join(humanSupervisor);
  join(sensorAgent);
  join(guardrailAgent);

  return { state, sensorAgent, guardrailAgent, humanSupervisor };
}

// Direct execution entrypoint
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  console.log("=== Bootstrapping JigJoy Concurrent Agent Mesh ===");
  const { state, sensorAgent } = bootstrapMesh();

  // Emitting concurrent invariant check event to guardrail
  const event = SemanticEvent.create(
    "mesh.invariant_check",
    sensorAgent.getId(),
    {
      rule: "MaxLatencyThresholdMs",
      value: 45,
      threshold: 100,
    }
  );
  sendEvent(event, sensorAgent.getId());

  console.log("Verified Invariants:", state.verifiedInvariants);
  console.log("Mesh State Status:", state.isHalted ? "HALTED" : "HEALTHY");
}
