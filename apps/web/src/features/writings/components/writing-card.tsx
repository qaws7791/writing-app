"use client"

import { MoreVertical, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/ui/dropdown-menu"
import { Button } from "@workspace/ui/components/ui/button"

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
      onClick={() => router.push(`/writings/${writing.id}`)}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/writings/${writing.id}`)
      }
      className="flex cursor-pointer flex-col gap-4 rounded-[2.25rem] bg-muted p-8 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm leading-5 font-medium text-muted-foreground">
          {writing.date}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="더보기"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreVertical size={16} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(writing.id)
              }}
            >
              <Trash2 size={20} strokeWidth={1.5} />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h2 className="text-xl leading-snug font-semibold text-foreground">
        {writing.title}
      </h2>
      <p className="line-clamp-2 text-base leading-7 text-muted-foreground">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground" aria-hidden="true">
          ≡
        </span>
        <span className="text-xs leading-4 font-semibold tracking-[1.1px] text-muted-foreground uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </div>
  )
}
