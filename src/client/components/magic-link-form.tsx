"use client";

import { useState } from "react";
import { Form } from "react-aria-components";
import { authClient } from "@/client/lib/auth";
import { Button } from "@/client/components/ui/button";
import { TextField } from "@/client/components/ui/text-field";

type Status = "idle" | "loading" | "sent" | "error";

export function MagicLinkForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const { error } = await authClient.signIn.magicLink({ email, callbackURL });

    if (error) {
      setStatus("error");
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    // In dev the link is logged instead of emailed, so skip the "check inbox"
    // screen and sign in directly by following the captured link.
    if (process.env.NODE_ENV !== "production") {
      const res = await fetch(
        `/api/dev/magic-link?email=${encodeURIComponent(email)}`,
      );
      if (res.ok) {
        const { url } = (await res.json()) as { url: string | null };
        if (url) {
          window.location.href = url;
          return;
        }
      }
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-2 text-sm text-stone-500">
          We sent a sign-in link to{" "}
          <span className="text-stone-900">{email}</span>. The link expires in 5
          minutes.
        </p>
        <Button variant="link" onPress={() => setStatus("idle")} className="mt-4">
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <Form
      onSubmit={onSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <TextField
        name="email"
        type="email"
        isRequired
        autoComplete="email"
        value={email}
        onChange={setEmail}
        label="Email address"
        placeholder="you@example.com"
        errorMessage={status === "error" ? error : undefined}
      />
      <Button
        type="submit"
        isDisabled={status === "loading"}
        className="mt-4 h-11 w-full"
      >
        {status === "loading" ? "Sending link…" : "Send me a sign-in link"}
      </Button>
      <p className="mt-3 text-center text-xs text-stone-400">
        No passwords. We email you a magic link.
      </p>
    </Form>
  );
}
