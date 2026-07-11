import Link from "next/link";

export function LetterNotFound() {
  return (
    <div className="py-20 text-center text-stone-500">
      <p>This letter isn&apos;t here, or isn&apos;t addressed to you.</p>
      <Link
        href="/mailbox"
        className="mt-3 inline-block text-sm text-stone-700 underline underline-offset-4 hover:text-stone-900"
      >
        Back to mailbox
      </Link>
    </div>
  );
}
