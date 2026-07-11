import { requireSession } from "@/server/dal";
import { Connection } from "./_components/connection";

export default async function ConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  return (
    <div className="mt-8">
      <Connection id={id} />
    </div>
  );
}
