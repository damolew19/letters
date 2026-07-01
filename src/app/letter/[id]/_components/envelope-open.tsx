"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { paperBg } from "@/lib/theme/letter";

type Stage = "crack" | "open" | "rise";

type EnvelopeOpenProps = {
  theme: { paper: string; ink: string; font: string };
  onComplete: () => void;
};

// Full-screen overlay that plays a crack-seal -> open-flap -> rise sequence
// when a recipient opens a letter. The final rise fires `onComplete` so the
// caller can reveal the letter body.
export function EnvelopeOpen({ theme, onComplete }: EnvelopeOpenProps) {
  const [stage, setStage] = useState<Stage>("crack");
  const paper = paperBg(theme.paper);

  useEffect(() => {
    const toOpen = setTimeout(() => setStage("open"), 700);
    const toRise = setTimeout(() => setStage("rise"), 1500);
    return () => {
      clearTimeout(toOpen);
      clearTimeout(toRise);
    };
  }, []);

  const opened = stage !== "crack";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-stone-900/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ perspective: 1200 }}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative h-44 w-64" style={{ perspective: 1000 }}>
          {/* Folded letter that rises out of the envelope */}
          <motion.div
            className="absolute inset-x-6 top-4 h-32 rounded-sm shadow-md"
            style={{ backgroundColor: paper }}
            initial={{ y: 0, opacity: 1 }}
            animate={
              stage === "rise"
                ? { y: -150, opacity: 0 }
                : { y: opened ? -10 : 0, opacity: 1 }
            }
            transition={{ duration: 0.7, ease: [0.4, 0, 0.6, 1] }}
            onAnimationComplete={() => {
              if (stage === "rise") onComplete();
            }}
          >
            <div className="space-y-2 p-4 opacity-60">
              <div className="h-1.5 w-3/4 rounded-full bg-stone-900/30" />
              <div className="h-1.5 w-full rounded-full bg-stone-900/20" />
              <div className="h-1.5 w-5/6 rounded-full bg-stone-900/20" />
              <div className="h-1.5 w-2/3 rounded-full bg-stone-900/20" />
            </div>
          </motion.div>

          {/* Envelope body */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 rounded-md shadow-2xl"
            style={{
              background: `linear-gradient(160deg, ${paper}, rgba(0,0,0,0.06))`,
            }}
          />
          {/* Inner pocket edge so the letter reads as tucked inside */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 rounded-md"
            style={{
              clipPath: "polygon(0 35%, 50% 100%, 100% 35%, 100% 100%, 0 100%)",
              background: "rgba(0,0,0,0.08)",
            }}
          />

          {/* Top flap that swings open around its top edge */}
          <motion.div
            className="absolute inset-x-0 top-0 h-24 origin-top"
            style={{
              transformStyle: "preserve-3d",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: `linear-gradient(160deg, ${paper}, rgba(0,0,0,0.1))`,
              zIndex: stage === "crack" ? 20 : 0,
            }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: opened ? -170 : 0 }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Wax seal: sits on the flap, then cracks and drops away */}
          <motion.div
            className="absolute left-1/2 top-12 z-30 flex h-12 w-12 items-center justify-center rounded-full text-stone-50 shadow-lg"
            style={{
              x: "-50%",
              y: "-50%",
              background:
                "radial-gradient(circle at 35% 30%, #c0392b, #7c2018 70%)",
            }}
            initial={{ scale: 1, rotate: 0, opacity: 1 }}
            animate={
              stage === "crack"
                ? { scale: 1, opacity: 1 }
                : { scale: 0.6, rotate: 40, y: 60, opacity: 0 }
            }
            transition={{ duration: 0.4, ease: "easeIn" }}
          >
            <span className="font-serif text-lg italic">L</span>
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-sm tracking-wide text-stone-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {stage === "crack" ? "Breaking the seal…" : "Unfolding…"}
        </motion.p>
      </div>
    </motion.div>
  );
}
