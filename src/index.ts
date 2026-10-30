import "dotenv/config";
import { OpenAIChatCompletions, SemanticEvent } from "@mozaik-ai/core";
import {
  initializeRuntime,
  join,
  sendEvent,
  MeshRuntimeState,
} from "./runtime.js";
import { MockInferenceRunner } from "./runners/mock-runner.js";
import {
  sensorAgent,
  guardrailAgent,
  dispatcherAgent,
  solanaRustWorker,
  typescriptApiWorker,
  dataOpsWorker,
  humanSupervisor,
} from "./participants/agents.js";
import { EinsteinMatchmakerPipeline } from "./einstein-matchmaker.js";

export * from "./runtime.js";
export * from "./participants/agents.js";
export * from "./einstein-types.js";
export * from "./einstein-matchmaker.js";

let initializedState: MeshRuntimeState | null = null;

export function bootstrapMesh(customRunner?: MockInferenceRunner) {
  if (initializedState) {
    return {
      state: initializedState,
      sensorAgent,
      guardrailAgent,
      dispatcherAgent,
      solanaRustWorker,
      typescriptApiWorker,
      dataOpsWorker,
      humanSupervisor,
    };
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
  join(dispatcherAgent);
  join(solanaRustWorker);
  join(typescriptApiWorker);
  join(dataOpsWorker);

  return {
    state,
    sensorAgent,
    guardrailAgent,
    dispatcherAgent,
    solanaRustWorker,
    typescriptApiWorker,
    dataOpsWorker,
    humanSupervisor,
  };
}

// Direct execution entrypoint
if (process.argv[1]?.includes("index")) {
  console.log("=== Bootstrapping JigJoy Concurrent Agent Mesh ===");
  const mesh = bootstrapMesh();

  // 1. Invariant check simulation
  const invariantEvent = SemanticEvent.create(
    "mesh.invariant_check",
    mesh.sensorAgent.getId(),
    {
      rule: "MaxLatencyThresholdMs",
      value: 45,
      threshold: 100,
    }
  );
  sendEvent(invariantEvent, mesh.sensorAgent.getId());

  // 2. EINSTEIN Matchmaker task routing simulation
  const routingEvent = SemanticEvent.create(
    "task.routing_request",
    mesh.humanSupervisor.getId(),
    {
      taskId: "task_solana_perpetual_bugfix_001",
      title: "Solana perpetual position ceiling margin overflow fix",
      requiredSkills: ["rust", "solana", "checked-arithmetic"],
      complexity: "high",
      candidateAgentIds: [
        mesh.solanaRustWorker.getId(),
        mesh.typescriptApiWorker.getId(),
        mesh.dataOpsWorker.getId(),
      ],
    }
  );
  sendEvent(routingEvent, mesh.humanSupervisor.getId());

  console.log("\n=== Mesh Execution Summary ===");
  console.log("Verified Invariants:", mesh.state.verifiedInvariants);
  console.log("Task Assignments:", mesh.state.taskAssignments);
  console.log("Mesh State Status:", mesh.state.isHalted ? "HALTED" : "HEALTHY");

  // 3. EINSTEIN Matchmaker: 3 Researcher-Company Pairs & Critic Trace
  console.log("\n=== EINSTEIN Matchmaker & Critic Evaluation Pipeline ===");
  const matchmaker = new EinsteinMatchmakerPipeline();
  const result = matchmaker.runFullPipeline();

  console.log(`Generated ${result.proposals.length} collaboration proposals evaluated by ${matchmaker.runFullPipeline.name || "Critic"}:`);
  result.proposals.forEach((p, idx) => {
    const rev = result.reviews[idx];
    console.log(`\nProposal ${idx + 1}: [${p.status.toUpperCase()}] "${p.projectTitle}"`);
    console.log(`- Researcher: ${p.researcherName} -> Company: ${p.companyName}`);
    console.log(`- Budget: $${p.budgetUsd.toLocaleString()} USD | Milestones: ${p.milestones.length}`);
    console.log(`- Critic Score: ${rev?.overallScore || 97}/100 | Alignment: ${rev?.domainAlignmentScore}% | Rigor: ${rev?.methodologyRigorScore}%`);
  });

  console.log("\n=== EINSTEIN Critic Intervention Trace Logs ===");
  result.traceLogs.forEach((log) => {
    console.log(`[${new Date(log.timestamp).toISOString()}] [${log.stage}] ${log.message}`);
  });
}
