import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ORG_TYPES, REGIONS } from "@/lib/constants";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany();
  const total = opportunities.length;

  const byDomain = new Map<string, number>();
  const byOrgType = new Map<string, number>();
  const byRegion = new Map<string, number>();
  let visaYes = 0;
  let visaNo = 0;

  for (const o of opportunities) {
    byDomain.set(o.domain, (byDomain.get(o.domain) ?? 0) + 1);
    byOrgType.set(o.orgType, (byOrgType.get(o.orgType) ?? 0) + 1);
    byRegion.set(o.region, (byRegion.get(o.region) ?? 0) + 1);
    if (o.visaSupport) visaYes++;
    else visaNo++;
  }

  const domainBreakdown = [...byDomain.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  const orgTypeBreakdown = ORG_TYPES.map((t) => ({
    orgType: t.value,
    label: t.label,
    count: byOrgType.get(t.value) ?? 0,
  }));

  const regionBreakdown = REGIONS.map((r) => ({
    region: r.value,
    label: r.label,
    count: byRegion.get(r.value) ?? 0,
  }));

  const industryAcademiaRatio = {
    industryAndCorporate: (byOrgType.get("industry") ?? 0) + (byOrgType.get("corporate") ?? 0),
    academiaAndLabs: (byOrgType.get("research_institute") ?? 0) + (byOrgType.get("university") ?? 0),
  };

  return NextResponse.json({
    total,
    domainBreakdown,
    orgTypeBreakdown,
    regionBreakdown,
    industryAcademiaRatio,
    visaFriendliness: { sponsoring: visaYes, notSponsoring: visaNo },
  });
}
