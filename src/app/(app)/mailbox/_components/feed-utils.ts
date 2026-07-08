import type { Person } from "./feed-types";

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function time(value: string | Date | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

export function initials(source: string) {
  const cleaned = source.replace(/^(From|To)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/);
  return (((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "·");
}

export function displayName(p: { name: string | null; email: string }) {
  return p.name || p.email || "A correspondent";
}

// The state of the correspondence, shown as the person's subtitle.
export function status(p: Person): string {
  if (p.draft) return "You're writing back";
  if (p.lastDir === "out") {
    return p.lastOutOpened ? "They opened your letter" : "Your letter is on its way";
  }
  if (p.lastDir === "in") return "You read their letter";
  return "No letters yet";
}

// Dusty, muted pastels — assigned deterministically per correspondent so a
// person keeps the same tint across the mailbox.
const TINTS = [
  { bg: "#e8d5cf", fg: "#8f5a49" },
  { bg: "#d7e0c8", fg: "#5f6b47" },
  { bg: "#ecdcb5", fg: "#8a6c34" },
  { bg: "#d5d9ec", fg: "#4f567e" },
  { bg: "#e6cfe0", fg: "#7d4f74" },
];

export function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length]!;
}
