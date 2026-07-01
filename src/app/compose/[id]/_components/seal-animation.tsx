"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { paperBg, inkColor, fontFamily } from "@/lib/theme/letter";

type Stage = "fold" | "seal" | "drop";

type SealAnimationProps = {
  theme: { paper: string; ink: string; font: string };
  onComplete: () => void;
};

// Full-screen overlay that plays a fold -> seal -> drop sequence while a
// letter is being sealed. Each stage advances on a timer; the final drop
// fires `onComplete` so the caller can finish (e.g. redirect).
export function SealAnimation({ theme, onComplete }: SealAnimationProps) {
  const [stage, setStage] = useState<Stage>("fold");

  useEffect(() => {
    const toSeal = setTimeout(() => setStage("seal"), 900);
    const toDrop = setTimeout(() => setStage("drop"), 1700);
    return () => {
      clearTimeout(toSeal);
      clearTimeout(toDrop);
    };
  }, []);

  const folded = stage !== "fold";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-stone-900/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ perspective: 1200 }}
    >
      <div className="relative flex flex-col items-center">
        {/* Letter that folds, gets sealed, then drops */}
        <motion.div
          className="relative"
          animate={
            stage === "drop"
              ? { y: 320, opacity: 0, rotate: 4 }
              : { y: 0, opacity: 1, rotate: 0 }
          }
          transition={
            stage === "drop"
              ? { duration: 0.7, ease: [0.4, 0, 0.6, 1] }
              : { duration: 0.3 }
          }
          onAnimationComplete={() => {
            if (stage === "drop") onComplete();
          }}
        >
          <motion.div
            className="relative w-56 origin-top overflow-hidden rounded-md shadow-2xl"
            style={{
              backgroundColor: paperBg(theme.paper),
              color: inkColor(theme.ink),
              fontFamily: fontFamily(theme.font),
            }}
            animate={{ height: folded ? 132 : 320 }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="space-y-2 p-5 opacity-70">
              <div className="h-2 w-3/4 rounded-full bg-current opacity-30" />
              <div className="h-2 w-full rounded-full bg-current opacity-20" />
              <div className="h-2 w-5/6 rounded-full bg-current opacity-20" />
              <div className="h-2 w-2/3 rounded-full bg-current opacity-20" />
              <div className="h-2 w-full rounded-full bg-current opacity-20" />
              <div className="h-2 w-1/2 rounded-full bg-current opacity-20" />
            </div>

            {/* Fold creases that fade in once folded */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-stone-900/15"
              initial={{ opacity: 0 }}
              animate={{ opacity: folded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-stone-900/15"
              initial={{ opacity: 0 }}
              animate={{ opacity: folded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Wax seal stamps down over the fold */}
          <motion.div
            className="absolute left-1/2 top-1/2 flex h-16 w-16 items-center justify-center rounded-full text-stone-50 shadow-lg"
            style={{
              x: "-50%",
              y: "-50%",
              background:
                "radial-gradient(circle at 35% 30%, #c0392b, #7c2018 70%)",
            }}
            initial={{ scale: 0, rotate: -35, opacity: 0 }}
            animate={
              stage === "fold"
                ? { scale: 0, opacity: 0 }
                : { scale: 1, rotate: 0, opacity: 1 }
            }
            transition={{ type: "spring", stiffness: 700, damping: 18 }}
          >
            <span className="font-serif text-2xl italic">L</span>
          </motion.div>
        </motion.div>

        {/* Mailbox slot the letter drops into */}
        <div className="mt-6 h-3 w-40 rounded-full bg-stone-950/60 shadow-inner" />

        <motion.p
          className="mt-6 text-sm tracking-wide text-stone-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {stage === "drop" ? "On its way…" : "Sealing your letter…"}
        </motion.p>
      </div>
    </motion.div>
  );
}
