import { type Editor } from "@tiptap/react"
import { useEffect, useRef, useState } from "react"

import {
  type AIFeatureType,
  type AISuggestion,
  getAISuggestions,
} from "@/features/ai-assistant/repositories/mock-ai"

type ToolbarExpandedMode = "layer1-features" | "layer2-options" | null

type EditorSnapshot = {
  hasSelection: boolean
  selectedText: string
  selectionFrom: number
  selectionTo: number
}

type UseAISuggestionOptions = {
  editor: Editor | null
  snapshot: EditorSnapshot
}

function scrollEditorSelectionIntoView(
  editor: Editor,
  selection?: { from: number; to: number }
) {
  if (selection && (selection.from !== 0 || selection.to !== 0)) {
    editor.chain().setTextSelection(selection).scrollIntoView().run()
    return
  }

  editor.commands.scrollIntoView()
}

export function useAISuggestion({ editor, snapshot }: UseAISuggestionOptions) {
  const [toolbarExpanded, setToolbarExpanded] =
    useState<ToolbarExpandedMode>(null)
  const [isSuggestionMode, setIsSuggestionMode] = useState(false)
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])

  const savedSelectionRef = useRef({ text: "", from: 0, to: 0 })
  const previousSuggestionModeRef = useRef(isSuggestionMode)

  // 분할 뷰 data attribute 관리
  useEffect(() => {
    if (isSuggestionMode) {
      document.documentElement.setAttribute("data-ai-split", "")
    } else {
      document.documentElement.removeAttribute("data-ai-split")
    }
    return () => {
      document.documentElement.removeAttribute("data-ai-split")
    }
  }, [isSuggestionMode])

  useEffect(() => {
    if (!editor) return
    if (previousSuggestionModeRef.current === isSuggestionMode) return

    previousSuggestionModeRef.current = isSuggestionMode

    let nestedFrame = 0
    const frame = window.requestAnimationFrame(() => {
      nestedFrame = window.requestAnimationFrame(() => {
        if (isSuggestionMode) {
          scrollEditorSelectionIntoView(editor, savedSelectionRef.current)
          return
        }

        scrollEditorSelectionIntoView(editor, {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        })
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(nestedFrame)
    }
  }, [editor, isSuggestionMode])

  const handleAIClick = () => {
    if (!editor) return

    savedSelectionRef.current = {
      text: snapshot.selectedText,
      from: snapshot.selectionFrom,
      to: snapshot.selectionTo,
    }
    setSelectedText(snapshot.selectedText)

    if (toolbarExpanded) {
      setToolbarExpanded(null)
      return
    }

    if (snapshot.hasSelection) {
      setToolbarExpanded("layer1-features")
    } else {
      setToolbarExpanded("layer2-options")
    }
    setSuggestions([])
  }

  const handleCollapseToolbar = () => {
    setToolbarExpanded(null)
  }

  const handleSelectFeature = async (type: AIFeatureType) => {
    if (!editor) return

    setToolbarExpanded(null)
    setIsSuggestionMode(true)
    setIsSuggestionLoading(true)
    setSuggestions([])

    try {
      const result = await getAISuggestions(
        savedSelectionRef.current.text,
        type
      )
      setSuggestions(result)
    } catch {
      setIsSuggestionMode(false)
    } finally {
      setIsSuggestionLoading(false)
    }
  }

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    if (!editor) return

    const { from, to } = savedSelectionRef.current
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, suggestion.suggestion)
      .run()

    setIsSuggestionMode(false)
    setSelectedText("")
    setSuggestions([])
  }

  const handleCloseSuggestionPanel = () => {
    setIsSuggestionMode(false)
    setSelectedText("")
    setSuggestions([])
  }

  const clearSelectedText = () => {
    setSelectedText("")
  }

  return {
    toolbarExpanded,
    isSuggestionMode,
    isSuggestionLoading,
    selectedText,
    suggestions,
    handleAIClick,
    handleCollapseToolbar,
    handleSelectFeature,
    handleAcceptSuggestion,
    handleCloseSuggestionPanel,
    clearSelectedText,
  }
}
