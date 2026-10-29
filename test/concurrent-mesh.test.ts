import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { SemanticEvent } from "@mozaik-ai/core";
import { bootstrapMesh } from "../src/index.js";
import { sendEvent } from "../src/runtime.js";

describe("JigJoy Concurrent Agent Mesh Suite", () => {
  let mesh: ReturnType<typeof bootstrapMesh>;

  before(() => {
    mesh = bootstrapMesh();
  });

  test("initializes mesh runtime with healthy state", () => {
    assert.strictEqual(mesh.state.isHalted, false);
    assert.strictEqual(mesh.state.verifiedInvariants.length, 0);
  });

  test("evaluates passing invariant event through guardrail agent", () => {
    const producerId = mesh.sensorAgent.getId();
    const event = SemanticEvent.create(
      "mesh.invariant_check",
      producerId,
      {
        rule: "TokenBudgetLimit",
        value: 1200,
        threshold: 2000,
      }
    );

    sendEvent(event, producerId);

    assert.strictEqual(mesh.state.verifiedInvariants.length, 1);
    assert.strictEqual(mesh.state.verifiedInvariants[0].passed, true);
    assert.strictEqual(mesh.state.isHalted, false);
  });

  test("halts mesh when invariant rule fails", () => {
    const producerId = mesh.sensorAgent.getId();
    const event = SemanticEvent.create(
      "mesh.invariant_check",
      producerId,
      {
        rule: "MaxErrorRate",
        value: 15,
        threshold: 5,
      }
    );

    sendEvent(event, producerId);

    assert.strictEqual(mesh.state.verifiedInvariants.length, 2);
    assert.strictEqual(mesh.state.verifiedInvariants[1].passed, false);
    assert.strictEqual(mesh.state.isHalted, true);
  });
});
