"use client"

import { useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createMarkNode, $isMarkNode, MarkNode } from "@lexical/mark"
import { registerNestedElementResolver } from "@lexical/utils"
import {
  $getNearestNodeFromDOMNode,
  $nodesOfType,
  COMMAND_PRIORITY_EDITOR,
} from "lexical"

import { Button } from "#ui/components/primitives/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "#ui/components/primitives/popover"

import { $unwrapFeedbackMark, $wrapFeedbackMark } from "../find-text-range"
import { PLAIN_TEXT_IMPORTED_COMMAND } from "../plain-text-imported-command"

export type ComposeFeedbackMark = {
  readonly example: string
  readonly id: string
  readonly quote: string
  readonly reason: string
  readonly title: string
}

export function ComposeFeedbackMarksPlugin({
  activeMarkId,
  items,
  onActiveMarkIdChange,
  onDismiss,
}: {
  readonly activeMarkId?: string | null
  readonly items: readonly ComposeFeedbackMark[]
  readonly onActiveMarkIdChange?: (id: string | null) => void
  readonly onDismiss: (id: string) => void
}) {
  const [editor] = useLexicalComposerContext()
  const [uncontrolledId, setUncontrolledId] = useState<string | null>(null)
  const appliedIdsRef = useRef(new Set<string>())
  const resolvedActiveId =
    activeMarkId === undefined ? uncontrolledId : activeMarkId
  const setActiveId = onActiveMarkIdChange ?? setUncontrolledId

  useEffect(() => {
    return registerNestedElementResolver(
      editor,
      MarkNode,
      (from: MarkNode) => $createMarkNode(from.getIDs()),
      (from: MarkNode, to: MarkNode) => {
        for (const id of from.getIDs()) {
          to.addID(id)
        }
      }
    )
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      PLAIN_TEXT_IMPORTED_COMMAND,
      () => {
        appliedIdsRef.current = new Set()
        syncFeedbackMarks(editor, items, appliedIdsRef.current)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor, items])

  useEffect(() => {
    syncFeedbackMarks(editor, items, appliedIdsRef.current)
  }, [editor, items])

  useEffect(() => {
    const stamp = () => {
      stampComposeMarkAppearance(editor, items, resolvedActiveId)
    }
    stamp()
    return editor.registerUpdateListener(stamp)
  }, [editor, items, resolvedActiveId])

  useEffect(() => {
    const attach = (root: HTMLElement | null) => {
      if (root === null) {
        return () => undefined
      }
      const handleClick = (event: MouseEvent) => {
        if (!(event.target instanceof HTMLElement)) {
          return
        }
        const markElement = event.target.closest("mark")
        if (markElement === null) {
          return
        }
        if (isDragSelectionOutside(markElement)) {
          return
        }
        editor.read(() => {
          const node = $getNearestNodeFromDOMNode(markElement)
          if (!$isMarkNode(node)) {
            return
          }
          const ids = node.getIDs()
          const match = items.find((item) => ids.includes(item.id))
          if (match !== undefined) {
            setActiveId(match.id)
          }
        })
      }
      root.addEventListener("click", handleClick)
      return () => {
        root.removeEventListener("click", handleClick)
      }
    }
    let detach = attach(editor.getRootElement())
    const unregister = editor.registerRootListener((rootElement) => {
      detach()
      detach = attach(rootElement)
    })
    return () => {
      unregister()
      detach()
    }
  }, [editor, items, setActiveId])

  const activeItem =
    resolvedActiveId === null
      ? undefined
      : items.find((item) => item.id === resolvedActiveId)
  const anchor = readMarkElement(editor, activeItem?.id)

  useEffect(() => {
    if (anchor === null) {
      return
    }
    anchor.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [anchor, resolvedActiveId])

  return (
    <Popover
      modal={false}
      onOpenChange={(open) => {
        if (!open) {
          setActiveId(null)
        }
      }}
      open={activeItem !== undefined && anchor !== null}
    >
      <PopoverContent
        align="center"
        anchor={anchor}
        className="w-80 gap-3 p-4"
        initialFocus={false}
        side="bottom"
        sideOffset={8}
      >
        {activeItem === undefined ? null : (
          <>
            <PopoverHeader className="gap-1">
              <PopoverTitle>{activeItem.title}</PopoverTitle>
              <PopoverDescription>{activeItem.reason}</PopoverDescription>
            </PopoverHeader>
            <p className="text-xs leading-5 text-pretty">
              이렇게 고쳐 보면: {activeItem.example}
            </p>
            <Button
              className="self-start"
              onClick={() => {
                editor.update(() => {
                  $unwrapFeedbackMark(activeItem.id)
                })
                appliedIdsRef.current.delete(activeItem.id)
                setActiveId(null)
                onDismiss(activeItem.id)
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              제거
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

function syncFeedbackMarks(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  items: readonly ComposeFeedbackMark[],
  appliedIds: Set<string>
): void {
  const nextIds = new Set(items.map((item) => item.id))
  editor.update(() => {
    for (const id of [...appliedIds]) {
      if (!nextIds.has(id)) {
        $unwrapFeedbackMark(id)
        appliedIds.delete(id)
      }
    }
    for (const item of items) {
      if (appliedIds.has(item.id)) {
        continue
      }
      if ($wrapFeedbackMark(item.id, item.quote)) {
        appliedIds.add(item.id)
      }
    }
  })
}

function readMarkElement(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  id: string | undefined
): HTMLElement | null {
  if (id === undefined) {
    return null
  }
  let key: string | null = null
  editor.read(() => {
    for (const mark of $nodesOfType(MarkNode)) {
      if (mark.hasID(id)) {
        key = mark.getKey()
        break
      }
    }
  })
  if (key === null) {
    return null
  }
  return editor.getElementByKey(key)
}

function stampComposeMarkAppearance(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  items: readonly ComposeFeedbackMark[],
  activeId: string | null
): void {
  const toneById = new Map(
    items.map((item, index) => [item.id, highlightToneAt(index)])
  )
  editor.read(() => {
    for (const mark of $nodesOfType(MarkNode)) {
      const element = editor.getElementByKey(mark.getKey())
      if (element === null) {
        continue
      }
      const tone = readMarkTone(mark.getIDs(), toneById, activeId)
      if (tone === null) {
        delete element.dataset.composeMarkTone
        element.removeAttribute("data-compose-mark-active")
        continue
      }
      element.dataset.composeMarkTone = String(tone)
      element.toggleAttribute(
        "data-compose-mark-active",
        activeId !== null && mark.hasID(activeId)
      )
    }
  })
}

function readMarkTone(
  ids: readonly string[],
  toneById: Map<string, HighlightTone>,
  activeId: string | null
): HighlightTone | null {
  if (activeId !== null && ids.includes(activeId)) {
    return toneById.get(activeId) ?? null
  }
  for (const id of ids) {
    const tone = toneById.get(id)
    if (tone !== undefined) {
      return tone
    }
  }
  return null
}

const HIGHLIGHT_TONES = [1, 2, 3, 4] as const

type HighlightTone = (typeof HIGHLIGHT_TONES)[number]

function highlightToneAt(index: number): HighlightTone {
  if (index < 0) {
    return 1
  }
  return HIGHLIGHT_TONES[index % HIGHLIGHT_TONES.length] ?? 1
}

function isDragSelectionOutside(markElement: HTMLElement): boolean {
  const selection = window.getSelection()
  if (selection === null || selection.isCollapsed) {
    return false
  }
  return (
    selection.anchorNode === null ||
    selection.focusNode === null ||
    !markElement.contains(selection.anchorNode) ||
    !markElement.contains(selection.focusNode)
  )
}
