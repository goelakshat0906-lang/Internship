// Unified AI orchestrator. VoltScout supports two optional live-AI
// providers — Anthropic (Claude + web search) and Google (Gemini + Google
// Search grounding) — with a deterministic heuristic fallback so every
// feature works with zero configuration.
//
// Provider selection: if both API keys are set, Anthropic wins by default
// (set AI_PROVIDER=gemini to force Gemini instead). If only one key is set,
// that one is used. If neither is set, everything runs on the heuristic
// fallback in src/lib/heuristics.ts.

import type { DiscoveryLead } from "./opportunity-data";
import type { OpportunityDTO, ResumeMatchResult, CoverLetterResult } from "./types";
import { isAnthropicConfigured, anthropicGroundedScoutSearch, anthropicMatchResume, anthropicCoverLetter } from "./anthropic";
import { isGeminiConfigured, groundedScoutSearch, geminiMatchResume, geminiCoverLetter } from "./gemini";
import { heuristicMatchResume, heuristicCoverLetter } from "./heuristics";

export type LlmProvider = "anthropic" | "gemini" | "none";
export type ScoutProvider = "anthropic-grounding" | "gemini-grounding" | "simulated";

export function pickLlmProvider(): LlmProvider {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced === "anthropic" && isAnthropicConfigured()) return "anthropic";
  if (forced === "gemini" && isGeminiConfigured()) return "gemini";
  if (isAnthropicConfigured()) return "anthropic";
  if (isGeminiConfigured()) return "gemini";
  return "none";
}

export function isLiveAiConfigured(): boolean {
  return pickLlmProvider() !== "none";
}

/**
 * Runs a live, search-grounded scouting pass for one EE discipline via
 * whichever provider is configured. Throws on failure — src/lib/scout.ts
 * catches this and falls back to simulated discovery.
 */
export async function scoutSearch(
  discipline: string,
  queries: string[],
): Promise<{ leads: DiscoveryLead[]; citations: { title: string; url: string }[]; provider: ScoutProvider }> {
  const provider = pickLlmProvider();
  if (provider === "anthropic") {
    const result = await anthropicGroundedScoutSearch(discipline, queries);
    return { ...result, provider: "anthropic-grounding" };
  }
  if (provider === "gemini") {
    const result = await groundedScoutSearch(discipline, queries);
    return { ...result, provider: "gemini-grounding" };
  }
  throw new Error("No live AI provider configured");
}

export async function matchResume(profileText: string, opportunities: OpportunityDTO[]): Promise<ResumeMatchResult> {
  const provider = pickLlmProvider();
  try {
    if (provider === "anthropic") return await anthropicMatchResume(profileText, opportunities);
    if (provider === "gemini") return await geminiMatchResume(profileText, opportunities);
  } catch {
    // fall through to heuristic
  }
  return heuristicMatchResume(profileText, opportunities);
}

export async function coverLetter(
  opportunity: OpportunityDTO,
  tone: string,
  profileText: string,
): Promise<CoverLetterResult> {
  const provider = pickLlmProvider();
  try {
    if (provider === "anthropic") return await anthropicCoverLetter(opportunity, tone, profileText);
    if (provider === "gemini") return await geminiCoverLetter(opportunity, tone, profileText);
  } catch {
    // fall through to heuristic
  }
  return heuristicCoverLetter(opportunity, tone, profileText);
}
