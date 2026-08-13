"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { deleteWriting } from "@workspace/http-client/learner"
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
import { Card } from "@workspace/ui/components/primitives/card"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/primitives/tabs"
import { cn } from "@workspace/ui/lib/utils"

import { formatWritingStartedAt } from "@/features/writing/model/writing-copy"
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

  const drafts = writings.filter((writing) => writing.status === "drafting")
  const completed = writings.filter((writing) => writing.status === "complete")

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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-xl flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]">
            쓰기
          </h1>
          <p className="text-sm leading-6 text-pretty text-muted-foreground">
            작성 중인 글을 이어 쓰거나, 과제를 골라 새 글을 시작합니다.
          </p>
        </div>
        <Link className={buttonVariants()} href="/app/writing/catalog">
          <PlusIcon aria-hidden="true" />
          과제 둘러보기
        </Link>
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

      <Tabs defaultValue="drafting">
        <TabsList>
          <TabsTrigger value="drafting">작성 중 {drafts.length}</TabsTrigger>
          <TabsTrigger value="complete">완료 {completed.length}</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4 flex flex-col gap-3" value="drafting">
          {drafts.length > 0 ? (
            drafts.map((writing) => (
              <WritingPieceCard
                interactive={interactive}
                key={writing.id}
                onDelete={setDeleteTarget}
                writing={writing}
              />
            ))
          ) : (
            <Empty variant="frame">
              <EmptyHeader>
                <EmptyTitle>작성 중인 글이 없습니다</EmptyTitle>
                <EmptyDescription>
                  과제를 고르면 목적이 정해진 글을 시작할 수 있습니다.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
        <TabsContent className="mt-4 flex flex-col gap-3" value="complete">
          {completed.length > 0 ? (
            completed.map((writing) => (
              <WritingPieceCard
                interactive={interactive}
                key={writing.id}
                onDelete={setDeleteTarget}
                writing={writing}
              />
            ))
          ) : (
            <Card
              className="rounded-[1.75rem] px-(--card-spacing) py-8 text-sm text-muted-foreground"
              size="sm"
              variant="muted"
            >
              마친 글이 없습니다.
            </Card>
          )}
        </TabsContent>
      </Tabs>

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

function WritingPieceCard({
  interactive,
  onDelete,
  writing,
}: {
  readonly interactive: boolean
  readonly onDelete: (writing: LearnerWritingSummaryDto) => void
  readonly writing: LearnerWritingSummaryDto
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      <Link
        className={cn(
          buttonVariants({ variant: "link" }),
          "h-auto min-w-0 flex-1 items-start justify-start whitespace-normal p-0 text-left text-foreground"
        )}
        href={`/app/writing/${encodeURIComponent(writing.id)}`}
      >
        <span className="block w-full">
          <span className="block text-xs text-muted-foreground">
            {writing.domain} · {writing.typeName}
          </span>
          <span className="mt-1 block font-heading text-base font-semibold tracking-[-0.02em] text-balance">
            {writing.title}
          </span>
          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
            {formatWritingStartedAt(writing.createdAt)} ·{" "}
            {writing.charCount.toLocaleString("ko-KR")}자
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline">{writing.difficulty}</Badge>
        <Button
          aria-label={`${writing.title} 삭제`}
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
