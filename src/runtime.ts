import { defineRuntime, RuntimeState } from "@mozaik-ai/core";

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  source: string;
  data: Record<string, unknown>;
}

export interface InvariantResult {
  passed: boolean;
  rule: string;
  detail: string;
}

export interface TaskAssignment {
  taskId: string;
  assignedAgentId: string;
  assignedAgentName: string;
  matchScore: number;
  timestamp: number;
}

export interface TaskEscalation {
  taskId: string;
  reason: string;
  timestamp: number;
}

/**
 * Shared runtime state across all concurrent agents in the mesh.
 */
export class MeshRuntimeState extends RuntimeState {
  public telemetryLog: TelemetryEvent[] = [];
  public verifiedInvariants: InvariantResult[] = [];
  public dispatchQueue: Array<{ id: string; action: string; payload: unknown }> = [];
  public isHalted: boolean = false;

  // Track 2: EINSTEIN Matchmaker / Autonomous Agent Skill Routing
  public taskAssignments: TaskAssignment[] = [];
  public escalations: TaskEscalation[] = [];
  public agentLoads: Map<string, number> = new Map();

  recordTelemetry(event: TelemetryEvent): void {
    this.telemetryLog.push(event);
  }

  recordInvariant(result: InvariantResult): void {
    this.verifiedInvariants.push(result);
    if (!result.passed) {
      this.isHalted = true;
    }
  }

  enqueueDispatch(action: string, payload: unknown): string {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.dispatchQueue.push({ id, action, payload });
    return id;
  }

  assignTask(
    taskId: string,
    assignedAgentId: string,
    assignedAgentName: string,
    matchScore: number
  ): void {
    this.taskAssignments.push({
      taskId,
      assignedAgentId,
      assignedAgentName,
      matchScore,
      timestamp: Date.now(),
    });
    const currentLoad = this.agentLoads.get(assignedAgentId) ?? 0;
    this.agentLoads.set(assignedAgentId, currentLoad + 1);
  }

  escalateTask(taskId: string, reason: string): void {
    this.escalations.push({
      taskId,
      reason,
      timestamp: Date.now(),
    });
  }

  getAgentLoad(agentId: string): number {
    return this.agentLoads.get(agentId) ?? 0;
  }
}

export const {
  initializeRuntime,
  resolveRuntime,
  resolveParticipant,
  join,
  leave,
  sendMessage,
  sendEvent,
  runLoop,
} = defineRuntime<MeshRuntimeState>();
