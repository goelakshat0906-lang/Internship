import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { DiscoveryLead } from "./opportunity-data";
import type { OpportunityDTO, ResumeMatchResult, CoverLetterResult } from "./types";
import { extractJson } from "./json-extract";

// Default is Anthropic's most capable current model; override via
// ANTHROPIC_MODEL if you explicitly want a cheaper/faster one (e.g.
// "claude-haiku-4-5") for lower cost at some quality tradeoff.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey: key });
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Runs a live, web-search-grounded scouting pass for one EE discipline using
 * Claude's server-side web search tool. Requires ANTHROPIC_API_KEY. Throws on
 * any failure — callers should catch and fall back to simulated discovery
 * (see src/lib/scout.ts).
 */
export async function anthropicGroundedScoutSearch(
  discipline: string,
  queries: string[],
): Promise<{ leads: DiscoveryLead[]; citations: { title: string; url: string }[] }> {
  const client = getClient();

  const prompt = `You are VoltScout's autonomous scouting agent for Electrical Engineering
internships, research fellowships, and co-ops in the "${discipline}" sub-discipline.

Use the web_search tool to find CURRENTLY OPEN, real, verifiable postings from
company career pages, national lab job boards, or university fellowship
pages. Run searches similar to: ${queries.map((q) => `"${q}"`).join(", ")}.

Once you're done searching, respond with ONLY a JSON array (no prose, no markdown
fences) of up to 4 postings, each shaped exactly like:
{
  "title": string,
  "organization": string,
  "orgType": "industry" | "corporate" | "research_institute" | "university",
  "domain": "${discipline}",
  "location": string,
  "region": "north_america" | "europe" | "asia_pacific" | "global_remote",
  "season": "summer_2026" | "fall_2026" | "spring_2027" | "year_round",
  "level": "undergraduate" | "masters" | "phd",
  "deadline": string | null (ISO date),
  "stipendEstimate": string | null,
  "housingSupport": string | null,
  "visaSupport": boolean,
  "description": string (2-3 sentences),
  "responsibilities": string[] (3-5 bullet points),
  "qualifications": string[] (3-5 bullet points),
  "techStack": string[] (relevant EDA tools/frameworks),
  "sourceUrl": string (the real URL you found)
}
Only include postings you found real, verifiable source URLs for.`;

  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 4 },
  ];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  let response = await client.messages.create({ model: MODEL, max_tokens: 8000, tools, messages });

  // A long-running server-tool turn can pause; resume until end_turn or a
  // small hard cap so a misbehaving loop can't run away.
  let guard = 0;
  while (response.stop_reason === "pause_turn" && guard < 4) {
    messages.push({ role: "assistant", content: response.content });
    response = await client.messages.create({ model: MODEL, max_tokens: 8000, tools, messages });
    guard++;
  }

  const leads = extractJson<DiscoveryLead[]>(textOf(response.content));

  const citations: { title: string; url: string }[] = [];
  for (const block of response.content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const item of block.content) {
        citations.push({ title: item.title, url: item.url });
      }
    }
  }

  return { leads, citations };
}

const ResumeMatchSchema = z.object({
  overallFitScore: z.number(),
  strengths: z.array(z.string()),
  growthAreas: z.array(z.string()),
  recommendations: z.array(
    z.object({
      opportunityId: z.string(),
      score: z.number(),
      rationale: z.string(),
    }),
  ),
});

export async function anthropicMatchResume(
  profileText: string,
  opportunities: OpportunityDTO[],
): Promise<ResumeMatchResult> {
  const client = getClient();

  const catalog = opportunities
    .slice(0, 40)
    .map((o) => `- id:${o.id} | ${o.title} @ ${o.organization} | domain:${o.domain} | tools:${o.techStack.join(", ")}`)
    .join("\n");

  const prompt = `You are VoltScout's AI Candidate Fit engine for Electrical Engineering
internships. A candidate pasted this profile (coursework, projects, tools):
"""
${profileText}
"""

Here is the current opportunity catalog:
${catalog}

Score the candidate's overall fit (0-100, holistic fit for tier-1 EE labs/employers),
identify 3-5 core technical strengths evidenced in the profile, 2-4 skill growth
areas to close for tier-1 labs, and rank the top 5 best-matching opportunityId
values from the catalog above with a score (0-100) and a 1-sentence rationale each.`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(ResumeMatchSchema) },
  });

  if (!response.parsed_output) throw new Error("Anthropic structured output parsing failed");
  return { ...response.parsed_output, provider: "anthropic" };
}

const CoverLetterSchema = z.object({
  subject: z.string(),
  letter: z.string(),
  talkingPoints: z.array(z.string()),
});

export async function anthropicCoverLetter(
  opportunity: OpportunityDTO,
  tone: string,
  profileText: string,
): Promise<CoverLetterResult> {
  const client = getClient();

  const toneGuidance: Record<string, string> = {
    corporate_tech: "polished, confident, results-oriented corporate tech voice",
    academic_rigor: "precise, scholarly voice emphasizing research rigor and methodology",
    cutting_edge: "energetic, visionary voice emphasizing innovation and bold impact",
  };

  const prompt = `Write a tailored, technical cover letter for this EE candidate applying to:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Domain: ${opportunity.domain}
Key tools: ${opportunity.techStack.join(", ")}
Responsibilities: ${opportunity.responsibilities.join("; ")}
Qualifications sought: ${opportunity.qualifications.join("; ")}

Candidate profile:
"""
${profileText}
"""

Tone: ${toneGuidance[tone] ?? toneGuidance.corporate_tech}.

Produce an email subject line, a 3-4 paragraph cover letter (plain text,
blank line between paragraphs), and 4-5 key interview talking points.`;

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    output_config: { format: zodOutputFormat(CoverLetterSchema) },
  });

  if (!response.parsed_output) throw new Error("Anthropic structured output parsing failed");
  return { ...response.parsed_output, provider: "anthropic" };
}
