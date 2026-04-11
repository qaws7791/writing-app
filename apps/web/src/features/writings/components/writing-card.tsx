"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalIcon, Delete01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@workspace/ui/components/menu"

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
      className="flex cursor-pointer flex-col gap-4 rounded-[2.25rem] bg-surface-container p-8 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="flex items-center justify-between">
        <span className="text-label-large text-on-surface-low">
          {writing.date}
        </span>
        <Menu>
          <MenuTrigger>
            <button
              type="button"
              aria-label="더보기"
              className="flex h-10 w-10 items-center justify-center text-on-surface-low"
              onClick={(e) => e.stopPropagation()}
            >
              <HugeiconsIcon
                icon={MoreVerticalIcon}
                size={16}
                color="currentColor"
                strokeWidth={2}
              />
            </button>
          </MenuTrigger>
          <MenuContent
            side="bottom"
            align="end"
            className="min-w-32.5 rounded-2xl bg-surface-container-low px-0 py-1 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
          >
            <MenuItem
              className="gap-3 px-3 py-3 text-label-large text-on-surface-low"
              onClick={() => onDelete(writing.id)}
              leadingIcon={
                <HugeiconsIcon
                  icon={Delete01Icon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                />
              }
            >
              삭제
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <h2 className="text-headline-small-em text-on-surface">
        {writing.title}
      </h2>
      <p className="line-clamp-2 text-body-large text-on-surface-low">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-on-surface-low" aria-hidden="true">
          ≡
        </span>
        <span className="text-label-small-em tracking-[1.1px] text-on-surface-low uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </div>
  )
}
