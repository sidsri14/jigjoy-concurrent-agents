import {
  SituationContext,
  SituationHandler,
  SituationProcessor,
  SituationSpecification,
} from "@mozaik-ai/core";
import { resolveParticipant, resolveRuntime } from "../runtime.js";

/**
 * Specification that intercepts safety/invariant validation requests.
 */
export class InvariantCheckSpecification extends SituationSpecification {
  isSatisfiedBy(context: SituationContext): boolean {
    return context.event.type === "mesh.invariant_check";
  }
}

/**
 * Processor that deterministically verifies invariant rules on the runtime state.
 */
export class InvariantCheckProcessor implements SituationProcessor {
  apply(context: SituationContext): void {
    const payload = context.event.payload as { rule: string; value: number; threshold: number };
    const runtime = resolveRuntime();
    const state = runtime.state;

    const passed = payload.value <= payload.threshold;
    state.recordInvariant({
      passed,
      rule: payload.rule,
      detail: `Value ${payload.value} evaluated against threshold ${payload.threshold}`,
    });

    const source = resolveParticipant(context.event.producerId).getManifest().name;
    console.log(
      `[Guardrail Invariant] Source=${source} Rule=${payload.rule} Result=${passed ? "PASS" : "FAIL"}`
    );
  }
}

export const invariantCheckHandler: SituationHandler = {
  specification: new InvariantCheckSpecification(),
  processor: new InvariantCheckProcessor(),
};
