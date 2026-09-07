import type { Opportunity as PrismaOpportunity, ScoutRun as PrismaScoutRun, ScoutLogEntry as PrismaScoutLogEntry } from "@prisma/client";

// Client/API-facing shape: array fields instead of delimited strings.
export type OpportunityDTO = Omit<
  PrismaOpportunity,
  "responsibilities" | "qualifications" | "techStack" | "deadline" | "discoveredAt" | "createdAt" | "updatedAt"
> & {
  responsibilities: string[];
  qualifications: string[];
  techStack: string[];
  deadline: string | null;
  discoveredAt: string;
  createdAt: string;
  updatedAt: string;
};

export function toOpportunityDTO(o: PrismaOpportunity): OpportunityDTO {
  return {
    ...o,
    responsibilities: splitLines(o.responsibilities),
    qualifications: splitLines(o.qualifications),
    techStack: splitCsv(o.techStack),
    deadline: o.deadline ? o.deadline.toISOString() : null,
    discoveredAt: o.discoveredAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

function splitLines(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitCsv(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export type ScoutLogEntryDTO = {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  query?: string | null;
  citation?: string | null;
};

export type ResumeMatchResult = {
  overallFitScore: number; // 0-100
  strengths: string[];
  growthAreas: string[];
  recommendations: {
    opportunityId: string;
    score: number; // 0-100
    rationale: string;
  }[];
  provider: "anthropic" | "gemini" | "heuristic";
};

export type CoverLetterResult = {
  subject: string;
  letter: string;
  talkingPoints: string[];
  provider: "anthropic" | "gemini" | "heuristic";
};

export type ScoutRunDTO = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  trigger: "scheduled" | "manual";
  disciplines: string[];
  status: "running" | "completed" | "failed";
  durationMs: number | null;
  newRolesCount: number;
  provider: "anthropic-grounding" | "gemini-grounding" | "simulated";
  logs: ScoutLogEntryDTO[];
};

export function toScoutRunDTO(run: PrismaScoutRun & { logs: PrismaScoutLogEntry[] }): ScoutRunDTO {
  return {
    id: run.id,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    trigger: run.trigger as ScoutRunDTO["trigger"],
    disciplines: run.disciplines
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
    status: run.status as ScoutRunDTO["status"],
    durationMs: run.durationMs,
    newRolesCount: run.newRolesCount,
    provider: run.provider as ScoutRunDTO["provider"],
    logs: run.logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      level: l.level as ScoutLogEntryDTO["level"],
      message: l.message,
      query: l.query,
      citation: l.citation,
    })),
  };
}
