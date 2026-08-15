"use client"

import { SparklesIcon } from "@workspace/ui/components/icons"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "@workspace/ui/components/primitives/popover"

export function WritingCheckGuidePopover({
  anchor,
  charCount,
  minChars,
  onOpenChange,
  open,
}: {
  readonly anchor: HTMLElement | null
  readonly charCount: number
  readonly minChars: number
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
}) {
  const remaining = Math.max(0, minChars - charCount)

  return (
    <Popover onOpenChange={onOpenChange} open={open && anchor !== null}>
      <PopoverContent
        align="end"
        anchor={anchor}
        aria-live="polite"
        className="w-72 p-3.5 gap-2 shadow-xl"
        side="top"
        sideOffset={8}
      >
        <PopoverHeader className="pb-0 gap-1">
          <div className="flex items-center gap-1.5 text-primary">
            <SparklesIcon className="size-3.5 shrink-0" />
            <span className="text-[11px] font-semibold tracking-tight">
              점검 조건 안내
            </span>
          </div>
          <PopoverTitle className="text-sm font-semibold tracking-tight text-foreground">
            최소 분량까지 {remaining.toLocaleString("ko-KR")}자 남았어요
          </PopoverTitle>
        </PopoverHeader>
        <p className="text-xs leading-5 text-pretty text-muted-foreground">
          최소 {minChars.toLocaleString("ko-KR")}자부터 점검을 받을 수 있어요.
          (현재 {charCount.toLocaleString("ko-KR")}자)
        </p>
      </PopoverContent>
    </Popover>
  )
}
