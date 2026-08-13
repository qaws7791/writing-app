"use client"

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { writingDomainValues } from "@workspace/contracts/writing/writing"
import { createWriting } from "@workspace/http-client/learner"
import { Badge } from "@workspace/ui/components/primitives/badge"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/primitives/empty"
import {
  Insight,
  InsightDescription,
} from "@workspace/ui/components/learning/insight"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/primitives/sheet"
import { cn } from "@workspace/ui/lib/utils"

import {
  settleLearnerApiRequest,
  type LearnerWritingCatalogItemDto,
} from "@/shared/http/learner-api-client"

export function WritingCatalogPage({
  initialTasks,
}: {
  readonly initialTasks: readonly LearnerWritingCatalogItemDto[]
}) {
  const router = useRouter()
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readNotHydrated
  )
  const [domain, setDomain] = useState<string | null>(null)
  const [typeName, setTypeName] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const domainsWithTasks = writingDomainValues.filter((item) =>
    initialTasks.some((task) => task.domain === item)
  )
  const visibleTasks = initialTasks.filter((task) => {
    if (domain !== null && task.domain !== domain) return false
    if (typeName !== null && task.typeName !== typeName) return false
    return true
  })
  const typeNames = useMemo(() => {
    if (domain === null) return []
    return [
      ...new Set(
        initialTasks
          .filter((task) => task.domain === domain)
          .map((task) => task.typeName)
      ),
    ]
  }, [domain, initialTasks])
  const preview = initialTasks.find((task) => task.taskId === previewId) ?? null

  const handleStart = async (taskId: string) => {
    setStartingTaskId(taskId)
    setErrorMessage(null)
    const result = await settleLearnerApiRequest(createWriting({ taskId }))
    if (result.status === "error") {
      setStartingTaskId(null)
      setErrorMessage("새 글을 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.")
      return
    }
    router.push(`/app/writing/${encodeURIComponent(result.value.id)}`)
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex max-w-xl flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]">
          과제
        </h1>
        <p className="text-sm leading-6 text-pretty text-muted-foreground">
          상황과 장르를 좁혀 쓸 과제를 고릅니다.
        </p>
      </header>

      {errorMessage === null ? null : (
        <Insight role="alert" tone="incorrect">
          <InsightDescription>{errorMessage}</InsightDescription>
        </Insight>
      )}

      <div className="flex flex-col gap-3">
        <div
          aria-label="도메인"
          className="flex flex-wrap gap-2"
          role="toolbar"
        >
          <FilterChip
            onPressed={() => {
              setDomain(null)
              setTypeName(null)
            }}
            pressed={domain === null}
          >
            전체
          </FilterChip>
          {domainsWithTasks.map((item) => (
            <FilterChip
              key={item}
              onPressed={() => {
                setDomain(item)
                setTypeName(null)
              }}
              pressed={domain === item}
            >
              {item}
            </FilterChip>
          ))}
        </div>
        {typeNames.length > 0 ? (
          <div
            aria-label="유형"
            className="flex flex-wrap gap-2"
            role="toolbar"
          >
            {typeNames.map((item) => (
              <FilterChip
                key={item}
                onPressed={() =>
                  setTypeName((current) => (current === item ? null : item))
                }
                pressed={typeName === item}
              >
                {item}
              </FilterChip>
            ))}
          </div>
        ) : null}
      </div>

      {visibleTasks.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleTasks.map((task) => (
            <li key={task.taskId}>
              <button
                className="flex h-full w-full flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 text-left shadow-2xs outline-none transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40"
                onClick={() => setPreviewId(task.taskId)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {task.domain} · {task.typeName}
                  </p>
                  <Badge variant="outline">{task.difficulty}</Badge>
                </div>
                <h2 className="font-heading text-base font-semibold tracking-[-0.02em] text-balance">
                  {task.title}
                </h2>
                <p className="line-clamp-2 text-sm leading-6 text-pretty text-muted-foreground">
                  {task.situation}
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  목표 {task.goalChars.toLocaleString("ko-KR")}자 ·{" "}
                  {task.audience}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty variant="frame">
          <EmptyHeader>
            <EmptyTitle>해당하는 과제가 없습니다</EmptyTitle>
            <EmptyDescription>
              다른 도메인이나 유형을 골라 보세요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Sheet
        onOpenChange={(open) => {
          if (!open) setPreviewId(null)
        }}
        open={preview !== null}
      >
        <SheetContent className="sm:max-w-md" side="right">
          {preview ? (
            <>
              <SheetHeader>
                <p className="text-xs text-muted-foreground">
                  {preview.domain} · {preview.typeName} · {preview.difficulty}
                </p>
                <SheetTitle>{preview.title}</SheetTitle>
                <SheetDescription>{preview.situation}</SheetDescription>
              </SheetHeader>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 px-6 py-4 text-sm">
                <dt className="text-muted-foreground">독자</dt>
                <dd>{preview.audience}</dd>
                <dt className="text-muted-foreground">분량</dt>
                <dd className="tabular-nums">
                  목표 {preview.goalChars.toLocaleString("ko-KR")}자
                </dd>
                <dt className="text-muted-foreground">난이도</dt>
                <dd>{preview.difficulty}</dd>
              </dl>
              <SheetFooter>
                <Button
                  className="w-full"
                  disabled={!interactive || startingTaskId !== null}
                  onClick={() => void handleStart(preview.taskId)}
                  size="lg"
                  type="button"
                >
                  {startingTaskId === preview.taskId ? "시작 중" : "시작하기"}
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FilterChip({
  children,
  onPressed,
  pressed,
}: {
  readonly children: ReactNode
  readonly onPressed: () => void
  readonly pressed: boolean
}) {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        pressed
          ? "border-foreground/15 bg-foreground text-background"
          : "border-border/80 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
      onClick={onPressed}
      type="button"
    >
      {children}
    </button>
  )
}

function subscribeToHydration(): () => void {
  return () => undefined
}

function readHydrated(): boolean {
  return true
}

function readNotHydrated(): boolean {
  return false
}
