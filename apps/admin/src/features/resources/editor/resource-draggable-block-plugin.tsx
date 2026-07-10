"use client"

import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin"
import { GripVertical } from "lucide-react"
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
  const menuRef = useRef<HTMLButtonElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)
  const isOnMenu = useCallback((element: HTMLElement) => {
    return element.closest(`.${resourceDragMenuClassName}`) !== null
  }, [])

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElement}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <button
          ref={menuRef}
          type="button"
          aria-label="블록 이동"
          className={`${resourceDragMenuClassName} absolute top-0 left-0 z-10 flex size-7 cursor-grab items-center justify-center rounded-md border-0 bg-transparent text-muted-foreground opacity-0 transition-[transform,opacity,background-color] duration-150 hover:bg-muted hover:text-foreground active:cursor-grabbing`}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-0.5 bg-primary opacity-0 will-change-transform"
        />
      }
      isOnMenu={isOnMenu}
      onElementChanged={onActiveBlockChange}
    />
  )
}
