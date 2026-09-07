"use client";

import { useDroppable } from "@dnd-kit/core";
import type { OpportunityDTO } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import clsx from "clsx";

export function KanbanColumn({
  stage,
  title,
  opportunities,
  onOpen,
}: {
  stage: string;
  title: string;
  opportunities: OpportunityDTO[];
  onOpen: (o: OpportunityDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-ink-100">{title}</p>
        <span className="chip !py-0.5">{opportunities.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx(
          "flex min-h-[60vh] flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-volt-400/60 bg-volt-400/5" : "border-ink-700 bg-ink-900/40",
        )}
      >
        {opportunities.map((o) => (
          <KanbanCard key={o.id} opportunity={o} onOpen={() => onOpen(o)} />
        ))}
        {opportunities.length === 0 && (
          <p className="p-4 text-center text-xs text-ink-500">Drop opportunities here</p>
        )}
      </div>
    </div>
  );
}
