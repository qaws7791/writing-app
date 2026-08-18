"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { deleteWriting } from "@workspace/http-client/learner"
import {
  ChevronRightIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons/action-icons"
import { PlusIcon, TrashIcon } from "@workspace/ui/components/icons"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/primitives/alert-dialog"
import { Badge } from "@workspace/ui/components/primitives/badge"
import {
  Button,
  buttonVariants,
} from "@workspace/ui/components/primitives/button"
import { cardVariants } from "@workspace/ui/components/primitives/card"
import {
  Insight,
  InsightDescription,
} from "@workspace/ui/components/learning/insight"
import { cn } from "@workspace/ui/lib/utils"

import {
  formatWritingTimestamp,
  groupWritingsByTask,
} from "@/features/writing/model/writing-copy"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingSummaryDto,
} from "@/shared/http/learner-api-client"

export function WritingHomePage({
  initialWritings,
}: {
  readonly initialWritings: readonly LearnerWritingSummaryDto[]
}) {
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readNotHydrated
  )
  const [writings, setWritings] = useState(initialWritings)
  const [deleteTarget, setDeleteTarget] =
    useState<LearnerWritingSummaryDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const groups = groupWritingsByTask(writings)

  const handleDelete = async () => {
    if (deleteTarget === null) return
    setDeleting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    const result = await settleLearnerApiRequest(
      deleteWriting(deleteTarget.id, {
        expectedVersion: deleteTarget.version,
      })
    )

    if (result.status === "error") {
      setDeleting(false)
      setDeleteTarget(null)
      setErrorMessage(
        readLearnerApiErrorCode(result.error) === "WRITING_VERSION_CONFLICT"
          ? "다른 화면에서 글이 변경되었습니다. 화면을 새로 고친 뒤 다시 시도해 주세요."
          : "글을 삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요."
      )
      return
    }

    setWritings((current) =>
      current.filter((writing) => writing.id !== deleteTarget.id)
    )
    setDeleting(false)
    setDeleteTarget(null)
    setStatusMessage("글을 삭제했습니다.")
  }

  return (
    <div className="@container flex w-full max-w-2xl flex-col gap-10">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.01em] sm:text-4xl sm:leading-[1.15]">
          이어 쓸 글
        </h1>
        {writings.length > 0 ? (
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            href="/app/writing/catalog"
          >
            <PlusIcon aria-hidden="true" />
            과제 둘러보기
          </Link>
        ) : null}
      </header>

      {statusMessage === null ? null : (
        <Insight role="status">
          <InsightDescription>{statusMessage}</InsightDescription>
        </Insight>
      )}
      {errorMessage === null ? null : (
        <Insight role="alert" tone="incorrect">
          <InsightDescription>{errorMessage}</InsightDescription>
        </Insight>
      )}

      {groups.length > 0 ? (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section
              aria-labelledby={`writing-task-${group.taskId}`}
              className="flex flex-col gap-3"
              key={group.taskId}
            >
              <header className="flex flex-col gap-1.5 px-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {group.domain} · {group.typeName}
                  </p>
                  <Badge variant="outline">{group.difficulty}</Badge>
                </div>
                <h2
                  className="font-heading text-xl font-semibold tracking-[-0.01em] sm:text-2xl sm:leading-[1.2]"
                  id={`writing-task-${group.taskId}`}
                >
                  {group.title}
                </h2>
              </header>
              <ul className="flex flex-col gap-3">
                {group.pieces.map((writing) => (
                  <li key={writing.id}>
                    <WritingPaper
                      interactive={interactive}
                      onDelete={setDeleteTarget}
                      writing={writing}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <StartWritingCta />
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
        open={deleteTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === null
                ? "삭제한 글은 복구할 수 없습니다."
                : `${deleteTarget.title} 본문과 점검 기록이 함께 사라집니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <Button
              className="min-w-0 flex-1 basis-0"
              disabled={deleting}
              onClick={() => void handleDelete()}
              size="lg"
              variant="destructive"
            >
              {deleting ? "삭제 중" : "삭제하기"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StartWritingCta() {
  return (
    <Link
      className={cn(
        cardVariants({ size: "lg", variant: "muted" }),
        "gap-6 rounded-[1.75rem] px-8 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
      )}
      href="/app/writing/catalog"
    >
      <div className="flex items-center gap-2">
        <SparklesIcon
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
        <span className="text-sm font-medium text-muted-foreground">
          지금 써볼까요?
        </span>
      </div>
      <h2 className="font-heading text-2xl leading-tight font-semibold tracking-[-0.01em]">
        목적이 있는 글을
        <br />
        시작해 보세요
      </h2>
      <div className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs">
        <span>과제 둘러보기</span>
        <ChevronRightIcon aria-hidden="true" className="size-4" />
      </div>
    </Link>
  )
}

function WritingPaper({
  interactive,
  onDelete,
  writing,
}: {
  readonly interactive: boolean
  readonly onDelete: (writing: LearnerWritingSummaryDto) => void
  readonly writing: LearnerWritingSummaryDto
}) {
  const preview = writing.preview.trim()

  return (
    <article
      className={cn(
        cardVariants({ size: "default", variant: "surface" }),
        "relative gap-0 overflow-visible rounded-[1.75rem] py-0"
      )}
    >
      <Link
        className="flex flex-col gap-4 rounded-[1.75rem] px-6 py-5 pr-14 outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
        href={`/app/writing/${encodeURIComponent(writing.id)}`}
      >
        <p
          className={cn(
            "line-clamp-3 min-h-[5.25rem] text-base leading-7",
            preview.length > 0 ? "text-foreground/80" : "text-muted-foreground"
          )}
        >
          {preview.length > 0 ? preview : "아직 본문이 없습니다"}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatWritingTimestamp(writing.updatedAt)} ·{" "}
          {writing.charCount.toLocaleString("ko-KR")}자
        </p>
      </Link>
      <div className="absolute top-2.5 right-2.5">
        <Button
          aria-label={`${writing.title}, ${formatWritingTimestamp(writing.updatedAt)} 삭제`}
          className="text-muted-foreground hover:text-foreground"
          disabled={!interactive}
          onClick={() => onDelete(writing)}
          size="icon-sm"
          variant="ghost"
        >
          <TrashIcon aria-hidden="true" />
        </Button>
      </div>
    </article>
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
