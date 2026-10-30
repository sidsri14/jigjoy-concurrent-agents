export interface ResearcherProfile {
  id: string;
  name: string;
  institution: string;
  hIndex: number;
  einsteinStars: number; // 1 to 5 stars
  domains: string[];
  keyPublications: string[];
  patentsCount: number;
}

export interface CompanyChallenge {
  id: string;
  companyName: string;
  industry: string;
  challengeTitle: string;
  description: string;
  targetDeliverable: string;
  budgetUsd: number;
  timelineMonths: number;
  requiredDomains: string[];
}

export interface ProposalMilestone {
  month: number;
  deliverable: string;
  budgetPercentage: number;
}

export interface CollaborationProposal {
  id: string;
  researcherId: string;
  researcherName: string;
  companyId: string;
  companyName: string;
  projectTitle: string;
  executiveSummary: string;
  methodology: string;
  milestones: ProposalMilestone[];
  budgetUsd: number;
  ipTerms: string;
  status: "Draft" | "UnderReview" | "NeedsRevision" | "Approved" | "Rejected";
  generatedAt: number;
}

export interface CriticReview {
  reviewId: string;
  proposalId: string;
  criticName: string;
  overallScore: number; // 0 to 100
  approved: boolean;
  interventionRequired: boolean;
  domainAlignmentScore: number;
  budgetFeasibilityScore: number;
  methodologyRigorScore: number;
  feedback: string[];
  reviewedAt: number;
}

export interface MatchmakerTraceLog {
  timestamp: number;
  stage: "Matching" | "ProposalGeneration" | "CriticEvaluation" | "Intervention" | "Approval";
  message: string;
  details?: Record<string, any>;
}
