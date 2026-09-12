"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { OpportunityCard } from "./opportunity-card";
import { RoleDetailModal } from "./role-detail-modal";
import { MultiSelect } from "@/components/ui/multi-select";
import type { OpportunityDTO } from "@/lib/types";
import { ORG_TYPES, REGIONS, EDUCATION_LEVELS, SEASONS, EE_DOMAINS, QUICK_FILTERS } from "@/lib/constants";
import { quickFilterToQuery } from "@/lib/search";
import clsx from "clsx";

type Filters = {
  query: string;
  orgType: string[];
  region: string[];
  level: string[];
  season: string[];
  domain: string[];
  visaOnly: boolean;
  hideExpired: boolean;
};

const EMPTY_FILTERS: Filters = {
  query: "",
  orgType: [],
  region: [],
  level: [],
  season: [],
  domain: [],
  visaOnly: false,
  hideExpired: true,
};

export function CatalogView() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [opportunities, setOpportunities] = useState<OpportunityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<OpportunityDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, query: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    filters.orgType.forEach((v) => params.append("orgType", v));
    filters.region.forEach((v) => params.append("region", v));
    filters.level.forEach((v) => params.append("level", v));
    filters.season.forEach((v) => params.append("season", v));
    filters.domain.forEach((v) => params.append("domain", v));
    if (filters.visaOnly) params.set("visaOnly", "true");
    if (filters.hideExpired) params.set("hideExpired", "true");

    const res = await fetch(`/api/opportunities?${params.toString()}`);
    const data = await res.json();
    setOpportunities(data.opportunities ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const activeQuickFilter = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return QUICK_FILTERS.find((label) => quickFilterToQuery(label) === q) ?? null;
  }, [filters.query]);

  function applyQuickFilter(label: string) {
    const isActive = activeQuickFilter === label;
    setSearchInput(isActive ? "" : quickFilterToQuery(label));
  }

  function handleUpdated(updated: OpportunityDTO) {
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setActive(updated);
  }

  const hasFilters =
    filters.orgType.length || filters.region.length || filters.level.length || filters.season.length || filters.domain.length || filters.visaOnly;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-50">Opportunity Catalog</h1>
        <p className="mt-1 text-sm text-ink-300">
          {loading ? "Loading…" : `${opportunities.length} verified EE opportunities`} across industry, corporate, research, and academic tracks.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((label) => (
          <button
            key={label}
            onClick={() => applyQuickFilter(label)}
            className={clsx(activeQuickFilter === label ? "chip-active" : "chip", "hover:border-volt-400/50")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card mb-6 flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-9"
              placeholder='Search — try "power electronics", "cern fpga", or "digital or analog"'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={filters.visaOnly}
              onChange={(e) => setFilters((f) => ({ ...f, visaOnly: e.target.checked }))}
              className="h-4 w-4 accent-volt-400"
            />
            Visa sponsorship only
          </label>
          <label className="flex shrink-0 items-center gap-2 rounded-lg border border-ink-500 bg-ink-900 px-3 py-2 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={filters.hideExpired}
              onChange={(e) => setFilters((f) => ({ ...f, hideExpired: e.target.checked }))}
              className="h-4 w-4 accent-volt-400"
            />
            Hide closed deadlines
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-ink-400">
            <SlidersHorizontal size={13} /> Filters:
          </span>
          <MultiSelect label="Sector" options={ORG_TYPES} value={filters.orgType} onChange={(v) => setFilters((f) => ({ ...f, orgType: v }))} />
          <MultiSelect label="Region" options={REGIONS} value={filters.region} onChange={(v) => setFilters((f) => ({ ...f, region: v }))} />
          <MultiSelect
            label="Education Level"
            options={EDUCATION_LEVELS}
            value={filters.level}
            onChange={(v) => setFilters((f) => ({ ...f, level: v }))}
          />
          <MultiSelect label="Season / Cohort" options={SEASONS} value={filters.season} onChange={(v) => setFilters((f) => ({ ...f, season: v }))} />
          <MultiSelect
            label="Discipline"
            options={EE_DOMAINS.map((d) => ({ value: d, label: d }))}
            value={filters.domain}
            onChange={(v) => setFilters((f) => ({ ...f, domain: v }))}
          />
          {(hasFilters || filters.query) && (
            <button
              className="btn-ghost text-xs text-ink-400"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSearchInput("");
              }}
            >
              Reset all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse p-4" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <p className="text-ink-200">No opportunities match your filters.</p>
          <p className="text-sm text-ink-400">Try clearing filters or running a new scout dispatch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} onOpen={() => setActive(o)} />
          ))}
        </div>
      )}

      {active && <RoleDetailModal opportunity={active} onClose={() => setActive(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
