/** Strips ```json fences and extracts the first {...} or [...] block from model text output. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start === -1) throw new Error("No JSON found in model response");
  const candidate = raw.slice(start);
  return JSON.parse(candidate) as T;
}
