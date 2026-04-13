"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalIcon, Delete01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
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
      className="bg-surface-container hover:bg-surface-container-high flex cursor-pointer flex-col gap-4 rounded-[2.25rem] p-8 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-label-large text-on-surface-low">
          {writing.date}
        </span>
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="ghost"
              aria-label="더보기"
              onPress={(e) => e.continuePropagation()}
            >
              <HugeiconsIcon
                icon={MoreVerticalIcon}
                size={16}
                color="currentColor"
                strokeWidth={2}
              />
            </Button>
          </DropdownTrigger>
          <DropdownPopover
            placement="bottom end"
            className="bg-surface-container-low min-w-32.5 rounded-2xl px-0 py-1 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
          >
            <DropdownMenu>
              <DropdownItem
                className="text-label-large text-on-surface-low gap-3 px-3 py-3"
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
      <h2 className="text-headline-small-em text-on-surface">
        {writing.title}
      </h2>
      <p className="text-body-large text-on-surface-low line-clamp-2">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-on-surface-low" aria-hidden="true">
          ≡
        </span>
        <span className="text-label-small-em text-on-surface-low tracking-[1.1px] uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </div>
  )
}
