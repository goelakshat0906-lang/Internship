import { GoogleGenerativeAI } from "@google/generative-ai";
import type { DiscoveryLead } from "./opportunity-data";
import type { OpportunityDTO, ResumeMatchResult, CoverLetterResult } from "./types";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenerativeAI(key);
}

/** Strips ```json fences and extracts the first {...} or [...] block. */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response");
  const candidate = raw.slice(start);
  return JSON.parse(candidate) as T;
}

/**
 * Runs a live, Google-Search-grounded scouting pass for one EE discipline.
 * Requires GEMINI_API_KEY. Throws on any failure — callers should catch and
 * fall back to the simulated discovery pool (see src/lib/scout.ts).
 */
export async function groundedScoutSearch(
  discipline: string,
  queries: string[],
): Promise<{ leads: DiscoveryLead[]; citations: { title: string; url: string }[] }> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // Google Search grounding tool — lets the model issue live web searches
    // and cite sources instead of relying on parametric knowledge alone.
    tools: [{ googleSearch: {} } as unknown as never],
  });

  const prompt = `You are VoltScout's autonomous scouting agent for Electrical Engineering
internships, research fellowships, and co-ops in the "${discipline}" sub-discipline.

Use Google Search to find CURRENTLY OPEN, real, verifiable postings from
company career pages, national lab job boards, or university fellowship
pages. Run searches similar to: ${queries.map((q) => `"${q}"`).join(", ")}.

Return ONLY a JSON array (no prose) of up to 4 postings, each shaped exactly like:
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

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const leads = extractJson<DiscoveryLead[]>(text);

  const groundingChunks =
    (result.response.candidates?.[0]?.groundingMetadata as { groundingChunks?: { web?: { uri?: string; title?: string } }[] } | undefined)
      ?.groundingChunks ?? [];
  const citations = groundingChunks
    .map((c) => ({ title: c.web?.title ?? "Web source", url: c.web?.uri ?? "" }))
    .filter((c) => c.url);

  return { leads, citations };
}

export async function geminiMatchResume(
  profileText: string,
  opportunities: OpportunityDTO[],
): Promise<ResumeMatchResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

Return ONLY JSON shaped exactly like:
{
  "overallFitScore": number (0-100, holistic fit for tier-1 EE labs/employers),
  "strengths": string[] (3-5 core technical strengths evidenced in the profile),
  "growthAreas": string[] (2-4 skill gaps to close for tier-1 labs),
  "recommendations": [
    { "opportunityId": string, "score": number (0-100), "rationale": string (1 sentence) }
  ] (top 5 best-matching opportunityId values from the catalog above, ranked)
}`;

  const result = await model.generateContent(prompt);
  const parsed = extractJson<Omit<ResumeMatchResult, "provider">>(result.response.text());
  return { ...parsed, provider: "gemini" };
}

export async function geminiCoverLetter(
  opportunity: OpportunityDTO,
  tone: string,
  profileText: string,
): Promise<CoverLetterResult> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

Return ONLY JSON shaped exactly like:
{
  "subject": string (email subject line),
  "letter": string (3-4 paragraph cover letter, plain text with \\n\\n between paragraphs),
  "talkingPoints": string[] (4-5 key interview talking points)
}`;

  const result = await model.generateContent(prompt);
  const parsed = extractJson<Omit<CoverLetterResult, "provider">>(result.response.text());
  return { ...parsed, provider: "gemini" };
}
