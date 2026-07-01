import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AppHeader } from "@/client/components/app-header";
import { Composer } from "./_components/composer";

export default async function ComposePage({
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
        <h1 className="mb-6 font-serif text-3xl tracking-tight">
          Write a letter
        </h1>
        <Composer draftId={id} />
      </div>
    </>
  );
}
