import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toOpportunityDTO } from "@/lib/types";
import { isGeminiConfigured, geminiMatchResume } from "@/lib/gemini";
import { heuristicMatchResume } from "@/lib/heuristics";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const profileText: string = typeof body.profileText === "string" ? body.profileText : "";

  if (!profileText.trim()) {
    return NextResponse.json({ error: "profileText is required" }, { status: 400 });
  }

  const rows = await prisma.opportunity.findMany({ orderBy: { discoveredAt: "desc" } });
  const opportunities = rows.map(toOpportunityDTO);

  let result;
  if (isGeminiConfigured()) {
    try {
      result = await geminiMatchResume(profileText, opportunities);
    } catch {
      result = heuristicMatchResume(profileText, opportunities);
    }
  } else {
    result = heuristicMatchResume(profileText, opportunities);
  }

  const byId = new Map(opportunities.map((o) => [o.id, o]));
  const recommendations = result.recommendations
    .filter((r) => byId.has(r.opportunityId))
    .map((r) => ({ ...r, opportunity: byId.get(r.opportunityId)! }));

  return NextResponse.json({ ...result, recommendations });
}
