import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "Letters <onboarding@resend.dev>";
const apiKey = process.env.RESEND_API_KEY;

const resend = apiKey ? new Resend(apiKey) : null;

// In dev, Resend's test sender can only deliver to the account owner, which
// makes multi-user testing impossible. Log the link instead so any recipient works.
const logLinksInDev = process.env.NODE_ENV !== "production";

// Dev-only store of the latest link per email, so the UI can grab it and sign in
// directly without a real inbox. Persisted on globalThis to survive HMR reloads.
const devMagicLinks: Map<string, string> = ((
  globalThis as { __devMagicLinks?: Map<string, string> }
).__devMagicLinks ??= new Map());

export function getDevMagicLink(email: string) {
  return devMagicLinks.get(email.toLowerCase());
}

export async function sendMagicLinkEmail(email: string, url: string) {
  if (!resend || logLinksInDev) {
    devMagicLinks.set(email.toLowerCase(), url);
    console.log(`\n✉️  Magic link for ${email}:\n${url}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Your sign-in link for Letters",
    text: `Click to sign in to Letters:\n\n${url}\n\nThis link expires in 5 minutes.`,
  });

  if (error) {
    console.error("Resend send failed:", error);
    throw new Error(error.message);
  }
}
