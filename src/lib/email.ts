import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "Letters <onboarding@resend.dev>";
const apiKey = process.env.RESEND_API_KEY;

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLinkEmail(email: string, url: string) {
  // Dev fallback: no API key configured, so log the link instead of sending.
  if (!resend) {
    console.log(`\n✉️  Magic link for ${email}:\n${url}\n`);
    return;
  }

  await resend.emails.send({
    from,
    to: email,
    subject: "Your sign-in link for Letters",
    text: `Click to sign in to Letters:\n\n${url}\n\nThis link expires in 5 minutes.`,
  });
}
