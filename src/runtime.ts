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

/**
 * Shared runtime state across all concurrent agents in the mesh.
 */
export class MeshRuntimeState extends RuntimeState {
  public telemetryLog: TelemetryEvent[] = [];
  public verifiedInvariants: InvariantResult[] = [];
  public dispatchQueue: Array<{ id: string; action: string; payload: unknown }> = [];
  public isHalted: boolean = false;

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
