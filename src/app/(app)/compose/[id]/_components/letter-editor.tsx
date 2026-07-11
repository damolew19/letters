"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/react";
import { EditorToolbar } from "./editor-toolbar";

type LetterEditorProps = {
  initialContent?: JSONContent | null;
  onUpdate: (payload: { json: JSONContent; text: string }) => void;
};

export function LetterEditor({ initialContent, onUpdate }: LetterEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Dear friend…" }),
    ],
    content: initialContent ?? undefined,
    editorProps: {
      attributes: {
        class:
          "letter-prose min-h-[24rem] outline-none [&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-2xl [&_blockquote]:border-l-2 [&_blockquote]:border-current [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:opacity-80 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate({ json: editor.getJSON(), text: editor.getText() });
    },
  });

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="px-1 py-4" />
    </div>
  );
}
