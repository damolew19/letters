import type { Person } from "./feed-types";
import { EmptyNote } from "./feed-primitives";
import { WaitingCard } from "./waiting-card";

// Unread sealed letters, one card per sender.
export function WaitingSection({ people }: { people: Person[] }) {
  return (
    <section className="relative">
      {people.length > 0 && <WaitingGlow />}

      <h2 className="mb-4 font-serif text-2xl tracking-tight text-[#2b2621]">
        Waiting for you
      </h2>

      {people.length === 0 ? (
        <EmptyNote>Nothing new — your mailbox is quiet.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((p) => (
            <WaitingCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function WaitingGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-8 -top-12 bottom-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-0 top-0 h-44 w-44 rounded-full bg-[#f0c9b8] opacity-50 blur-3xl" />
      <div className="absolute right-2 top-6 h-52 w-52 rounded-full bg-[#cbd9c0] opacity-45 blur-3xl" />
      <div className="absolute left-32 bottom-0 h-44 w-44 rounded-full bg-[#d9cbe6] opacity-40 blur-3xl" />
    </div>
  );
}
