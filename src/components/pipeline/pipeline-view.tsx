"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { RoleDetailModal } from "@/components/catalog/role-detail-modal";
import type { OpportunityDTO } from "@/lib/types";
import { KANBAN_STAGES } from "@/lib/constants";
import { Kanban } from "lucide-react";

export function PipelineView() {
  const [opportunities, setOpportunities] = useState<OpportunityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openOpportunity, setOpenOpportunity] = useState<OpportunityDTO | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    KANBAN_STAGES.forEach((s) => params.append("userStatus", s.value));
    const res = await fetch(`/api/opportunities?${params.toString()}`);
    const data = await res.json();
    setOpportunities(data.opportunities ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStage = String(over.id);
    const opp = opportunities.find((o) => o.id === active.id);
    if (!opp || opp.userStatus === newStage) return;

    setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? { ...o, userStatus: newStage } : o)));

    await fetch(`/api/opportunities/${opp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userStatus: newStage }),
    });
  }

  function handleUpdated(updated: OpportunityDTO) {
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setOpenOpportunity(updated);
  }

  const activeOpp = opportunities.find((o) => o.id === activeId) ?? null;

  const stats = KANBAN_STAGES.map((s) => ({
    ...s,
    count: opportunities.filter((o) => o.userStatus === s.value).length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-50">
          <Kanban className="text-volt-400" /> Application Pipeline
        </h1>
        <p className="mt-1 text-sm text-ink-300">Track every application from wishlist to offer. Drag cards between stages or use the role modal.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.value} className="card p-3">
            <p className="text-2xl font-bold text-ink-50">{s.count}</p>
            <p className="text-xs text-ink-300">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {KANBAN_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.value}
                stage={stage.value}
                title={stage.label}
                opportunities={opportunities.filter((o) => o.userStatus === stage.value)}
                onOpen={setOpenOpportunity}
              />
            ))}
          </div>
          <DragOverlay>{activeOpp ? <KanbanCard opportunity={activeOpp} onOpen={() => {}} /> : null}</DragOverlay>
        </DndContext>
      )}

      {opportunities.length === 0 && !loading && (
        <div className="card mt-6 flex flex-col items-center gap-2 p-12 text-center">
          <p className="text-ink-200">No opportunities in your pipeline yet.</p>
          <p className="text-sm text-ink-400">Save roles from the Catalog to start tracking them here.</p>
        </div>
      )}

      {openOpportunity && (
        <RoleDetailModal opportunity={openOpportunity} onClose={() => setOpenOpportunity(null)} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
