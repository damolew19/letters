import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { LetterReader } from "./_components/letter-reader";

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50 text-stone-900">
      <header className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
        <span className="font-serif text-xl">Letters</span>
        <Link
          href="/mailbox"
          className="text-sm text-stone-500 underline underline-offset-4 hover:text-stone-900"
        >
          Back to mailbox
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <LetterReader letterId={id} />
      </main>
    </div>
  );
}
