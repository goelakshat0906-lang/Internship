import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toScoutRunDTO } from "@/lib/types";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);

  const runs = await prisma.scoutRun.findMany({
    orderBy: { startedAt: "desc" },
    take: Number.isFinite(limit) ? limit : 20,
    include: { logs: { orderBy: { timestamp: "asc" } } },
  });

  return NextResponse.json({ runs: runs.map(toScoutRunDTO) });
}
