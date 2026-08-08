"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { startWritingSelfCheck } from "@workspace/http-client/learner"
import { ChevronLeftIcon } from "@workspace/ui/components/icons"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"

import { useWritingAutosave } from "@/features/focused-writing/hooks/use-writing-autosave"
import { readWritingModeOption } from "@/features/focused-writing/model/writing-copy"
import { WritingFocusShell } from "@/features/focused-writing/ui/writing-focus-shell"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

export function WritingEditor({
  initialWriting,
}: {
  readonly initialWriting: LearnerWritingDetailDto
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialWriting.title)
  const [body, setBody] = useState(initialWriting.body)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [startingSelfCheck, setStartingSelfCheck] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const mode = readWritingModeOption(initialWriting.mode)

  const handleServerWritingApplied = useCallback(
    (writing: LearnerWritingDetailDto) => {
      setTitle(writing.title)
      setBody(writing.body)
      setActionError(null)
    },
    []
  )
  const autosave = useWritingAutosave({
    initialWriting,
    onServerWritingApplied: handleServerWritingApplied,
  })

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle)
    autosave.stageWriting({ body, title: nextTitle })
  }

  const handleBodyChange = (nextBody: string) => {
    setBody(nextBody)
    autosave.stageWriting({ body: nextBody, title })
  }

  const handleLeave = async () => {
    setActionError(null)
    await autosave.flushWriting()
    if (autosave.hasUnsavedChanges()) {
      setLeaveDialogOpen(true)
      return
    }
    router.push("/app/writing")
  }

  const handleStartSelfCheck = async () => {
    setStartingSelfCheck(true)
    setActionError(null)
    await autosave.flushWriting()

    if (autosave.hasUnsavedChanges()) {
      setStartingSelfCheck(false)
      setActionError(
        "입력한 내용은 이 화면에 남아 있습니다. 저장 문제를 해결한 뒤 다시 점검해 주세요."
      )
      return
    }

    const result = await settleLearnerApiRequest(
      startWritingSelfCheck(initialWriting.id, {
        expectedVersion: autosave.readExpectedVersion(),
      })
    )

    if (result.status === "error") {
      setStartingSelfCheck(false)
      if (
        readLearnerApiErrorCode(result.error) === "WRITING_VERSION_CONFLICT"
      ) {
        await autosave.reconcile()
        setActionError(
          autosave.hasUnsavedChanges()
            ? "다른 화면에서 글이 변경되었습니다. 저장할 내용을 선택한 뒤 다시 점검해 주세요."
            : "다른 화면의 최신 글을 불러왔습니다. 내용을 확인한 뒤 다시 점검해 주세요."
        )
        return
      }
      setActionError(
        "글 점검을 시작하지 못했습니다. 입력한 내용은 이 화면에 남아 있습니다."
      )
      return
    }

    router.push(
      `/app/writing/${encodeURIComponent(initialWriting.id)}/self-check`
    )
  }

  return (
    <>
      <WritingFocusShell
        footer={
          <Button
            className="w-full sm:w-auto"
            disabled={startingSelfCheck}
            onClick={() => void handleStartSelfCheck()}
            size="lg"
          >
            {startingSelfCheck ? "점검 준비 중" : "글 점검하기"}
          </Button>
        }
        header={
          <>
            <Button
              disabled={startingSelfCheck}
              onClick={() => void handleLeave()}
              variant="ghost"
            >
              <ChevronLeftIcon aria-hidden="true" />
              쓰기 홈
            </Button>
            <WritingSaveStatus status={autosave.status} />
          </>
        }
      >
        <form
          className="flex flex-1 flex-col gap-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <p className="text-body-sm font-bold text-muted-foreground">
            {mode.label}
          </p>

          <div className="space-y-2">
            <label
              className="block text-body-sm font-bold"
              htmlFor="writing-title"
            >
              제목
            </label>
            <Input
              className="h-auto rounded-none border-x-0 border-t-0 px-0 py-3 font-heading text-heading-md font-bold shadow-none focus-visible:ring-0"
              id="writing-title"
              disabled={startingSelfCheck}
              onBlur={() => void autosave.flushWriting()}
              onChange={(event) => handleTitleChange(event.target.value)}
              value={title}
            />
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <label
              className="block text-body-sm font-bold"
              htmlFor="writing-body"
            >
              본문
            </label>
            <Textarea
              className="min-h-[52dvh] flex-1 resize-none rounded-3xl px-4 py-4 text-body-lg leading-8 sm:min-h-[56dvh]"
              id="writing-body"
              disabled={startingSelfCheck}
              onBlur={() => void autosave.flushWriting()}
              onChange={(event) => handleBodyChange(event.target.value)}
              value={body}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-muted-foreground">
              <span>{Array.from(body).length.toLocaleString("ko-KR")}자</span>
              <span aria-hidden="true">일반 텍스트로 저장됩니다.</span>
            </div>
          </div>

          {autosave.status.kind === "conflict" ? (
            <div
              className="space-y-3 rounded-3xl border border-border bg-surface p-4"
              role="alert"
            >
              <p className="font-bold">다른 화면에서 이 글이 변경되었습니다.</p>
              <p className="text-body-sm text-muted-foreground">
                입력한 내용은 이 화면에 남아 있습니다. 사용할 내용을 선택해
                주세요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={autosave.useServerWriting}
                  type="button"
                  variant="secondary"
                >
                  서버 글 불러오기
                </Button>
                <Button onClick={autosave.retryLocalWriting} type="button">
                  내 내용 다시 저장하기
                </Button>
              </div>
            </div>
          ) : null}

          {actionError === null ? null : (
            <p className="text-body-sm text-danger-foreground" role="alert">
              {actionError}
            </p>
          )}
        </form>
      </WritingFocusShell>

      <AlertDialog onOpenChange={setLeaveDialogOpen} open={leaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>저장하지 않고 나갈까요?</AlertDialogTitle>
            <AlertDialogDescription>
              저장하지 못한 입력이 이 화면에 남아 있습니다. 나가면 해당 입력을
              잃을 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 쓰기</AlertDialogCancel>
            <Button
              className="min-w-0 flex-1 basis-0"
              onClick={() => router.push("/app/writing")}
              size="extra"
              variant="destructive"
            >
              저장하지 않고 나가기
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function WritingSaveStatus({
  status,
}: {
  readonly status: ReturnType<typeof useWritingAutosave>["status"]
}) {
  switch (status.kind) {
    case "saving":
      return (
        <p
          className="shrink-0 text-body-sm text-muted-foreground"
          role="status"
        >
          저장 중
        </p>
      )
    case "saved":
      return (
        <p
          className="shrink-0 text-body-sm text-muted-foreground"
          role="status"
        >
          저장됨
        </p>
      )
    case "offline":
      return (
        <p
          className="shrink-0 text-body-sm text-danger-foreground"
          role="alert"
        >
          오프라인 · 입력 보존 중
        </p>
      )
    case "error":
      return (
        <p
          className="shrink-0 text-body-sm text-danger-foreground"
          role="alert"
        >
          저장하지 못함 · 입력 보존 중
        </p>
      )
    case "conflict":
      return (
        <p
          className="shrink-0 text-body-sm text-danger-foreground"
          role="alert"
        >
          저장 충돌 · 입력 보존 중
        </p>
      )
  }
}
