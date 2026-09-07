"use client";

import type { OpportunityDTO } from "@/lib/types";
import { orgTypeLabel, regionLabel, seasonLabel, levelLabel, formatDeadline, daysUntil } from "@/lib/format";
import { MapPin, Clock, Banknote, ShieldCheck, ShieldOff } from "lucide-react";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  discovered: "border-ink-500 bg-ink-700 text-ink-200",
  saved: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  applied: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  interview: "border-violet-500/40 bg-violet-500/10 text-violet-300",
  offer: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  archived: "border-ink-600 bg-ink-800 text-ink-400",
};

export function OpportunityCard({ opportunity, onOpen }: { opportunity: OpportunityDTO; onOpen: () => void }) {
  const days = daysUntil(opportunity.deadline);

  return (
    <button
      onClick={onOpen}
      className="card group flex h-full flex-col gap-3 p-4 text-left transition-all hover:border-volt-400/40 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-50 group-hover:text-volt-300">{opportunity.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-300">{opportunity.organization}</p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            STATUS_STYLES[opportunity.userStatus],
          )}
        >
          {opportunity.userStatus}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="chip">{opportunity.domain}</span>
        <span className="chip">{orgTypeLabel(opportunity.orgType)}</span>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 text-xs text-ink-300">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} />
          <span className="truncate">
            {opportunity.location} · {regionLabel(opportunity.region)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} />
          <span>
            {seasonLabel(opportunity.season)} · {levelLabel(opportunity.level)}
          </span>
        </div>
        {opportunity.stipendEstimate && (
          <div className="flex items-center gap-1.5">
            <Banknote size={13} />
            <span>{opportunity.stipendEstimate}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-ink-700 pt-2.5 text-xs">
        <span className={clsx("flex items-center gap-1", opportunity.visaSupport ? "text-emerald-400" : "text-ink-400")}>
          {opportunity.visaSupport ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
          {opportunity.visaSupport ? "Visa support" : "No visa support"}
        </span>
        <span className={clsx(days !== null && days <= 14 && days >= 0 ? "text-red-400 font-medium" : "text-ink-400")}>
          Due {formatDeadline(opportunity.deadline)}
        </span>
      </div>
    </button>
  );
}
