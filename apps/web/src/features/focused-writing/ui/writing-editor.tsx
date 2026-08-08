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
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Compose,
  ComposeActions,
  ComposeBadge,
  ComposeEditor,
  ComposeMeter,
} from "@workspace/ui/components/ui/compose"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Insight,
  InsightDescription,
  InsightTitle,
} from "@workspace/ui/components/ui/insight"

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
          className="flex flex-1 flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <Compose className="flex-1">
            <ComposeBadge>{mode.label}</ComposeBadge>

            <Field>
              <FieldLabel htmlFor="writing-title">제목</FieldLabel>
              <Input
                className="h-auto rounded-2xl px-4 py-3 font-heading text-xl font-semibold tracking-[-0.02em]"
                id="writing-title"
                disabled={startingSelfCheck}
                onBlur={() => void autosave.flushWriting()}
                onChange={(event) => handleTitleChange(event.target.value)}
                value={title}
              />
            </Field>

            <Field className="flex-1">
              <FieldLabel htmlFor="writing-body">본문</FieldLabel>
              <ComposeEditor
                className="min-h-[52dvh] flex-1 resize-none px-4 py-4 text-base leading-8 sm:min-h-[56dvh]"
                id="writing-body"
                disabled={startingSelfCheck}
                onBlur={() => void autosave.flushWriting()}
                onChange={(event) => handleBodyChange(event.target.value)}
                value={body}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ComposeMeter value={Array.from(body).length} />
                <FieldDescription aria-hidden="true">
                  일반 텍스트로 저장됩니다.
                </FieldDescription>
              </div>
            </Field>

            {autosave.status.kind === "conflict" ? (
              <Insight role="alert" tone="incorrect">
                <InsightTitle>
                  다른 화면에서 이 글이 변경되었습니다.
                </InsightTitle>
                <InsightDescription>
                  입력한 내용은 이 화면에 남아 있습니다. 사용할 내용을 선택해
                  주세요.
                </InsightDescription>
                <ComposeActions>
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
                </ComposeActions>
              </Insight>
            ) : null}

            {actionError === null ? null : (
              <Insight role="alert" tone="incorrect">
                <InsightDescription>{actionError}</InsightDescription>
              </Insight>
            )}
          </Compose>
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
              size="lg"
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
        <Badge aria-live="polite" role="status" variant="secondary">
          저장 중
        </Badge>
      )
    case "saved":
      return (
        <Badge aria-live="polite" role="status" variant="success">
          저장됨
        </Badge>
      )
    case "offline":
      return (
        <Badge aria-live="assertive" role="alert" variant="destructive">
          오프라인 · 입력 보존 중
        </Badge>
      )
    case "error":
      return (
        <Badge aria-live="assertive" role="alert" variant="destructive">
          저장하지 못함 · 입력 보존 중
        </Badge>
      )
    case "conflict":
      return (
        <Badge aria-live="assertive" role="alert" variant="destructive">
          저장 충돌 · 입력 보존 중
        </Badge>
      )
  }
}
