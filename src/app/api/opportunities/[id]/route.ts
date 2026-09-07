import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toOpportunityDTO } from "@/lib/types";
import { isValidUserStatus } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const row = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ opportunity: toOpportunityDTO(row) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (body.userStatus !== undefined) {
    if (!isValidUserStatus(body.userStatus)) {
      return NextResponse.json({ error: "Invalid userStatus" }, { status: 400 });
    }
    data.userStatus = body.userStatus;
  }

  if (body.userNotes !== undefined) {
    if (typeof body.userNotes !== "string") {
      return NextResponse.json({ error: "userNotes must be a string" }, { status: 400 });
    }
    data.userNotes = body.userNotes;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.opportunity.update({ where: { id: params.id }, data });
    return NextResponse.json({ opportunity: toOpportunityDTO(updated) });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
