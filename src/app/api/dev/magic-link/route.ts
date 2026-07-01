import { NextResponse } from "next/server";
import { getDevMagicLink } from "@/server/lib/email";

// Dev-only helper: returns the most recent magic link for an email so the UI can
// sign in directly without checking an inbox. Disabled in production.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const url = getDevMagicLink(email);
  if (!url) {
    return NextResponse.json({ url: null }, { status: 404 });
  }

  return NextResponse.json({ url });
}
