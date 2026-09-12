import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toOpportunityDTO } from "@/lib/types";
import { matchesQuery } from "@/lib/search";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const where: Record<string, unknown> = {};

  const orgTypes = params.getAll("orgType");
  if (orgTypes.length) where.orgType = { in: orgTypes };

  const regions = params.getAll("region");
  if (regions.length) where.region = { in: regions };

  const levels = params.getAll("level");
  if (levels.length) where.level = { in: levels };

  const seasons = params.getAll("season");
  if (seasons.length) where.season = { in: seasons };

  const domains = params.getAll("domain");
  if (domains.length) where.domain = { in: domains };

  const statuses = params.getAll("userStatus");
  if (statuses.length) where.userStatus = { in: statuses };

  const visaOnly = params.get("visaOnly");
  if (visaOnly === "true") where.visaSupport = true;

  const hideExpired = params.get("hideExpired");
  if (hideExpired === "true") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    where.OR = [{ deadline: null }, { deadline: { gte: startOfToday } }];
  }

  const rows = await prisma.opportunity.findMany({
    where,
    orderBy: { discoveredAt: "desc" },
  });

  let dtos = rows.map(toOpportunityDTO);

  const query = params.get("query");
  if (query && query.trim()) {
    dtos = dtos.filter((o) => matchesQuery(o, query));
  }

  return NextResponse.json({ opportunities: dtos, total: dtos.length });
}
