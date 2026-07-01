export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="paper-grain relative flex min-h-dvh flex-col bg-[#faf7f2] text-[#2b2621]">
      <main className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
