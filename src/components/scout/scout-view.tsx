"use client";

import { useEffect, useState } from "react";
import { EE_DOMAINS } from "@/lib/constants";
import type { ScoutRunDTO } from "@/lib/types";
import { aiProviderLabel } from "@/lib/format";
import { TerminalLog } from "./terminal-log";
import { Radar, Loader2, Check, X as XIcon, Terminal } from "lucide-react";
import clsx from "clsx";

export function ScoutView() {
  const [selected, setSelected] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<ScoutRunDTO | null>(null);
  const [history, setHistory] = useState<ScoutRunDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    const res = await fetch("/api/scout/logs?limit=10");
    const data = await res.json();
    setHistory(data.runs ?? []);
    if (!currentRun && data.runs?.[0]) setCurrentRun(data.runs[0]);
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDiscipline(d: string) {
    setSelected((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function dispatch() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/scout/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplines: selected.length > 0 ? selected : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scout run failed");
      setCurrentRun(data.run);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scout run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-50">
          <Radar className="text-volt-400" /> Autonomous Scouting Agent
        </h1>
        <p className="mt-1 text-sm text-ink-300">
          Dispatch a targeted scan of the live web for verified EE openings, or let the daily 08:00 UTC autonomous run handle it.
        </p>
      </div>

      <div className="card mb-6 p-4">
        <p className="label-xs mb-2">Targeted Scout Dispatch — select disciplines (none = all)</p>
        <div className="flex flex-wrap gap-2">
          {EE_DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDiscipline(d)}
              className={selected.includes(d) ? "chip-active" : "chip"}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={dispatch} disabled={running} className="btn-primary">
            {running ? <Loader2 size={15} className="animate-spin" /> : <Radar size={15} />}
            {running ? "Scanning…" : "Run Manual Scan"}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-700 bg-ink-800/60 px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-300">
              <Terminal size={14} /> Execution Terminal
            </span>
            {currentRun && (
              <RunStatusBadge status={currentRun.status} />
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto bg-black/40">
            {currentRun ? <TerminalLog logs={currentRun.logs} /> : (
              <p className="p-4 font-mono text-xs text-ink-400">No runs yet. Dispatch a scan to populate the terminal.</p>
            )}
          </div>
          {currentRun && (
            <div className="flex flex-wrap gap-4 border-t border-ink-700 px-4 py-2.5 text-xs text-ink-400">
              <span>Trigger: {currentRun.trigger}</span>
              <span>Disciplines: {currentRun.disciplines.length}</span>
              <span>Duration: {currentRun.durationMs ? `${(currentRun.durationMs / 1000).toFixed(1)}s` : "—"}</span>
              <span>New roles: {currentRun.newRolesCount}</span>
              <span>Provider: {aiProviderLabel(currentRun.provider)}</span>
            </div>
          )}
        </div>

        <div className="card p-4">
          <p className="label-xs mb-3">Run History</p>
          <div className="space-y-2">
            {history.length === 0 && <p className="text-sm text-ink-400">No runs recorded yet.</p>}
            {history.map((run) => (
              <button
                key={run.id}
                onClick={() => setCurrentRun(run)}
                className={clsx(
                  "flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                  currentRun?.id === run.id ? "border-volt-400/50 bg-volt-400/10" : "border-ink-700 hover:bg-ink-800",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-100">{new Date(run.startedAt).toLocaleString()}</span>
                  <RunStatusBadge status={run.status} />
                </div>
                <span className="text-ink-400">
                  {run.trigger} · {run.newRolesCount} new · {run.disciplines.length} disciplines
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  if (status === "running")
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
        <Loader2 size={11} className="animate-spin" /> Running
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
        <XIcon size={11} /> Failed
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
      <Check size={11} /> Completed
    </span>
  );
}
