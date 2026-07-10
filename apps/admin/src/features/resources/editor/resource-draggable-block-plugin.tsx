"use client"

import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createParagraphNode,
  $createTextNode,
  $getNearestNodeFromDOMNode,
} from "lexical"
import { GripVertical, PlusIcon } from "lucide-react"
import { useCallback, useRef } from "react"

const resourceDragMenuClassName = "resource-drag-menu"

export type ResourceDraggableBlockPluginProps = {
  readonly anchorElement: HTMLElement
  readonly onActiveBlockChange?: (element: HTMLElement | null) => void
}

export function ResourceDraggableBlockPlugin({
  anchorElement,
  onActiveBlockChange,
}: ResourceDraggableBlockPluginProps) {
  const [editor] = useLexicalComposerContext()
  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const activeBlockRef = useRef<HTMLElement | null>(null)
  const isOnMenu = useCallback((element: HTMLElement) => {
    return element.closest(`.${resourceDragMenuClassName}`) !== null
  }, [])
  const handleActiveBlockChange = useCallback(
    (element: HTMLElement | null) => {
      activeBlockRef.current = element
      onActiveBlockChange?.(element)
    },
    [onActiveBlockChange]
  )
  const moveActiveBlock = useCallback(
    (direction: "down" | "up") => {
      const activeBlock = activeBlockRef.current

      if (activeBlock === null) return

      editor.update(
        () => {
          const node = $getNearestNodeFromDOMNode(activeBlock)
          const sibling =
            direction === "up"
              ? node?.getPreviousSibling()
              : node?.getNextSibling()

          if (
            node === null ||
            node === undefined ||
            sibling === null ||
            sibling === undefined
          ) {
            return
          }

          if (direction === "up") sibling.insertBefore(node)
          else sibling.insertAfter(node)
        },
        { discrete: true }
      )
      editor.focus()
    },
    [editor]
  )
  const insertBlockWithSlashMenu = useCallback(() => {
    const activeBlock = activeBlockRef.current

    if (activeBlock === null) return

    editor.update(
      () => {
        const node = $getNearestNodeFromDOMNode(activeBlock)

        if (node === null) return

        const paragraph = $createParagraphNode().append($createTextNode("/"))

        node.insertAfter(paragraph)
        paragraph.selectEnd()
      },
      { discrete: true }
    )
    editor.focus()
  }, [editor])

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElement}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div
          className={`${resourceDragMenuClassName} absolute top-0 left-0 z-10 flex items-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-[transform,opacity] duration-150 focus-within:opacity-100 motion-reduce:transition-none`}
          ref={menuRef}
        >
          <button
            aria-label="새 블록 추가"
            className="flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
            onClick={insertBlockWithSlashMenu}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            type="button"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
            aria-label="블록 이동"
            className="flex size-7 cursor-grab items-center justify-center rounded-md hover:bg-muted hover:text-foreground active:cursor-grabbing"
            onKeyDown={(event) => {
              if (!event.altKey || event.ctrlKey || event.metaKey) return

              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault()
                moveActiveBlock(event.key === "ArrowUp" ? "up" : "down")
              }
            }}
            type="button"
          >
            <GripVertical aria-hidden="true" className="size-4" />
          </button>
        </div>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-0.5 bg-primary opacity-0 will-change-transform"
        />
      }
      isOnMenu={isOnMenu}
      onElementChanged={handleActiveBlockChange}
    />
  )
}
