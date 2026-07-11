// Stationery theme tokens. Stored on a letter as plain string keys (paper/ink/font)
// and mapped to concrete CSS values here so the look can evolve without migrations.

export type PaperKey = "cream" | "white" | "blush" | "sky" | "sage";
export type InkKey = "sepia" | "black" | "navy" | "plum" | "forest";
export type FontKey = "serif" | "sans" | "mono" | "hand";

// The stationery a letter was written on, stored as plain string keys.
export type LetterTheme = { paper: string; ink: string; font: string };

export const PAPERS: Record<PaperKey, { label: string; bg: string }> = {
  cream: { label: "Cream", bg: "#f7f1e3" },
  white: { label: "White", bg: "#fdfdfc" },
  blush: { label: "Blush", bg: "#f7ebe9" },
  sky: { label: "Sky", bg: "#eaf1f6" },
  sage: { label: "Sage", bg: "#eef2e9" },
};

export const INKS: Record<InkKey, { label: string; color: string }> = {
  sepia: { label: "Sepia", color: "#5b4636" },
  black: { label: "Ink black", color: "#1c1917" },
  navy: { label: "Navy", color: "#26344d" },
  plum: { label: "Plum", color: "#4a2a45" },
  forest: { label: "Forest", color: "#2c3f30" },
};

export const FONTS: Record<FontKey, { label: string; family: string }> = {
  serif: { label: "Serif", family: 'Georgia, "Times New Roman", serif' },
  sans: { label: "Sans", family: 'system-ui, "Helvetica Neue", Arial, sans-serif' },
  mono: { label: "Mono", family: '"Courier New", ui-monospace, monospace' },
  hand: {
    label: "Hand",
    family: '"Segoe Script", "Bradley Hand", "Comic Sans MS", cursive',
  },
};

export function paperBg(key: string) {
  return (PAPERS[key as PaperKey] ?? PAPERS.cream).bg;
}

export function inkColor(key: string) {
  return (INKS[key as InkKey] ?? INKS.sepia).color;
}

export function fontFamily(key: string) {
  return (FONTS[key as FontKey] ?? FONTS.serif).family;
}
