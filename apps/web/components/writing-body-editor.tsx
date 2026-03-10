"use client"

import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import { EditorContent, useEditor } from "@tiptap/react"

import styles from "./writing-body-editor.module.css"

type WritingBodyEditorProps = {
  placeholder?: string
}

export default function WritingBodyEditor({
  placeholder = "생각이 흐르는 대로 자유롭게 적어보세요...",
}: WritingBodyEditorProps) {
  const resolvedPlaceholder =
    placeholder ?? "생각이 흐르는 대로 자유롭게 적어보세요..."
  const editorClassName = styles.editor ?? ""
  const editorShellClassName = styles.editorShell ?? ""

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        placeholder: resolvedPlaceholder,
        showOnlyCurrent: false,
      }),
    ],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: editorClassName,
      },
    },
  })

  if (!editor) {
    return <div className={editorShellClassName} />
  }

  return <EditorContent editor={editor} className={editorShellClassName} />
}
