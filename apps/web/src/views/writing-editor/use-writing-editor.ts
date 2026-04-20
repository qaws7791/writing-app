"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useEditor } from "@tiptap/react"
import type { JSONContent } from "@tiptap/react"
import Bold from "@tiptap/extension-bold"
import CharacterCount from "@tiptap/extension-character-count"
import Document from "@tiptap/extension-document"
import History from "@tiptap/extension-history"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import Typography from "@tiptap/extension-typography"

type WritingEditorInitialData = {
  readonly title: string
  readonly bodyJson?: unknown
} | null

export function useWritingEditor(initialData: WritingEditorInitialData) {
  const [title, setTitle] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const hasPopulatedRef = useRef(false)
  const isSettingInitialContentRef = useRef(false)

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      History,
      CharacterCount.configure(),
      Placeholder.configure({
        placeholder: "글을 시작하세요.",
      }),
      Typography,
    ],
    onUpdate: ({ editor }) => {
      if (!isSettingInitialContentRef.current) {
        setIsDirty(true)
      }

      setWordCount(editor.storage.characterCount.words())
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor || !initialData || hasPopulatedRef.current) {
      return
    }

    hasPopulatedRef.current = true

    startTransition(() => {
      setTitle(initialData.title)
    })

    if (initialData.bodyJson) {
      isSettingInitialContentRef.current = true
      editor.commands.setContent(initialData.bodyJson as JSONContent)
      isSettingInitialContentRef.current = false
    }
  }, [editor, initialData])

  const handleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const element = event.target

      setTitle(element.value)
      setIsDirty(true)
      element.style.height = "auto"
      element.style.height = `${element.scrollHeight}px`
    },
    []
  )

  return {
    editor,
    handleTitleChange,
    isDirty,
    setIsDirty,
    title,
    titleRef,
    wordCount,
  }
}
