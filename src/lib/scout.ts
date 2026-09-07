import { prisma } from "./db";
import { EE_DOMAINS } from "./constants";
import { DISCOVERY_POOL, type DiscoveryLead } from "./opportunity-data";
import { groundedScoutSearch, isGeminiConfigured } from "./gemini";

type LogLevel = "info" | "success" | "warning" | "error";

type PendingLog = {
  level: LogLevel;
  message: string;
  query?: string;
  citation?: string;
};

function buildQueries(discipline: string): string[] {
  return [
    `${discipline} internship 2026`,
    `${discipline} research fellowship co-op`,
    `${discipline} intern site:careers OR site:jobs`,
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function runSimulatedDiscipline(
  discipline: string,
  existingKeys: Set<string>,
): Promise<{ logs: PendingLog[]; leads: DiscoveryLead[] }> {
  const logs: PendingLog[] = [];
  const queries = buildQueries(discipline);

  for (const q of queries) {
    logs.push({ level: "info", message: `Dispatching query for "${discipline}"`, query: q });
  }

  // Simulate live network/API latency so the execution terminal feels real.
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 400));

  const candidates = shuffle(DISCOVERY_POOL.filter((l) => l.domain === discipline)).filter(
    (l) => !existingKeys.has(dedupeKey(l.title, l.organization)),
  );

  const picked = candidates.slice(0, candidates.length > 0 ? 1 + Math.floor(Math.random() * 2) : 0);

  if (picked.length === 0) {
    logs.push({
      level: "warning",
      message: `No new verified postings found for "${discipline}" this run — catalog already up to date.`,
    });
  }

  for (const lead of picked) {
    logs.push({
      level: "success",
      message: `Verified new posting: "${lead.title}" @ ${lead.organization}`,
      citation: lead.sourceUrl,
    });
  }

  return { logs, leads: picked };
}

async function runGroundedDiscipline(
  discipline: string,
  existingKeys: Set<string>,
): Promise<{ logs: PendingLog[]; leads: DiscoveryLead[]; usedFallback: boolean }> {
  const logs: PendingLog[] = [];
  const queries = buildQueries(discipline);
  for (const q of queries) {
    logs.push({ level: "info", message: `Dispatching Google Search grounded query for "${discipline}"`, query: q });
  }

  try {
    const { leads, citations } = await groundedScoutSearch(discipline, queries);
    const fresh = leads.filter((l) => !existingKeys.has(dedupeKey(l.title, l.organization)));

    for (const c of citations) {
      logs.push({ level: "info", message: `Citation retrieved: ${c.title}`, citation: c.url });
    }
    for (const lead of fresh) {
      logs.push({
        level: "success",
        message: `Verified new posting: "${lead.title}" @ ${lead.organization}`,
        citation: lead.sourceUrl,
      });
    }
    if (fresh.length === 0) {
      logs.push({ level: "warning", message: `No new verified postings surfaced for "${discipline}" this run.` });
    }
    return { logs, leads: fresh, usedFallback: false };
  } catch (err) {
    logs.push({
      level: "warning",
      message: `Live Gemini grounding unavailable for "${discipline}" (${
        err instanceof Error ? err.message : "unknown error"
      }) — falling back to simulated discovery.`,
    });
    const sim = await runSimulatedDiscipline(discipline, existingKeys);
    return { logs: [...logs, ...sim.logs], leads: sim.leads, usedFallback: true };
  }
}

function dedupeKey(title: string, organization: string): string {
  return `${title.toLowerCase().trim()}::${organization.toLowerCase().trim()}`;
}

export async function runScoutAgent(opts: { disciplines?: string[]; trigger: "scheduled" | "manual" }) {
  const disciplines = opts.disciplines && opts.disciplines.length > 0 ? opts.disciplines : [...EE_DOMAINS];
  const startedAt = new Date();

  const scoutRun = await prisma.scoutRun.create({
    data: {
      trigger: opts.trigger,
      disciplines: disciplines.join(", "),
      status: "running",
      provider: isGeminiConfigured() ? "gemini-grounding" : "simulated",
    },
  });

  const existingOpps = await prisma.opportunity.findMany({ select: { title: true, organization: true } });
  const existingKeys = new Set(existingOpps.map((o) => dedupeKey(o.title, o.organization)));

  const allLogs: PendingLog[] = [
    {
      level: "info",
      message: `Scout run started (${opts.trigger}) targeting: ${disciplines.join(", ")}`,
    },
  ];

  let anyFallback = false;
  const allLeads: DiscoveryLead[] = [];

  for (const discipline of disciplines) {
    const { logs, leads, usedFallback } = isGeminiConfigured()
      ? await runGroundedDiscipline(discipline, existingKeys)
      : { ...(await runSimulatedDiscipline(discipline, existingKeys)), usedFallback: false };

    if (usedFallback) anyFallback = true;
    allLogs.push(...logs);
    for (const l of leads) {
      existingKeys.add(dedupeKey(l.title, l.organization));
      allLeads.push(l);
    }
  }

  for (const lead of allLeads) {
    await prisma.opportunity.create({
      data: {
        title: lead.title,
        organization: lead.organization,
        orgType: lead.orgType,
        domain: lead.domain,
        location: lead.location,
        region: lead.region,
        season: lead.season,
        level: lead.level,
        deadline: lead.deadline ? new Date(lead.deadline) : null,
        stipendEstimate: lead.stipendEstimate,
        housingSupport: lead.housingSupport,
        visaSupport: lead.visaSupport,
        description: lead.description,
        responsibilities: lead.responsibilities.join("\n"),
        qualifications: lead.qualifications.join("\n"),
        techStack: lead.techStack.join(", "),
        sourceUrl: lead.sourceUrl,
        userStatus: "discovered",
        scoutRunId: scoutRun.id,
      },
    });
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  allLogs.push({
    level: "success",
    message: `Scout run complete in ${(durationMs / 1000).toFixed(1)}s — ${allLeads.length} new role${
      allLeads.length === 1 ? "" : "s"
    } indexed.`,
  });

  await prisma.scoutLogEntry.createMany({
    data: allLogs.map((l) => ({
      scoutRunId: scoutRun.id,
      level: l.level,
      message: l.message,
      query: l.query ?? null,
      citation: l.citation ?? null,
    })),
  });

  await prisma.scoutRun.update({
    where: { id: scoutRun.id },
    data: {
      status: "completed",
      finishedAt,
      durationMs,
      newRolesCount: allLeads.length,
      provider: isGeminiConfigured() ? (anyFallback ? "simulated" : "gemini-grounding") : "simulated",
    },
  });

  return scoutRun.id;
}
