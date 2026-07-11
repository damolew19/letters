import { requireSession } from "@/server/dal";
import { LetterReader } from "./_components/letter-reader";

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  return (
    <div className="mt-8">
      <LetterReader letterId={id} />
    </div>
  );
}
