import { NextRequest, NextResponse } from "next/server";
import { runScoutAgent } from "@/lib/scout";
import { prisma } from "@/lib/db";
import { toScoutRunDTO } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const disciplines: string[] | undefined = Array.isArray(body.disciplines) ? body.disciplines : undefined;

  try {
    const runId = await runScoutAgent({ disciplines, trigger: "manual" });
    const run = await prisma.scoutRun.findUnique({
      where: { id: runId },
      include: { logs: { orderBy: { timestamp: "asc" } } },
    });
    if (!run) return NextResponse.json({ error: "Run not found after execution" }, { status: 500 });

    return NextResponse.json({ run: toScoutRunDTO(run) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scout run failed" },
      { status: 500 },
    );
  }
}
