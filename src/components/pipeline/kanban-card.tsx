"use client";

import { useDraggable } from "@dnd-kit/core";
import type { OpportunityDTO } from "@/lib/types";
import { formatDeadline, daysUntil } from "@/lib/format";
import { GripVertical, MapPin } from "lucide-react";
import clsx from "clsx";

export function KanbanCard({ opportunity, onOpen }: { opportunity: OpportunityDTO; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
  });

  const days = daysUntil(opportunity.deadline);

  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : undefined }
          : undefined
      }
      className={clsx(
        "group rounded-lg border border-ink-700 bg-ink-800/70 p-3 transition-shadow",
        isDragging ? "opacity-60 shadow-2xl" : "hover:border-volt-400/40",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab touch-none text-ink-500 hover:text-ink-200 active:cursor-grabbing"
          aria-label="Drag to move stage"
        >
          <GripVertical size={14} />
        </button>
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-ink-50 group-hover:text-volt-300">{opportunity.title}</p>
          <p className="truncate text-xs text-ink-300">{opportunity.organization}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-400">
            <MapPin size={11} />
            <span className="truncate">{opportunity.location}</span>
          </div>
          <div className={clsx("mt-1 text-[11px]", days !== null && days <= 14 && days >= 0 ? "text-red-400" : "text-ink-500")}>
            Due {formatDeadline(opportunity.deadline)}
          </div>
        </button>
      </div>
    </div>
  );
}
