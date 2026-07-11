import { paperBg } from "@/client/lib/theme";

// Static sealed envelope shown before the recipient opens the letter.
export function SealedEnvelope({ paper }: { paper: string }) {
  const bg = paperBg(paper);
  return (
    <div className="relative h-44 w-64">
      <div
        className="absolute inset-x-0 bottom-0 h-32 rounded-md shadow-xl"
        style={{ background: `linear-gradient(160deg, ${bg}, rgba(0,0,0,0.06))` }}
      />
      <div
        className="absolute inset-x-0 top-0 h-24 origin-top"
        style={{
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          background: `linear-gradient(160deg, ${bg}, rgba(0,0,0,0.1))`,
        }}
      />
      <div
        className="absolute left-1/2 top-12 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-stone-50 shadow-lg"
        style={{
          background: "radial-gradient(circle at 35% 30%, #c0392b, #7c2018 70%)",
        }}
      >
        <span className="font-serif text-lg italic">L</span>
      </div>
    </div>
  );
}
