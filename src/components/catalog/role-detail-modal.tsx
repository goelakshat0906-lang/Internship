"use client";

import { useEffect, useState } from "react";
import type { OpportunityDTO } from "@/lib/types";
import { orgTypeLabel, regionLabel, seasonLabel, levelLabel, formatDeadline } from "@/lib/format";
import { USER_STATUSES } from "@/lib/constants";
import { X, MapPin, ExternalLink, Banknote, Home, ShieldCheck, ShieldOff, Save } from "lucide-react";

export function RoleDetailModal({
  opportunity,
  onClose,
  onUpdated,
}: {
  opportunity: OpportunityDTO;
  onClose: () => void;
  onUpdated: (updated: OpportunityDTO) => void;
}) {
  const [status, setStatus] = useState(opportunity.userStatus);
  const [notes, setNotes] = useState(opportunity.userNotes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setStatus(opportunity.userStatus);
    setNotes(opportunity.userNotes);
  }, [opportunity]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function persist(next: { userStatus?: string; userNotes?: string }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdated(data.opportunity);
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(next: string) {
    setStatus(next);
    persist({ userStatus: next });
  }

  function handleNotesBlur() {
    if (notes !== opportunity.userNotes) persist({ userNotes: notes });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm" onClick={onClose}>
      <div
        className="card w-full max-w-2xl bg-ink-900 p-0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-700 p-5">
          <div>
            <p className="text-lg font-bold text-ink-50">{opportunity.title}</p>
            <p className="mt-0.5 text-sm text-ink-300">{opportunity.organization}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip">{opportunity.domain}</span>
              <span className="chip">{orgTypeLabel(opportunity.orgType)}</span>
              <span className="chip">{seasonLabel(opportunity.season)}</span>
              <span className="chip">{levelLabel(opportunity.level)}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost !p-1.5 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <InfoTile icon={<MapPin size={14} />} label="Location" value={`${opportunity.location} · ${regionLabel(opportunity.region)}`} />
            <InfoTile icon={<Banknote size={14} />} label="Stipend" value={opportunity.stipendEstimate ?? "Not disclosed"} />
            <InfoTile icon={<Home size={14} />} label="Housing" value={opportunity.housingSupport ?? "Not specified"} />
            <InfoTile
              icon={opportunity.visaSupport ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
              label="Visa Sponsorship"
              value={opportunity.visaSupport ? "Supported (F-1 CPT/OPT friendly)" : "Not typically sponsored"}
            />
            <InfoTile label="Deadline" value={formatDeadline(opportunity.deadline)} />
            <InfoTile label="Discovered" value={new Date(opportunity.discoveredAt).toLocaleDateString()} />
          </div>

          <section>
            <p className="label-xs mb-1.5">Overview</p>
            <p className="text-sm leading-relaxed text-ink-200">{opportunity.description}</p>
          </section>

          <section>
            <p className="label-xs mb-1.5">Responsibilities</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">
              {opportunity.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="label-xs mb-1.5">Qualifications</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink-200">
              {opportunity.qualifications.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="label-xs mb-1.5">EDA Tools & Frameworks</p>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.techStack.map((t) => (
                <span key={t} className="chip-active">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section>
            <p className="label-xs mb-1.5">Private Notes</p>
            <textarea
              className="input min-h-[90px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add prep notes, referral contacts, interview prep..."
            />
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-700 p-5">
          <div className="flex items-center gap-2">
            <label className="label-xs">Stage</label>
            <select
              className="select !w-auto"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {USER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {saving && <span className="text-xs text-ink-400">Saving…</span>}
            {!saving && savedAt && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Save size={12} /> Saved
              </span>
            )}
          </div>
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            Open Official Portal <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800/60 p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm text-ink-100">{value}</p>
    </div>
  );
}
