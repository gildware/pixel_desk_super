"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function RichText({
  value,
  onChange,
  placeholder = "Start typing here...",
}: Props) {
  const editor = useRef(null);

  return (
    <JoditEditor
      ref={editor}
      value={value}
      config={{
        readonly: false,
        placeholder,
        height: 320,
        toolbarAdaptive: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        buttons: [
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "|",
          "ul",
          "ol",
          "|",
          "font",
          "fontsize",
          "brush",
          "paragraph",
          "|",
          "link",
          "image",
          "table",
          "|",
          "align",
          "undo",
          "redo",
          "|",
          "hr",
          "eraser",
          "source",
        ],
      }}
      onBlur={(newContent) => onChange(newContent)}
    />
  );
}
