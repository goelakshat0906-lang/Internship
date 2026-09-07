"use client";

import type { ScoutLogEntryDTO } from "@/lib/types";
import clsx from "clsx";
import { ExternalLink } from "lucide-react";

const LEVEL_STYLES: Record<ScoutLogEntryDTO["level"], string> = {
  info: "text-sky-300",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

const LEVEL_PREFIX: Record<ScoutLogEntryDTO["level"], string> = {
  info: "INFO",
  success: "OK",
  warning: "WARN",
  error: "ERR",
};

export function TerminalLog({ logs }: { logs: ScoutLogEntryDTO[] }) {
  if (logs.length === 0) {
    return <p className="p-4 font-mono text-xs text-ink-400">No log entries yet. Dispatch a scan to see live output.</p>;
  }

  return (
    <div className="space-y-1.5 p-4 font-mono text-xs leading-relaxed">
      {logs.map((log) => (
        <div key={log.id} className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-ink-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
          <span className={clsx("font-semibold", LEVEL_STYLES[log.level])}>[{LEVEL_PREFIX[log.level]}]</span>
          <span className="text-ink-100">{log.message}</span>
          {log.query && <span className="text-ink-400">query=&quot;{log.query}&quot;</span>}
          {log.citation && (
            <a
              href={log.citation}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-volt-400 hover:underline"
            >
              {log.citation.replace(/^https?:\/\//, "").slice(0, 48)}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
