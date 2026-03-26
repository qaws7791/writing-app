import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bookmark01Icon, BookmarkCheckIcon } from "@hugeicons/core-free-icons"
import { LevelDots } from "@/domain/prompt/ui/level-dots"
import type { PromptSummary } from "@/domain/prompt"

function SavedPromptItem({ prompt }: { prompt: PromptSummary }) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group flex items-center gap-4 rounded-xl py-3.5 transition-colors hover:bg-muted/60"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-sm leading-snug font-medium text-foreground underline-offset-4 group-hover:underline md:text-base">
          {prompt.text}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {prompt.topic}
          </span>
          <span className="text-xs text-border">·</span>
          <LevelDots level={prompt.level} showLabel />
        </div>
      </div>

      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground">
        <HugeiconsIcon
          icon={Bookmark01Icon}
          altIcon={BookmarkCheckIcon}
          showAlt={prompt.saved}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
        />
      </div>
    </Link>
  )
}

export function HomeSavedPromptsTab({
  prompts,
  isLoading,
}: {
  prompts: PromptSummary[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        저장한 글감을 불러오는 중입니다.
      </p>
    )
  }

  if (prompts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        아직 저장한 글감이 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {prompts.map((prompt) => (
        <SavedPromptItem key={prompt.id} prompt={prompt} />
      ))}
    </div>
  )
}
