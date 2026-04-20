"use client"

import { useCallback } from "react"
import type { Editor } from "@tiptap/react"

import {
  useCreateWriting,
  useDeleteWriting,
  useSaveWriting,
} from "@/features/writings"

export function useWritingPersistence({
  editor,
  effectivePromptId,
  title,
  writingIdNumber,
  onSaved,
}: {
  editor: Editor | null
  effectivePromptId?: number
  title: string
  writingIdNumber?: number
  onSaved: () => void
}) {
  const createWriting = useCreateWriting()
  const saveWriting = useSaveWriting()
  const deleteWriting = useDeleteWriting()
  const isSaving = createWriting.isPending || saveWriting.isPending

  const save = useCallback(async (): Promise<number | undefined> => {
    const bodyJson = editor?.getJSON()
    const bodyPlainText = editor?.getText()
    const wordCount = editor?.storage.characterCount.words() ?? 0

    if (writingIdNumber) {
      await saveWriting.mutateAsync({
        writingId: writingIdNumber,
        title,
        bodyJson,
        bodyPlainText,
        wordCount,
      })
      onSaved()
      return writingIdNumber
    }

    const created = await createWriting.mutateAsync({
      title,
      bodyJson,
      bodyPlainText,
      wordCount,
      sourcePromptId: effectivePromptId,
    })
    onSaved()
    return created?.id
  }, [
    createWriting,
    editor,
    effectivePromptId,
    onSaved,
    saveWriting,
    title,
    writingIdNumber,
  ])

  const remove = useCallback(async () => {
    if (!writingIdNumber) {
      return
    }

    await deleteWriting.mutateAsync(writingIdNumber)
  }, [deleteWriting, writingIdNumber])

  return {
    isSaving,
    remove,
    save,
  }
}
