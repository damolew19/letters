import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AppHeader } from "@/client/components/app-header";
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
    <>
      <AppHeader name={session.user.name} email={session.user.email} />
      <div className="mt-8">
        <LetterReader letterId={id} />
      </div>
    </>
  );
}
