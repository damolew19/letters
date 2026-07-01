import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { AppHeader } from "@/client/components/app-header";
import { Connection } from "./_components/connection";

export default async function ConnectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  return (
    <>
      <AppHeader name={session.user.name} email={session.user.email} />
      <div className="mt-8">
        <Connection id={id} />
      </div>
    </>
  );
}
