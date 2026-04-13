"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalIcon, Delete01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import {
  Dropdown,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
} from "@workspace/ui/components/dropdown"

export interface WritingCardData {
  id: number
  date: string
  title: string
  excerpt: string
  wordCount: number
}

export function WritingCard({
  writing,
  onDelete,
}: {
  writing: WritingCardData
  onDelete: (id: number) => void
}) {
  const router = useRouter()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/writings/${writing.id}/edit`)}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/writings/${writing.id}/edit`)
      }
      className="flex cursor-pointer flex-col gap-4 rounded-[2.25rem] bg-surface-secondary p-8 text-left transition-colors hover:bg-surface-tertiary"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm leading-5 font-medium text-muted">
          {writing.date}
        </span>
        <Dropdown>
          <DropdownTrigger
            aria-label="더보기"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-tertiary"
            onPress={(e) => e.continuePropagation()}
          >
            <HugeiconsIcon
              icon={MoreVerticalIcon}
              size={16}
              color="currentColor"
              strokeWidth={2}
            />
          </DropdownTrigger>
          <DropdownPopover
            placement="bottom end"
            className="min-w-32.5 rounded-2xl bg-overlay px-0 py-1 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
          >
            <DropdownMenu>
              <DropdownItem
                className="gap-3 px-3 py-3 text-sm leading-5 font-medium text-muted"
                onAction={() => onDelete(writing.id)}
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                삭제
              </DropdownItem>
            </DropdownMenu>
          </DropdownPopover>
        </Dropdown>
      </div>
      <h2 className="text-xl leading-snug font-semibold text-foreground">
        {writing.title}
      </h2>
      <p className="line-clamp-2 text-base leading-7 text-muted">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted" aria-hidden="true">
          ≡
        </span>
        <span className="text-xs leading-4 font-semibold tracking-[1.1px] text-muted uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </div>
  )
}
