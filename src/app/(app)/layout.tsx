import { AppHeader } from "@/client/components/app-header";
import { requireSession } from "@/server/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched here for display only (the nav shows the account menu). Each page
  // still calls requireSession() as its own gate, since layouts don't re-render
  // on client-side navigation and can't be relied on for auth.
  const session = await requireSession();

  return (
    <div className="paper-grain relative flex min-h-dvh flex-col bg-[#faf7f2] text-[#2b2621]">
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-8">
        <AppHeader name={session.user.name} email={session.user.email} />
        {children}
      </main>
    </div>
  );
}
