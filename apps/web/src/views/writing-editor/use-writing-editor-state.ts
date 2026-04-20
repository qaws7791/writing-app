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
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@workspace/ui/components/ui/sonner"

import { appendReturnTo, navigateBack } from "@/foundation/navigation"
import { usePromptDetail } from "@/features/prompts/hooks/use-prompt-detail"
import {
  useCreateWriting,
  useDeleteWriting,
  useSaveWriting,
  useWritingDetail,
} from "@/features/writings"

function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date)
}

export function useWritingEditorState({
  promptId,
  writingId,
}: {
  promptId?: number
  writingId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState("")
  const [today] = useState(() => new Date())
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [promptCollapsed, setPromptCollapsed] = useState(false)
  const [showPromptSheet, setShowPromptSheet] = useState(false)
  const [sheetPromptId, setSheetPromptId] = useState<number | undefined>(
    undefined
  )
  const [wordCount, setWordCount] = useState(0)
  const hasPopulatedRef = useRef(false)
  const isSettingInitialContentRef = useRef(false)

  const writingIdNumber = writingId ? Number(writingId) : undefined
  const effectivePromptId = sheetPromptId ?? promptId
  const fallbackPath = writingIdNumber ? "/writings" : "/writings/new"
  const returnTo = searchParams.get("returnTo")

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

  const promptQuery = usePromptDetail(effectivePromptId)
  const writingQuery = useWritingDetail(writingIdNumber)
  const createWriting = useCreateWriting()
  const saveWriting = useSaveWriting()
  const deleteWriting = useDeleteWriting()
  const isSaving = createWriting.isPending || saveWriting.isPending

  const isPromptEnabled = effectivePromptId != null
  const prompt =
    isPromptEnabled && promptQuery.data != null ? promptQuery.data : null
  const isPromptLoading = isPromptEnabled && promptQuery.isLoading

  useEffect(() => {
    if (!editor || !writingQuery.data || hasPopulatedRef.current) return
    hasPopulatedRef.current = true
    const { title: loadedTitle, bodyJson } = writingQuery.data
    startTransition(() => {
      setTitle(loadedTitle)
    })
    if (bodyJson) {
      isSettingInitialContentRef.current = true
      editor.commands.setContent(bodyJson as JSONContent)
      isSettingInitialContentRef.current = false
    }
  }, [editor, writingQuery.data])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  const performSave = useCallback(async (): Promise<number | undefined> => {
    const bodyJson = editor?.getJSON()
    const bodyPlainText = editor?.getText()
    const words = editor?.storage.characterCount.words() ?? 0

    if (writingIdNumber) {
      await saveWriting.mutateAsync({
        writingId: writingIdNumber,
        title,
        bodyJson,
        bodyPlainText,
        wordCount: words,
      })
      setIsDirty(false)
      return writingIdNumber
    }

    const created = await createWriting.mutateAsync({
      title,
      bodyJson,
      bodyPlainText,
      wordCount: words,
      sourcePromptId: effectivePromptId,
    })
    setIsDirty(false)
    return created?.id
  }, [
    createWriting,
    editor,
    effectivePromptId,
    saveWriting,
    title,
    writingIdNumber,
  ])

  const navigateAfterSave = useCallback(
    (savedId: number | undefined) => {
      if (savedId != null) {
        router.push(appendReturnTo(`/writings/${savedId}`, returnTo ?? ""))
        return
      }

      navigateBack(router, {
        returnTo,
        fallbackPath,
      })
    },
    [fallbackPath, returnTo, router]
  )

  const handleSave = useCallback(async () => {
    navigateAfterSave(await performSave())
  }, [navigateAfterSave, performSave])

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowLeaveDialog(true)
      return
    }

    navigateBack(router, {
      returnTo,
      fallbackPath,
    })
  }, [fallbackPath, isDirty, returnTo, router])

  const handleLeaveWithoutSave = useCallback(() => {
    setShowLeaveDialog(false)
    setIsDirty(false)
    navigateBack(router, {
      returnTo,
      fallbackPath,
    })
  }, [fallbackPath, returnTo, router])

  const handleSaveAndLeave = useCallback(async () => {
    setShowLeaveDialog(false)
    try {
      navigateAfterSave(await performSave())
    } catch {
      setShowLeaveDialog(true)
      toast.error("저장에 실패했습니다.")
    }
  }, [navigateAfterSave, performSave])

  const handleDelete = useCallback(async () => {
    if (!writingIdNumber) return
    await deleteWriting.mutateAsync(writingIdNumber)
    router.replace("/writings")
  }, [deleteWriting, router, writingIdNumber])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target
      setTitle(el.value)
      setIsDirty(true)
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    },
    []
  )

  const handleSelectPrompt = useCallback((selectedPromptId: number) => {
    setSheetPromptId(selectedPromptId)
    setShowPromptSheet(false)
  }, [])

  return {
    dateLabel: formatKoreanDate(today),
    editor,
    handleBack,
    handleDelete,
    handleLeaveWithoutSave,
    handleSave,
    handleSaveAndLeave,
    handleSelectPrompt,
    handleTitleChange,
    isPromptLoading,
    isSaving,
    prompt,
    promptCollapsed,
    setPromptCollapsed,
    setShowLeaveDialog,
    setShowPromptSheet,
    showLeaveDialog,
    showPromptSheet,
    title,
    titleRef,
    wordCount,
    writingIdNumber,
  }
}
