// Boots VoltScout's autonomous daily scouting job. Runs once when the
// Next.js server process starts (both `next dev` and `next start`).
//
// Implemented as a self-rescheduling setTimeout (rather than a cron
// dependency) to avoid pulling native/node: -scheme requires into the
// Next.js server bundle via the instrumentation entry point.
function msUntilNext8amUtc(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const globalForCron = globalThis as unknown as { __voltscoutCronStarted?: boolean };
  if (globalForCron.__voltscoutCronStarted) return;
  globalForCron.__voltscoutCronStarted = true;

  const { runScoutAgent } = await import("./lib/scout");

  const scheduleNext = () => {
    const delay = msUntilNext8amUtc();
    setTimeout(async () => {
      try {
        await runScoutAgent({ trigger: "scheduled" });
      } catch (err) {
        console.error("[VoltScout] Scheduled scout run failed:", err);
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  scheduleNext();
  console.log("[VoltScout] Autonomous scout scheduler armed — daily run at 08:00 UTC.");
}
