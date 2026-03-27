import { type Editor } from "@tiptap/react"
import { useCallback, useEffect, useState } from "react"

import {
  type ReviewItem,
  getDocumentReview,
  getFlowReview,
} from "@/features/ai-assistant/repositories/api-ai"
import {
  clearReviewItems,
  getReviewItems,
  removeReviewItem,
  setReviewItems,
} from "@/features/ai-assistant/components/ai-review-extension"

function getParagraphs(
  editor: Editor
): { from: number; to: number; text: string }[] {
  const paragraphs: { from: number; to: number; text: string }[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "paragraph" && node.textContent.trim().length > 0) {
      paragraphs.push({
        from: pos + 1,
        to: pos + node.nodeSize - 1,
        text: node.textContent,
      })
    }
  })
  return paragraphs
}

type UseAIReviewOptions = {
  editor: Editor | null
  onClearSelectedText: () => void
}

export function useAIReview({
  editor,
  onClearSelectedText,
}: UseAIReviewOptions) {
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [activeReviewItem, setActiveReviewItem] = useState<ReviewItem | null>(
    null
  )

  // 리뷰 모드에서 하이라이트 클릭 감지
  useEffect(() => {
    if (!editor || !isReviewMode) return

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement
      const reviewEl = target.closest("[data-review-id]") as HTMLElement | null
      if (reviewEl) {
        const id = reviewEl.getAttribute("data-review-id")
        const items = getReviewItems(editor)
        const item = items.find((i) => i.id === id)
        if (item) {
          setActiveReviewItem(item)
        }
      }
    }

    editor.view.dom.addEventListener("click", handleClick)
    return () => {
      editor.view.dom.removeEventListener("click", handleClick)
    }
  }, [editor, isReviewMode])

  const handleSelectLayer2Option = useCallback(
    async (id: "spelling-review" | "flow-review") => {
      if (!editor) return

      try {
        const paragraphs = getParagraphs(editor)
        const items =
          id === "spelling-review"
            ? await getDocumentReview(paragraphs)
            : await getFlowReview(paragraphs)

        setReviewItems(editor, items)
        setIsReviewMode(true)
        onClearSelectedText()
      } catch {
        /* noop */
      }
    },
    [editor, onClearSelectedText]
  )

  const handleEndReview = useCallback(() => {
    if (!editor) return
    clearReviewItems(editor)
    setIsReviewMode(false)
    setActiveReviewItem(null)
  }, [editor])

  const handleAcceptReviewItem = useCallback(() => {
    if (!editor || !activeReviewItem) return

    if (activeReviewItem.suggestion && activeReviewItem.type !== "flow") {
      editor
        .chain()
        .focus()
        .deleteRange({
          from: activeReviewItem.from,
          to: activeReviewItem.to,
        })
        .insertContentAt(activeReviewItem.from, activeReviewItem.suggestion)
        .run()
    }

    removeReviewItem(editor, activeReviewItem.id)
    setActiveReviewItem(null)

    const remaining = getReviewItems(editor)
    if (remaining.length === 0) {
      setIsReviewMode(false)
    }
  }, [editor, activeReviewItem])

  const handleRejectReviewItem = useCallback(() => {
    if (!editor || !activeReviewItem) return
    removeReviewItem(editor, activeReviewItem.id)
    setActiveReviewItem(null)

    const remaining = getReviewItems(editor)
    if (remaining.length === 0) {
      setIsReviewMode(false)
    }
  }, [editor, activeReviewItem])

  const handleDismissReviewCard = useCallback(() => {
    setActiveReviewItem(null)
  }, [])

  const reviewItems = editor ? getReviewItems(editor) : []
  const activeReviewIndex = activeReviewItem
    ? reviewItems.findIndex((i) => i.id === activeReviewItem.id)
    : -1

  return {
    isReviewMode,
    activeReviewItem,
    reviewItems,
    activeReviewIndex,
    handleSelectLayer2Option,
    handleEndReview,
    handleAcceptReviewItem,
    handleRejectReviewItem,
    handleDismissReviewCard,
  }
}
