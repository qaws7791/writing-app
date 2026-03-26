"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Bookmark01Icon,
  BookmarkCheckIcon,
  PencilEdit02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { LevelDots } from "@/domain/prompt/ui/level-dots"
import { usePromptDetailQuery } from "@/features/prompt/hooks/use-prompt-detail-query"
import { useTogglePromptSaveMutation } from "@/features/prompt/hooks/use-toggle-prompt-save-mutation"
import { useCreateDraftFromPromptMutation } from "@/features/prompt/hooks/use-create-draft-from-prompt-mutation"

export default function PromptDetailView({ promptId }: { promptId: number }) {
  const router = useRouter()
  const { data: prompt, isPending, isError } = usePromptDetailQuery(promptId)
  const toggleSave = useTogglePromptSaveMutation()
  const createDraft = useCreateDraftFromPromptMutation()

  if (isPending) {
    return (
      <div className="min-h-svh flex-1 bg-background px-4 py-16 text-sm text-muted-foreground lg:px-16">
        글감을 불러오는 중입니다.
      </div>
    )
  }

  if (isError || !prompt) {
    return (
      <div className="min-h-svh flex-1 bg-background px-4 py-16 lg:px-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          글감을 불러오지 못했습니다. 목록으로 돌아가 다시 선택해 주세요.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex-1 bg-background px-4 pb-32 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <div className="border-b border-border/80 bg-background/95 pb-6 backdrop-blur-xl lg:-mx-16 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <nav className="sticky top-0 z-40 flex items-center justify-between bg-background py-2">
              <Link
                href="/prompts"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                글감 찾기
              </Link>
            </nav>

            <header className="mt-4">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs font-medium">
                  {prompt.topic}
                </Badge>
                <LevelDots level={prompt.level} showLabel />
              </div>

              <h1 className="text-2xl leading-snug font-semibold tracking-tight text-foreground md:text-3xl">
                {prompt.text}
              </h1>

              <p className="mt-4 text-sm leading-8 text-muted-foreground md:text-base">
                {prompt.description}
              </p>
            </header>
          </div>
        </div>

        {prompt.outline.length > 0 && (
          <section className="mb-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground md:text-base">
              추천 아웃라인
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              이 구조를 참고해서 써보세요. 꼭 따르지 않아도 괜찮아요.
            </p>
            <ol className="flex flex-col gap-0">
              {prompt.outline.map((item, index) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                    {index < prompt.outline.length - 1 && (
                      <span className="mt-1 h-6 w-px bg-border" />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <span className="text-sm leading-relaxed text-foreground/80">
                      {item}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mb-10 rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.5}
              className="text-foreground"
            />
            <h2 className="text-sm font-semibold text-foreground md:text-base">
              글쓰기 팁
            </h2>
          </div>
          <ul className="flex flex-col gap-3">
            {prompt.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5">
                <span className="mt-1.5 block size-1.25 shrink-0 rounded-full bg-border" />
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 px-6 py-4 lg:px-16">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            type="button"
            onClick={() =>
              createDraft.mutate(prompt.id, {
                onSuccess: (draft) => router.push(`/write/${draft.id}`),
              })
            }
            disabled={createDraft.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:bg-primary/90 active:scale-95 disabled:opacity-60"
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
            {createDraft.isPending ? "글 생성 중…" : "이 글감으로 글 쓰기"}
          </button>
          <button
            type="button"
            onClick={() =>
              toggleSave.mutate({ promptId: prompt.id, saved: prompt.saved })
            }
            className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground ${
              prompt.saved ? "text-foreground" : "text-muted-foreground"
            }`}
            aria-label={prompt.saved ? "저장 해제" : "글감 저장"}
          >
            <HugeiconsIcon
              icon={Bookmark01Icon}
              altIcon={BookmarkCheckIcon}
              showAlt={prompt.saved}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
