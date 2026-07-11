export function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-6 text-stone-900">
      <main className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl tracking-tight">Letters</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
