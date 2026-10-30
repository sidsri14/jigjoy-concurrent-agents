import {
  type ResearcherProfile,
  type CompanyChallenge,
  type CollaborationProposal,
  type CriticReview,
  type MatchmakerTraceLog,
} from "./einstein-types.js";

/**
 * Verified Synthetic Dataset of Academic Researchers for EINSTEIN Network.
 */
export const SYNTHETIC_RESEARCHERS: ResearcherProfile[] = [
  {
    id: "res_elena_001",
    name: "Dr. Elena Rostova",
    institution: "University of Oxford",
    hIndex: 38,
    einsteinStars: 4.8,
    domains: ["quantum-algorithms", "post-quantum-cryptography", "lattice-based-crypto"],
    keyPublications: [
      "Efficient Lattice Reduction for Kyber Variants (IEEE S&P)",
      "Polynomial Multiplication Accelerators in Dilithium (CRYPTO)",
    ],
    patentsCount: 4,
  },
  {
    id: "res_marcus_002",
    name: "Prof. Marcus Vance",
    institution: "Stanford University",
    hIndex: 52,
    einsteinStars: 4.9,
    domains: ["structural-biology", "cryo-em", "generative-chemistry", "oncology"],
    keyPublications: [
      "Allosteric Inhibition of KRAS G12D via Cryo-EM Reconstruction (Nature)",
      "Diffusion Models for Fragment-Based Small Molecule Design (Cell)",
    ],
    patentsCount: 11,
  },
  {
    id: "res_aarav_003",
    name: "Dr. Aarav Patel",
    institution: "Carnegie Mellon University",
    hIndex: 29,
    einsteinStars: 4.6,
    domains: ["formal-verification", "distributed-systems", "solana-runtime", "amm-invariants"],
    keyPublications: [
      "Deterministic Verification of Constant-Product Invariants in High-Throughput AMMs (ACM SIGOPS)",
      "Proof of Ceiling Division Safety in On-Chain Margin Engines (USENIX Security)",
    ],
    patentsCount: 2,
  },
];

/**
 * Verified Synthetic Dataset of Industry Commercial Challenges.
 */
export const SYNTHETIC_CHALLENGES: CompanyChallenge[] = [
  {
    id: "chal_quantsecure_101",
    companyName: "QuantSecure Systems Inc.",
    industry: "Cybersecurity & Defense",
    challengeTitle: "Enterprise Post-Quantum Cryptography Migration Engine",
    description: "Accelerate TLS 1.3 transition to NIST-standardized ML-KEM and ML-DSA algorithms without exceeding hardware latency envelopes.",
    targetDeliverable: "Optimized C/Rust cryptographic kernel with AVX-512 and ARM NEON intrinsics, formal test vector suite.",
    budgetUsd: 180000,
    timelineMonths: 9,
    requiredDomains: ["post-quantum-cryptography", "lattice-based-crypto"],
  },
  {
    id: "chal_bionova_102",
    companyName: "BioNova Therapeutics",
    industry: "Biopharmaceuticals",
    challengeTitle: "Generative Small-Molecule Inhibitor for Undruggable KRAS Mutants",
    description: "Design and synthesize novel macrocyclic scaffolds capable of binding the switch-II pocket of KRAS G12V.",
    targetDeliverable: "Candidate lead molecule with sub-nanomolar affinity, validated via cryo-EM binding assays and in vitro toxicity panels.",
    budgetUsd: 350000,
    timelineMonths: 12,
    requiredDomains: ["structural-biology", "cryo-em", "generative-chemistry"],
  },
  {
    id: "chal_solanainfra_103",
    companyName: "Solana DeFi Infrastructure Labs",
    industry: "Decentralized Finance",
    challengeTitle: "Formal Verification of AMM Concentrated Liquidity & Liquidation Invariants",
    description: "Mathematically verify tick-math rounding bounds and perpetual liquidation invariant safety to eliminate economic exploits.",
    targetDeliverable: "Coq/Lean formal verification proof artifacts and Rust fuzz-testing suite integrated into CI.",
    budgetUsd: 140000,
    timelineMonths: 6,
    requiredDomains: ["formal-verification", "amm-invariants", "solana-runtime"],
  },
];

export class EinsteinCriticAgent {
  public name = "EinsteinCriticAgent";

  /**
   * Evaluates a collaboration proposal and determines whether intervention is required.
   */
  evaluateProposal(proposal: CollaborationProposal, challenge: CompanyChallenge): CriticReview {
    const feedback: string[] = [];

    // 1. Domain Alignment Scoring
    const requiredSet = new Set(challenge.requiredDomains.map((d) => d.toLowerCase()));
    let matchedDomains = 0;
    const propLower = (
      proposal.projectTitle + " " +
      proposal.executiveSummary + " " +
      proposal.methodology
    ).toLowerCase();

    for (const req of requiredSet) {
      const cleanReq = req.replace(/-/g, " ");
      const expandedReq = cleanReq.replace(/\bcrypto\b/g, "cryptography");
      if (
        propLower.includes(req) ||
        propLower.includes(cleanReq) ||
        propLower.includes(expandedReq) ||
        (req.includes("crypto") && propLower.includes("cryptography"))
      ) {
        matchedDomains++;
      }
    }
    const domainAlignmentScore = Math.min(
      100,
      Math.round((matchedDomains / Math.max(1, requiredSet.size)) * 100)
    );

    // 2. Budget Feasibility Scoring
    const totalMilestonePct = proposal.milestones.reduce((acc, m) => acc + m.budgetPercentage, 0);
    let budgetFeasibilityScore = 100;
    if (totalMilestonePct !== 100) {
      budgetFeasibilityScore -= 35;
      feedback.push(
        `CRITIC FLAG: Milestone budget allocation sum is ${totalMilestonePct}%, but must equal exactly 100%.`
      );
    }
    if (proposal.budgetUsd > challenge.budgetUsd) {
      budgetFeasibilityScore -= 40;
      feedback.push(
        `CRITIC FLAG: Proposed budget ($${proposal.budgetUsd}) exceeds company ceiling ($${challenge.budgetUsd}).`
      );
    }

    // 3. Methodology Rigor & Safety Check
    let methodologyRigorScore = 90;
    if (proposal.milestones.length < 3) {
      methodologyRigorScore -= 25;
      feedback.push("CRITIC FLAG: Insufficient granularity. At least 3 milestone phases required.");
    }

    const hasValidationPhase = proposal.milestones.some(
      (m) =>
        m.deliverable.toLowerCase().includes("validation") ||
        m.deliverable.toLowerCase().includes("verification") ||
        m.deliverable.toLowerCase().includes("testing") ||
        m.deliverable.toLowerCase().includes("fuzz") ||
        m.deliverable.toLowerCase().includes("proof") ||
        m.deliverable.toLowerCase().includes("assay") ||
        m.deliverable.toLowerCase().includes("audit")
    );
    if (!hasValidationPhase) {
      methodologyRigorScore -= 20;
      feedback.push("CRITIC FLAG: Missing dedicated verification/validation phase.");
    }

    const overallScore = Math.round(
      domainAlignmentScore * 0.35 +
      budgetFeasibilityScore * 0.35 +
      methodologyRigorScore * 0.30
    );

    const interventionRequired = overallScore < 80 || feedback.length > 0;
    const approved = !interventionRequired;

    return {
      reviewId: `rev_${proposal.id}_${Date.now()}`,
      proposalId: proposal.id,
      criticName: this.name,
      overallScore,
      approved,
      interventionRequired,
      domainAlignmentScore,
      budgetFeasibilityScore,
      methodologyRigorScore,
      feedback: feedback.length > 0 ? feedback : ["Approved: Proposal meets rigorous academic-industrial standards."],
      reviewedAt: Date.now(),
    };
  }
}

export class EinsteinMatchmakerPipeline {
  private critic = new EinsteinCriticAgent();
  public traceLogs: MatchmakerTraceLog[] = [];

  /**
   * Executes end-to-end matchmaking, proposal generation, and Critic intervention loop.
   */
  runFullPipeline(): {
    proposals: CollaborationProposal[];
    reviews: CriticReview[];
    traceLogs: MatchmakerTraceLog[];
  } {
    const proposals: CollaborationProposal[] = [];
    const reviews: CriticReview[] = [];

    // Pair 1: Dr. Elena Rostova x QuantSecure Inc.
    const res1 = SYNTHETIC_RESEARCHERS[0];
    const chal1 = SYNTHETIC_CHALLENGES[0];
    this.log("Matching", `Matched '${res1.name}' (${res1.institution}) with '${chal1.companyName}' (Stars: ${res1.einsteinStars})`);

    const prop1: CollaborationProposal = {
      id: "prop_pqc_001",
      researcherId: res1.id,
      researcherName: res1.name,
      companyId: chal1.id,
      companyName: chal1.companyName,
      projectTitle: "Accelerated Lattice-Based Post-Quantum Cryptography Kernel for Enterprise TLS",
      executiveSummary: "Joint research project porting and mathematically verifying ML-KEM/ML-DSA lattice algorithms on targeted server architectures.",
      methodology: "Implement polynomial arithmetic optimizations using Montgomery multiplication and AVX-512 vector extensions. Formal lattice reduction checks ensure constant-time execution.",
      budgetUsd: 175000,
      milestones: [
        { month: 3, deliverable: "AVX-512 constant-time polynomial multiplication kernel", budgetPercentage: 30 },
        { month: 6, deliverable: "Integration into OpenSSL/BoringSSL TLS 1.3 testbed", budgetPercentage: 40 },
        { month: 9, deliverable: "Formal verification validation report & side-channel audit", budgetPercentage: 30 },
      ],
      ipTerms: "Non-exclusive commercial license to QuantSecure; academic publishing rights retained by Oxford.",
      status: "UnderReview",
      generatedAt: Date.now(),
    };
    proposals.push(prop1);

    const review1 = this.critic.evaluateProposal(prop1, chal1);
    reviews.push(review1);
    prop1.status = review1.approved ? "Approved" : "NeedsRevision";
    this.log("CriticEvaluation", `Critic reviewed proposal '${prop1.id}': Score ${review1.overallScore}/100, Status: ${prop1.status}`);

    // Pair 2: Prof. Marcus Vance x BioNova Therapeutics (With Critic Intervention!)
    const res2 = SYNTHETIC_RESEARCHERS[1];
    const chal2 = SYNTHETIC_CHALLENGES[1];
    this.log("Matching", `Matched '${res2.name}' (${res2.institution}) with '${chal2.companyName}' (Stars: ${res2.einsteinStars})`);

    // Initial draft has flawed budget allocation and missing validation (triggers Critic intervention)
    const prop2Draft: CollaborationProposal = {
      id: "prop_kras_002",
      researcherId: res2.id,
      researcherName: res2.name,
      companyId: chal2.id,
      companyName: chal2.companyName,
      projectTitle: "Cryo-EM Guided Generative Chemistry for KRAS G12V Macrocycles",
      executiveSummary: "High-resolution structural characterization and generative scaffold synthesis for KRAS switch-II pockets.",
      methodology: "Structural biology cryo-em reconstitution paired with 3D generative chemistry diffusion models.",
      budgetUsd: 340000,
      milestones: [
        { month: 4, deliverable: "Cryo-EM 2.1A structure determination of KRAS complex", budgetPercentage: 50 },
        { month: 8, deliverable: "Synthesis of initial 20 macrocyclic lead variants", budgetPercentage: 60 }, // Sum = 110% (Error)
      ],
      ipTerms: "Joint patent ownership on synthesized composition of matter.",
      status: "UnderReview",
      generatedAt: Date.now(),
    };

    this.log("ProposalGeneration", `Drafted initial proposal '${prop2Draft.id}'`);
    const review2Initial = this.critic.evaluateProposal(prop2Draft, chal2);
    this.log("Intervention", `CRITIC INTERVENTION TRIGGERED for '${prop2Draft.id}': ${review2Initial.feedback.join(" | ")}`);

    // Revision applied: fix milestone budget sum to 100% and add testing/validation milestone
    const prop2Revised: CollaborationProposal = {
      ...prop2Draft,
      milestones: [
        { month: 4, deliverable: "Cryo-EM 2.1A structure determination of KRAS complex", budgetPercentage: 35 },
        { month: 8, deliverable: "Generative chemistry synthesis of 20 lead macrocycles", budgetPercentage: 35 },
        { month: 12, deliverable: "In vitro binding affinity assay & cellular cytotoxicity validation", budgetPercentage: 30 },
      ],
      status: "UnderReview",
    };
    const review2Final = this.critic.evaluateProposal(prop2Revised, chal2);
    prop2Revised.status = review2Final.approved ? "Approved" : "NeedsRevision";
    reviews.push(review2Final);
    proposals.push(prop2Revised);
    this.log("Approval", `Critic RE-EVALUATION PASSED for '${prop2Revised.id}': Score ${review2Final.overallScore}/100, Status: Approved`);

    // Pair 3: Dr. Aarav Patel x Solana DeFi Infrastructure Labs
    const res3 = SYNTHETIC_RESEARCHERS[2];
    const chal3 = SYNTHETIC_CHALLENGES[2];
    this.log("Matching", `Matched '${res3.name}' (${res3.institution}) with '${chal3.companyName}' (Stars: ${res3.einsteinStars})`);

    const prop3: CollaborationProposal = {
      id: "prop_solana_formal_003",
      researcherId: res3.id,
      researcherName: res3.name,
      companyId: chal3.id,
      companyName: chal3.companyName,
      projectTitle: "Formal Verification of Solana AMM Invariants and Liquidation Bounds",
      executiveSummary: "Mathematical proof development and automated invariant auditing for high-speed constant-product and concentrated liquidity engines.",
      methodology: "Formal verification of amm-invariants and solana-runtime tick arithmetic using Coq theorem prover, accompanied by property-based fuzz tests.",
      budgetUsd: 135000,
      milestones: [
        { month: 2, deliverable: "Coq formal specification of constant-product rounding bounds", budgetPercentage: 30 },
        { month: 4, deliverable: "Automated regression fuzzer running 10M synthetic trades", budgetPercentage: 35 },
        { month: 6, deliverable: "Final mathematical proof artifact & CI verification harness", budgetPercentage: 35 },
      ],
      ipTerms: "Open-source under MIT/Apache-2.0; public good tooling sponsored by Solana DeFi Labs.",
      status: "UnderReview",
      generatedAt: Date.now(),
    };
    proposals.push(prop3);

    const review3 = this.critic.evaluateProposal(prop3, chal3);
    reviews.push(review3);
    prop3.status = review3.approved ? "Approved" : "NeedsRevision";
    this.log("CriticEvaluation", `Critic reviewed proposal '${prop3.id}': Score ${review3.overallScore}/100, Status: ${prop3.status}`);

    return {
      proposals,
      reviews,
      traceLogs: this.traceLogs,
    };
  }

  private log(stage: MatchmakerTraceLog["stage"], message: string, details?: Record<string, any>) {
    this.traceLogs.push({
      timestamp: Date.now(),
      stage,
      message,
      details,
    });
  }
}
