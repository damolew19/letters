import { requireSession } from "@/server/dal";
import { Composer } from "./_components/composer";

export default async function ComposePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  return (
    <div className="mt-8">
      <h1 className="mb-6 font-serif text-3xl tracking-tight">
        Write a letter
      </h1>
      <Composer draftId={id} />
    </div>
  );
}
