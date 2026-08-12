"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createWriting, deleteWriting } from "@workspace/http-client/learner"
import { TrashIcon } from "@workspace/ui/components/icons"
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
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/primitives/card"
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
import { cn } from "@workspace/ui/lib/utils"

import {
  readWritingModeOption,
  readWritingStatusLabel,
  readWritingTitle,
  writingModeOptions,
} from "@/features/focused-writing/model/writing-copy"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingSummaryDto,
} from "@/shared/http/learner-api-client"

const writingDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
})

export function WritingHomePage({
  initialWritings,
}: {
  readonly initialWritings: readonly LearnerWritingSummaryDto[]
}) {
  const router = useRouter()
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    readHydrated,
    readNotHydrated
  )
  const [writings, setWritings] = useState(initialWritings)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [creatingMode, setCreatingMode] = useState<
    LearnerWritingSummaryDto["mode"] | null
  >(null)
  const [deleteTarget, setDeleteTarget] =
    useState<LearnerWritingSummaryDto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleCreate = async (mode: LearnerWritingSummaryDto["mode"]) => {
    setCreatingMode(mode)
    setErrorMessage(null)
    setStatusMessage(null)
    const result = await settleLearnerApiRequest(createWriting({ mode }))

    if (result.status === "error") {
      setCreatingMode(null)
      setErrorMessage("새 글을 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.")
      return
    }

    router.push(`/app/writing/${encodeURIComponent(result.value.id)}`)
  }

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
      <section className="space-y-5" aria-labelledby="writing-home-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="font-heading text-3xl font-semibold tracking-[-0.03em] text-balance"
              id="writing-home-title"
            >
              쓰기
            </h1>
            <p className="text-base leading-7 text-pretty text-muted-foreground">
              생각을 글로 옮기고 세 가지 질문으로 다시 읽어 보세요.
            </p>
          </div>
          <Button
            aria-controls="writing-mode-chooser"
            aria-expanded={chooserOpen}
            disabled={!interactive || creatingMode !== null}
            onClick={() => setChooserOpen((current) => !current)}
          >
            새 글 쓰기
          </Button>
        </div>

        {chooserOpen ? (
          <div
            aria-labelledby="writing-mode-title"
            className="grid gap-3 sm:grid-cols-3"
            id="writing-mode-chooser"
            role="group"
          >
            <h2 className="sr-only" id="writing-mode-title">
              쓰기 방식 선택
            </h2>
            {writingModeOptions.map((option) => {
              const selected = creatingMode === option.mode
              return (
                <Button
                  aria-pressed={selected}
                  className="h-auto min-h-28 items-start justify-start whitespace-normal rounded-3xl px-5 py-4 text-left"
                  disabled={!interactive || creatingMode !== null}
                  key={option.mode}
                  onClick={() => void handleCreate(option.mode)}
                  variant={selected ? "default" : "outline"}
                >
                  <span className="space-y-1">
                    <span className="block font-bold">{option.label}</span>
                    <span className="block text-sm font-medium opacity-80">
                      {option.description}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>
        ) : null}
      </section>

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

      <section className="space-y-4" aria-labelledby="saved-writings-title">
        <h2
          className="font-heading text-xl font-semibold tracking-[-0.02em]"
          id="saved-writings-title"
        >
          저장한 글
        </h2>

        {writings.length === 0 ? (
          <Empty variant="frame">
            <EmptyHeader>
              <EmptyTitle>아직 저장한 글이 없습니다.</EmptyTitle>
              <EmptyDescription>
                쓰기 방식을 선택하고 첫 글을 시작해 보세요.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="grid gap-3">
            {writings.map((writing) => {
              const mode = readWritingModeOption(writing.mode)
              return (
                <li key={writing.id}>
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle className="pr-12 text-base font-semibold">
                        <h3>
                          <Link
                            className={cn(
                              buttonVariants({ variant: "link" }),
                              "h-auto justify-start whitespace-normal p-0 text-left text-foreground"
                            )}
                            href={`/app/writing/${encodeURIComponent(writing.id)}`}
                          >
                            {readWritingTitle(writing.title)}
                          </Link>
                        </h3>
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span>{mode.label}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={writing.updatedAt}>
                          {writingDateFormatter.format(
                            new Date(writing.updatedAt)
                          )}
                        </time>
                        <Badge
                          variant={
                            writing.status === "checked"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {readWritingStatusLabel(writing.status)}
                        </Badge>
                      </CardDescription>
                      <CardAction>
                        <Button
                          aria-label={`${readWritingTitle(writing.title)} 삭제`}
                          disabled={!interactive}
                          onClick={() => setDeleteTarget(writing)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <TrashIcon aria-hidden="true" />
                        </Button>
                      </CardAction>
                    </CardHeader>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
              삭제한 글은 복구할 수 없습니다.
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

function subscribeToHydration(): () => void {
  return () => undefined
}

function readHydrated(): boolean {
  return true
}

function readNotHydrated(): boolean {
  return false
}
