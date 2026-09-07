import type { OpportunityDTO } from "./types";

function searchableText(o: OpportunityDTO): string {
  return [
    o.title,
    o.organization,
    o.domain,
    o.location,
    o.description,
    o.techStack.join(" "),
    o.qualifications.join(" "),
    o.responsibilities.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Lightweight fuzzy/boolean query matcher supporting:
 *  - multi-token AND ("power electronics" -> both "power" and "electronics")
 *  - OR groups via the word "or" ("digital or analog")
 *  - mixed ("cern fpga" -> AND; "power electronics or vlsi" -> OR of two AND groups)
 */
export function matchesQuery(o: OpportunityDTO, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const text = searchableText(o);
  const orGroups = q.split(/\s+or\s+/).map((g) => g.trim()).filter(Boolean);

  return orGroups.some((group) => {
    const tokens = group.split(/\s+/).filter(Boolean);
    return tokens.every((t) => text.includes(t));
  });
}

/** Converts a quick-filter label like "Power Electronics Internship" into a search query. */
export function quickFilterToQuery(label: string): string {
  return label
    .replace(/\s*(internships?|interns?)\s*$/i, "")
    .trim()
    .toLowerCase();
}
