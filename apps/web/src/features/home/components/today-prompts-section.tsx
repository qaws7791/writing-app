import Link from "next/link"
import { LevelDots } from "@/domain/prompt/ui/level-dots"
import type { PromptSummary } from "@/domain/prompt"

function PromptCard({ prompt }: { prompt: PromptSummary }) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/15"
    >
      <p className="text-sm leading-6 font-medium text-foreground">
        {prompt.text}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {prompt.topic}
        </span>
        <span className="text-xs text-border">·</span>
        <LevelDots level={prompt.level} showLabel />
      </div>
    </Link>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function TodayPromptsSection({
  prompts,
  isLoading,
  isError,
}: {
  prompts: PromptSummary[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section className="mb-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">오늘의 글감</h2>
        <Link
          href="/prompts"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          더 보기
        </Link>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          오늘의 글감을 불러오는 중입니다.
        </p>
      ) : isError ? (
        <EmptyState message="추천 글감을 불러오지 못했습니다. 글감 찾기에서 다른 시작점을 찾아보세요." />
      ) : prompts.length === 0 ? (
        <EmptyState message="오늘의 추천이 아직 준비되지 않았습니다. 글감 찾기에서 시작할 수 있습니다." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </section>
  )
}
