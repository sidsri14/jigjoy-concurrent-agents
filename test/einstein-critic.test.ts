import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  SYNTHETIC_RESEARCHERS,
  SYNTHETIC_CHALLENGES,
  EinsteinCriticAgent,
  EinsteinMatchmakerPipeline,
} from "../src/einstein-matchmaker.js";

describe("EINSTEIN Matchmaker & Critic Evaluation Suite", () => {
  const critic = new EinsteinCriticAgent();

  test("loads verified synthetic researchers and commercial challenges", () => {
    assert.strictEqual(SYNTHETIC_RESEARCHERS.length, 3);
    assert.strictEqual(SYNTHETIC_CHALLENGES.length, 3);

    const researcher1 = SYNTHETIC_RESEARCHERS[0];
    assert.strictEqual(researcher1.name, "Dr. Elena Rostova");
    assert.ok(researcher1.einsteinStars >= 4.0);
    assert.ok(researcher1.domains.includes("post-quantum-cryptography"));

    const challenge1 = SYNTHETIC_CHALLENGES[0];
    assert.strictEqual(challenge1.companyName, "QuantSecure Systems Inc.");
    assert.strictEqual(challenge1.budgetUsd, 180000);
  });

  test("Critic Agent approves well-formed proposal with high score", () => {
    const researcher = SYNTHETIC_RESEARCHERS[0];
    const challenge = SYNTHETIC_CHALLENGES[0];

    const review = critic.evaluateProposal(
      {
        id: "prop_test_01",
        researcherId: researcher.id,
        researcherName: researcher.name,
        companyId: challenge.id,
        companyName: challenge.companyName,
        projectTitle: "Post-Quantum Cryptography Lattice Implementation",
        executiveSummary: "Summary",
        methodology: "Implement post-quantum-cryptography and lattice-based-crypto with AVX-512 testing",
        budgetUsd: 150000,
        milestones: [
          { month: 2, deliverable: "Kernel design", budgetPercentage: 30 },
          { month: 4, deliverable: "Integration testing", budgetPercentage: 30 },
          { month: 6, deliverable: "Formal validation report", budgetPercentage: 40 },
        ],
        ipTerms: "Open",
        status: "UnderReview",
        generatedAt: Date.now(),
      },
      challenge
    );

    assert.strictEqual(review.approved, true);
    assert.strictEqual(review.interventionRequired, false);
    assert.ok(review.overallScore >= 80);
    assert.strictEqual(review.budgetFeasibilityScore, 100);
  });

  test("Critic Agent flags intervention when budget percentage sum != 100%", () => {
    const researcher = SYNTHETIC_RESEARCHERS[1];
    const challenge = SYNTHETIC_CHALLENGES[1];

    const review = critic.evaluateProposal(
      {
        id: "prop_flawed_budget",
        researcherId: researcher.id,
        researcherName: researcher.name,
        companyId: challenge.id,
        companyName: challenge.companyName,
        projectTitle: "Cryo-EM KRAS Study",
        executiveSummary: "Summary",
        methodology: "Structural biology cryo-em assay",
        budgetUsd: 300000,
        milestones: [
          { month: 3, deliverable: "Phase 1 testing", budgetPercentage: 40 },
          { month: 6, deliverable: "Phase 2 assay validation", budgetPercentage: 40 }, // Sum = 80% != 100%
        ],
        ipTerms: "Open",
        status: "UnderReview",
        generatedAt: Date.now(),
      },
      challenge
    );

    assert.strictEqual(review.approved, false);
    assert.strictEqual(review.interventionRequired, true);
    assert.ok(review.feedback.some((f) => f.includes("must equal exactly 100%")));
  });

  test("Pipeline runs 3 researcher-company pairs and captures Critic intervention trace", () => {
    const pipeline = new EinsteinMatchmakerPipeline();
    const result = pipeline.runFullPipeline();

    // 1. Exactly 3 proposals processed
    assert.strictEqual(result.proposals.length, 3);
    assert.strictEqual(result.reviews.length, 3);

    // 2. All 3 final proposals are Approved
    for (const prop of result.proposals) {
      assert.strictEqual(prop.status, "Approved");
      assert.ok(prop.milestones.length >= 3);
      const totalPct = prop.milestones.reduce((acc, m) => acc + m.budgetPercentage, 0);
      assert.strictEqual(totalPct, 100);
    }

    // 3. Trace logs confirm Critic intervention on Pair 2 (BioNova Therapeutics)
    const interventionLogs = result.traceLogs.filter((l) => l.stage === "Intervention");
    assert.ok(interventionLogs.length >= 1);
    assert.ok(interventionLogs[0].message.includes("CRITIC INTERVENTION TRIGGERED"));
    assert.ok(interventionLogs[0].message.includes("prop_kras_002"));

    // 4. Trace logs confirm subsequent Approval after revision
    const approvalLogs = result.traceLogs.filter((l) => l.stage === "Approval");
    assert.ok(approvalLogs.length >= 1);
    assert.ok(approvalLogs[0].message.includes("RE-EVALUATION PASSED"));
  });
});
