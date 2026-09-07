import { USER_STATUSES } from "./constants";

const VALID_STATUSES = new Set<string>(USER_STATUSES.map((s) => s.value));

export function isValidUserStatus(v: unknown): v is string {
  return typeof v === "string" && VALID_STATUSES.has(v);
}
