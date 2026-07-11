"use client";

import type { Editor } from "@tiptap/react";
import { Separator, Toolbar as AriaToolbar } from "react-aria-components";
import { ToggleButton } from "@/client/components/ui/toggle-button";

export function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <AriaToolbar
      aria-label="Text formatting"
      className="flex flex-wrap items-center gap-1 border-b border-stone-200/70 px-2 py-1.5"
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="B"
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="I"
      />
      <Separator
        orientation="vertical"
        className="mx-1 h-5 w-px bg-stone-200"
      />
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="H"
      />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="•"
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="1."
      />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="❝"
      />
    </AriaToolbar>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <ToggleButton
      isSelected={active}
      onPress={onClick}
      className={`h-8 min-w-8 rounded-md px-2 text-sm transition-colors ${
        active
          ? "bg-stone-900 text-stone-50"
          : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-900"
      }`}
    >
      {label}
    </ToggleButton>
  );
}
