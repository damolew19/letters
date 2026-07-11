"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/client/components/ui/button";
import { ToggleButton } from "@/client/components/ui/toggle-button";
import {
  PAPERS,
  INKS,
  FONTS,
  paperBg,
  inkColor,
  fontFamily,
  type PaperKey,
  type InkKey,
  type FontKey,
} from "@/client/lib/theme";
import { ACCENT, ACCENT_SELECTED_BG } from "./accent";

export function StationeryToolbar({
  paper,
  ink,
  font,
  onChange,
}: {
  paper: PaperKey;
  ink: InkKey;
  font: FontKey;
  onChange: (next: { paper?: PaperKey; ink?: InkKey; font?: FontKey }) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* Collapsed trigger: previews of the current paper, ink, and font. */}
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white p-1.5 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]">
        <Button
          variant="unstyled"
          onPress={() => setOpen((o) => !o)}
          aria-label="Stationery"
          className={`flex h-[30px] items-center gap-2 rounded-lg px-2 outline-none transition-colors ${
            open ? "" : "hover:bg-stone-100"
          }`}
          style={open ? { backgroundColor: ACCENT_SELECTED_BG } : undefined}
        >
          <span
            className="h-[18px] w-[18px] rounded-full border border-black/15"
            style={{ backgroundColor: paperBg(paper) }}
          />
          <span
            className="h-[18px] w-[18px] rounded-full border border-black/15"
            style={{ backgroundColor: inkColor(ink) }}
          />
          <span
            className="text-sm text-stone-600"
            style={{ fontFamily: fontFamily(font) }}
          >
            {FONTS[font].label[0]}
          </span>
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            className={`text-stone-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </div>

      {/* Fold-down panel with the full controls. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-auto absolute left-0 top-full mt-2 origin-top rounded-xl border border-stone-200 bg-white p-3 shadow-[0_3px_8px_rgba(15,15,15,0.12),0_1px_2px_rgba(15,15,15,0.08)]"
          >
            <ToolbarSection label="Paper">
              <SwatchGroup
                options={Object.entries(PAPERS).map(([key, v]) => ({
                  key,
                  label: v.label,
                  color: v.bg,
                }))}
                selected={paper}
                onSelect={(k) => onChange({ paper: k as PaperKey })}
              />
            </ToolbarSection>
            <ToolbarSection label="Ink">
              <SwatchGroup
                options={Object.entries(INKS).map(([key, v]) => ({
                  key,
                  label: v.label,
                  color: v.color,
                }))}
                selected={ink}
                onSelect={(k) => onChange({ ink: k as InkKey })}
              />
            </ToolbarSection>
            <ToolbarSection label="Font">
              <FontGroup selected={font} onSelect={(k) => onChange({ font: k })} />
            </ToolbarSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function SwatchGroup({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string; color: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {options.map((o) => {
        const active = selected === o.key;
        return (
          <ToggleButton
            key={o.key}
            aria-label={o.label}
            isSelected={active}
            onPress={() => onSelect(o.key)}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg outline-none transition-colors ${
              active ? "" : "hover:bg-stone-100"
            }`}
            style={active ? { backgroundColor: ACCENT_SELECTED_BG } : undefined}
          >
            <span
              className="h-[18px] w-[18px] rounded-full border border-black/15"
              style={{
                backgroundColor: o.color,
                boxShadow: active ? `0 0 0 1.5px ${ACCENT}` : undefined,
              }}
            />
          </ToggleButton>
        );
      })}
    </div>
  );
}

function FontGroup({
  selected,
  onSelect,
}: {
  selected: FontKey;
  onSelect: (key: FontKey) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Object.entries(FONTS).map(([key, v]) => {
        const active = selected === key;
        return (
          <ToggleButton
            key={key}
            aria-label={v.label}
            isSelected={active}
            onPress={() => onSelect(key as FontKey)}
            className={`h-[30px] min-w-[30px] rounded-lg px-2 text-sm outline-none transition-colors ${
              active ? "font-bold" : "text-stone-600 hover:bg-stone-100"
            }`}
            style={{
              fontFamily: v.family,
              ...(active
                ? { backgroundColor: ACCENT_SELECTED_BG, color: ACCENT }
                : undefined),
            }}
          >
            {v.label[0]}
          </ToggleButton>
        );
      })}
    </div>
  );
}
