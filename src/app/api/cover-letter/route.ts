import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toOpportunityDTO } from "@/lib/types";
import { isGeminiConfigured, geminiCoverLetter } from "@/lib/gemini";
import { heuristicCoverLetter } from "@/lib/heuristics";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const opportunityId: string = body.opportunityId;
  const tone: string = typeof body.tone === "string" ? body.tone : "corporate_tech";
  const profileText: string = typeof body.profileText === "string" ? body.profileText : "";

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
  }

  const row = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!row) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

  const opportunity = toOpportunityDTO(row);
  const profile = profileText.trim() || "A motivated Electrical Engineering student with hands-on coursework and lab project experience.";

  let result;
  if (isGeminiConfigured()) {
    try {
      result = await geminiCoverLetter(opportunity, tone, profile);
    } catch {
      result = heuristicCoverLetter(opportunity, tone, profile);
    }
  } else {
    result = heuristicCoverLetter(opportunity, tone, profile);
  }

  return NextResponse.json(result);
}
