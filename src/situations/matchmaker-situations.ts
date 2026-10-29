import {
  SituationContext,
  SituationHandler,
  SituationProcessor,
  SituationSpecification,
  SemanticEvent,
} from "@mozaik-ai/core";
import { resolveParticipant, resolveRuntime, sendEvent } from "../runtime.js";

export interface TaskRoutingRequestPayload {
  taskId: string;
  title: string;
  requiredSkills: string[];
  complexity?: "low" | "medium" | "high";
  candidateAgentIds: string[];
}

/**
 * Specification matching task routing requests across the mesh.
 */
export class TaskRoutingSpecification extends SituationSpecification {
  isSatisfiedBy(context: SituationContext): boolean {
    return context.event.type === "task.routing_request";
  }
}

/**
 * Computes semantic skill overlap and load-adjusted fitness score.
 * Formula:
 * score = (matching_skills / required_skills) * 100 - (active_load * 15)
 */
export function computeMatchScore(
  requiredSkills: string[],
  agentCapabilities: string[],
  activeLoad: number
): number {
  if (requiredSkills.length === 0) return 100 - activeLoad * 15;

  const agentSkillSet = new Set(agentCapabilities.map((s) => s.toLowerCase()));
  let matches = 0;

  for (const skill of requiredSkills) {
    if (agentSkillSet.has(skill.toLowerCase())) {
      matches++;
    }
  }

  const baseScore = (matches / requiredSkills.length) * 100;
  // Apply load penalty (15 points per active task)
  const adjustedScore = Math.max(0, baseScore - activeLoad * 15);
  return Math.round(adjustedScore);
}

/**
 * Processor for EINSTEIN Matchmaker / Autonomous Skill Routing.
 */
export class TaskRoutingProcessor implements SituationProcessor {
  apply(context: SituationContext): void {
    const payload = context.event.payload as TaskRoutingRequestPayload;
    const runtime = resolveRuntime();
    const state = runtime.state;

    let bestAgentId: string | null = null;
    let bestAgentName: string = "";
    let bestScore = -1;

    for (const candidateId of payload.candidateAgentIds) {
      try {
        const participant = resolveParticipant(candidateId);
        const manifest = participant.getManifest();
        const capabilities = (manifest.capabilities as string[]) ?? [];
        const load = state.getAgentLoad(candidateId);

        const score = computeMatchScore(payload.requiredSkills, capabilities, load);

        if (score > bestScore) {
          bestScore = score;
          bestAgentId = candidateId;
          bestAgentName = manifest.name;
        }
      } catch {
        // Candidate not found in mesh, continue
      }
    }

    // Minimum acceptable match threshold is 40 points
    const MATCH_THRESHOLD = 40;

    if (bestAgentId && bestScore >= MATCH_THRESHOLD) {
      state.assignTask(payload.taskId, bestAgentId, bestAgentName, bestScore);
      console.log(
        `[EINSTEIN Matchmaker] Task '${payload.taskId}' -> Assigned to '${bestAgentName}' (Score: ${bestScore}%)`
      );

      // Emit assignment notification event
      const assignmentEvent = SemanticEvent.create(
        "task.assigned",
        context.event.producerId,
        {
          taskId: payload.taskId,
          agentId: bestAgentId,
          score: bestScore,
        }
      );
      sendEvent(assignmentEvent, context.event.producerId);
    } else {
      const reason = bestScore >= 0
        ? `Best score (${bestScore}%) below threshold (${MATCH_THRESHOLD}%)`
        : "No registered candidate agents available";
      state.escalateTask(payload.taskId, reason);
      console.log(
        `[EINSTEIN Matchmaker] Task '${payload.taskId}' -> Escalated to Supervisor (${reason})`
      );

      const escalationEvent = SemanticEvent.create(
        "task.escalated",
        context.event.producerId,
        {
          taskId: payload.taskId,
          reason,
        }
      );
      sendEvent(escalationEvent, context.event.producerId);
    }
  }
}

export const taskRoutingHandler: SituationHandler = {
  specification: new TaskRoutingSpecification(),
  processor: new TaskRoutingProcessor(),
};
