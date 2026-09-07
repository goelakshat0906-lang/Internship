import { ORG_TYPES, REGIONS, EDUCATION_LEVELS, SEASONS, USER_STATUSES } from "./constants";

function makeLookup(list: readonly { value: string; label: string }[]) {
  const map = new Map(list.map((i) => [i.value, i.label]));
  return (v: string) => map.get(v) ?? v;
}

export const orgTypeLabel = makeLookup(ORG_TYPES);
export const regionLabel = makeLookup(REGIONS);
export const levelLabel = makeLookup(EDUCATION_LEVELS);
export const seasonLabel = makeLookup(SEASONS);
export const statusLabel = makeLookup(USER_STATUSES);

export function formatDeadline(iso: string | null): string {
  if (!iso) return "Rolling";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
