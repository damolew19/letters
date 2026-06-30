import { randomBytes } from "crypto";

export function generateInviteToken() {
  return randomBytes(16).toString("base64url");
}

export function inviteUrl(token: string) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}

// Canonical ordering so a friendship pair is unique regardless of direction.
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
