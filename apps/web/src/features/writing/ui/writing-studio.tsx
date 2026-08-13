"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  acknowledgeWritingAiNotice,
  checkWriting,
  completeWriting,
} from "@workspace/http-client/learner"
import { BookOpenIcon, ChevronLeftIcon } from "@workspace/ui/components/icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/primitives/alert-dialog"
import { Badge } from "@workspace/ui/components/primitives/badge"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Compose,
  ComposeActions,
  ComposeEditor,
  ComposeMeter,
} from "@workspace/ui/components/learning/compose"
import {
  FeedbackSummary,
  FeedbackSummaryHeader,
  FeedbackSummaryItem,
  FeedbackSummaryItemBody,
  FeedbackSummaryItemTitle,
  FeedbackSummaryMeta,
  FeedbackSummaryPriority,
  FeedbackSummaryTitle,
} from "@workspace/ui/components/learning/feedback-summary"
import {
  Insight,
  InsightDescription,
  InsightTitle,
} from "@workspace/ui/components/learning/insight"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/primitives/sheet"
import {
  WritingBrief,
  WritingBriefCriteria,
  WritingBriefCriterion,
  WritingBriefFact,
  WritingBriefFacts,
  WritingBriefHeader,
  WritingBriefLead,
  WritingBriefRequirement,
  WritingBriefSection,
  WritingBriefSectionTitle,
  WritingBriefTitle,
} from "@workspace/ui/components/learning/writing-brief"

import { useWritingAutosave } from "@/features/writing/hooks/use-writing-autosave"
import { WritingStudioShell } from "@/features/writing/ui/writing-studio-shell"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

export function WritingStudio({
  initialWriting,
}: {
  readonly initialWriting: LearnerWritingDetailDto
}) {
  const router = useRouter()
  const [writing, setWriting] = useState(initialWriting)
  const [body, setBody] = useState(initialWriting.body)
  const [briefOpen, setBriefOpen] = useState(true)
  const [briefSheetOpen, setBriefSheetOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const applyWriting = useCallback((next: LearnerWritingDetailDto) => {
    setWriting(next)
    setBody(next.body)
    setActionError(null)
  }, [])

  const applyPersistedWriting = useCallback((next: LearnerWritingDetailDto) => {
    setWriting((current) => ({
      ...current,
      aiNoticeAcknowledged: next.aiNoticeAcknowledged,
      canComplete: next.canComplete,
      check: next.check,
      completedAt: next.completedAt,
      dailyChecksRemaining: next.dailyChecksRemaining,
      status: next.status,
      updatedAt: next.updatedAt,
      version: next.version,
    }))
  }, [])

  const autosave = useWritingAutosave({
    initialWriting,
    onPersistedWriting: applyPersistedWriting,
    onServerWritingApplied: applyWriting,
  })

  const showFeedback = writing.check !== null && !autosave.dirty
  const busy = checking || completing

  const handleBodyChange = (nextBody: string) => {
    if (body.length === 0 && nextBody.length > 0) setBriefOpen(false)
    setBody(nextBody)
    autosave.stageWriting({ body: nextBody })
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

  const runCheck = async () => {
    setChecking(true)
    setActionError(null)
    await autosave.flushWriting()

    if (autosave.hasUnsavedChanges()) {
      setChecking(false)
      setActionError(
        "입력한 내용은 이 화면에 남아 있습니다. 저장 문제를 해결한 뒤 다시 점검해 주세요."
      )
      return
    }

    const result = await settleLearnerApiRequest(checkWriting(writing.id))
    setChecking(false)

    if (result.status === "error") {
      const code = readLearnerApiErrorCode(result.error)
      if (code === "WRITING_AI_NOTICE_REQUIRED") {
        setNoticeOpen(true)
        return
      }
      setActionError(readCheckErrorMessage(code))
      return
    }

    applyWriting(result.value)
  }

  const handleCheck = async () => {
    if (busy || autosave.status.kind === "conflict") return
    await autosave.flushWriting()
    if (autosave.hasUnsavedChanges()) {
      setActionError(
        "입력한 내용은 이 화면에 남아 있습니다. 저장 문제를 해결한 뒤 다시 점검해 주세요."
      )
      return
    }
    if (!writing.aiNoticeAcknowledged) {
      setNoticeOpen(true)
      return
    }
    await runCheck()
  }

  const handleAcknowledgeAndCheck = async () => {
    setNoticeOpen(false)
    const notice = await settleLearnerApiRequest(acknowledgeWritingAiNotice())
    if (notice.status === "error") {
      setActionError("고지를 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")
      return
    }
    setWriting((current) => ({ ...current, aiNoticeAcknowledged: true }))
    await runCheck()
  }

  const handleComplete = async () => {
    if (busy || !writing.canComplete || autosave.dirty) return
    setCompleting(true)
    setActionError(null)
    await autosave.flushWriting()

    if (autosave.hasUnsavedChanges()) {
      setCompleting(false)
      setActionError(
        "입력한 내용은 이 화면에 남아 있습니다. 저장 문제를 해결한 뒤 다시 마쳐 주세요."
      )
      return
    }

    const result = await settleLearnerApiRequest(
      completeWriting(writing.id, {
        expectedVersion: autosave.readExpectedVersion(),
      })
    )
    setCompleting(false)

    if (result.status === "error") {
      setActionError(
        readCompleteErrorMessage(readLearnerApiErrorCode(result.error))
      )
      return
    }

    applyWriting(result.value)
  }

  const brief = <WritingTaskBrief writing={writing} />
  const feedback =
    showFeedback && writing.check !== null ? (
      <WritingCheckPanel check={writing.check} />
    ) : undefined

  return (
    <>
      <WritingStudioShell
        brief={brief}
        briefOpen={briefOpen}
        feedback={feedback}
        footer={
          <>
            <ComposeMeter
              goal={writing.brief.goalChars}
              min={writing.brief.minChars}
              value={[...body].length}
            />
            <span className="text-xs text-muted-foreground" role="status">
              {checking
                ? "글을 검토하는 중입니다."
                : readSaveStatusLabel(autosave.status.kind)}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                disabled={busy || !writing.canComplete || autosave.dirty}
                onClick={() => void handleComplete()}
                type="button"
                variant="outline"
              >
                {completing ? "마치는 중" : "마치기"}
              </Button>
              <Button
                disabled={busy || autosave.status.kind === "conflict"}
                onClick={() => void handleCheck()}
                type="button"
              >
                {checking ? "검토 중…" : "점검하기"}
              </Button>
            </div>
          </>
        }
        header={
          <>
            <Button
              aria-label="쓰기 홈으로"
              className="rounded-full"
              disabled={busy}
              onClick={() => void handleLeave()}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium tracking-[-0.01em]">
                {writing.brief.title}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {writing.brief.difficulty} · 목표{" "}
                {writing.brief.goalChars.toLocaleString("ko-KR")}자
              </p>
            </div>
            <WritingSaveStatus status={autosave.status} />
            <Button
              className="hidden sm:inline-flex"
              onClick={() => setBriefOpen((open) => !open)}
              type="button"
              variant="ghost"
              size="sm"
            >
              과제 {briefOpen ? "접기" : "보기"}
            </Button>
            <Button
              aria-label="과제 보기"
              className="rounded-full sm:hidden"
              onClick={() => setBriefSheetOpen(true)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <BookOpenIcon aria-hidden="true" />
            </Button>
          </>
        }
        notice={
          <>
            {autosave.status.kind === "conflict" ? (
              <Insight className="px-1 sm:px-2" role="alert" tone="incorrect">
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
              <Insight className="px-1 sm:px-2" role="alert" tone="incorrect">
                <InsightDescription>{actionError}</InsightDescription>
              </Insight>
            )}
            {writing.status === "complete" && !autosave.dirty ? (
              <Insight className="px-1 sm:px-2" tone="correct">
                <InsightTitle>이 글을 마쳤습니다</InsightTitle>
                <InsightDescription>
                  본문을 고치면 다시 작성 중이 되고, 점검을 한 번 더 해야 마칠
                  수 있습니다.
                </InsightDescription>
              </Insight>
            ) : null}
          </>
        }
      >
        <Compose className="flex h-full min-h-0 flex-1 flex-col gap-0">
          <label className="sr-only" htmlFor="writing-studio-editor">
            본문
          </label>
          <ComposeEditor
            className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent px-5 py-5 shadow-none hover:border-transparent hover:bg-transparent focus-visible:border-transparent focus-visible:bg-transparent focus-visible:ring-0 sm:px-8 sm:py-8"
            disabled={busy}
            id="writing-studio-editor"
            onBlur={() => void autosave.flushWriting()}
            onChange={(event) => handleBodyChange(event.target.value)}
            placeholder="여기에 글을 씁니다."
            value={body}
          />
        </Compose>
      </WritingStudioShell>

      <Sheet onOpenChange={setBriefSheetOpen} open={briefSheetOpen}>
        <SheetContent className="max-h-[80vh] overflow-auto" side="bottom">
          <SheetHeader>
            <SheetTitle>과제</SheetTitle>
            <SheetDescription>쓰면서 다시 확인할 조건입니다.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">{brief}</div>
        </SheetContent>
      </Sheet>

      <AlertDialog onOpenChange={setNoticeOpen} open={noticeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>점검을 위해 글을 보냅니다</AlertDialogTitle>
            <AlertDialogDescription>
              작성한 본문은 이 과제를 점검하려고 외부 AI로 전달됩니다. 모델
              학습에는 쓰이지 않습니다. 계속하면 지금 글을 점검합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleAcknowledgeAndCheck()}>
              점검 계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

function WritingTaskBrief({
  writing,
}: {
  readonly writing: LearnerWritingDetailDto
}) {
  return (
    <WritingBrief>
      <WritingBriefHeader>
        <WritingBriefTitle>{writing.brief.title}</WritingBriefTitle>
        <WritingBriefLead>{writing.brief.situation}</WritingBriefLead>
      </WritingBriefHeader>
      <WritingBriefFacts>
        <WritingBriefFact>
          <dt className="text-xs text-muted-foreground">독자</dt>
          <dd className="text-sm">{writing.brief.audience}</dd>
        </WritingBriefFact>
        <WritingBriefFact>
          <dt className="text-xs text-muted-foreground">분량</dt>
          <dd className="text-sm tabular-nums">
            최소 {writing.brief.minChars}자 · 목표 {writing.brief.goalChars}자
          </dd>
        </WritingBriefFact>
      </WritingBriefFacts>
      <WritingBriefSection>
        <WritingBriefSectionTitle>필수 요소</WritingBriefSectionTitle>
        <WritingBriefCriteria>
          {writing.brief.requiredElements.map((item) => (
            <WritingBriefCriterion key={item}>{item}</WritingBriefCriterion>
          ))}
        </WritingBriefCriteria>
      </WritingBriefSection>
      <WritingBriefRequirement>
        점검 결과는 이 조건과 글의 구성·문체를 함께 봅니다. 글을 통째로 다시 써
        주지는 않습니다. 오늘 남은 점검 {writing.dailyChecksRemaining}회.
      </WritingBriefRequirement>
    </WritingBrief>
  )
}

function WritingCheckPanel({
  check,
}: {
  readonly check: NonNullable<LearnerWritingDetailDto["check"]>
}) {
  return (
    <FeedbackSummary className="min-h-0 overflow-auto">
      <FeedbackSummaryHeader>
        <FeedbackSummaryTitle>이번 점검</FeedbackSummaryTitle>
        <FeedbackSummaryMeta>
          고칠 일 {check.revisions.length}
        </FeedbackSummaryMeta>
      </FeedbackSummaryHeader>
      {check.strengths.map((strength) => (
        <Insight key={strength} tone="think">
          <InsightTitle>잘된 점</InsightTitle>
          <InsightDescription>{strength}</InsightDescription>
        </Insight>
      ))}
      {check.unmetRequirements.length > 0 ? (
        <Insight tone="incorrect">
          <InsightTitle>과제 미충족</InsightTitle>
          <InsightDescription>
            {check.unmetRequirements.join(" ")}
          </InsightDescription>
        </Insight>
      ) : null}
      {check.revisions.length > 0 ? (
        <FeedbackSummaryPriority>
          {check.revisions.map((item) => (
            <FeedbackSummaryItem
              key={`${item.location}-${item.reason}`}
              priority="high"
            >
              <FeedbackSummaryItemTitle>
                {item.location}
              </FeedbackSummaryItemTitle>
              <FeedbackSummaryItemBody>{item.reason}</FeedbackSummaryItemBody>
              <p className="text-xs leading-5">
                이렇게 고쳐 보면: {item.example}
              </p>
            </FeedbackSummaryItem>
          ))}
        </FeedbackSummaryPriority>
      ) : null}
    </FeedbackSummary>
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

function readSaveStatusLabel(
  kind: ReturnType<typeof useWritingAutosave>["status"]["kind"]
): string {
  switch (kind) {
    case "saving":
      return "저장 중"
    case "saved":
      return "저장됨"
    case "offline":
      return "오프라인 · 입력 보존 중"
    case "error":
      return "저장하지 못함"
    case "conflict":
      return "저장 충돌"
  }
}

function readCheckErrorMessage(code: string): string {
  switch (code) {
    case "WRITING_CHECK_DAILY_LIMIT":
      return "오늘 점검 횟수를 모두 썼습니다. 내일 다시 시도해 주세요."
    case "WRITING_CHECK_MIN_CHARS":
      return "최소 글자 수에 아직 못 미쳤습니다."
    case "WRITING_CHECK_NOT_CONFIGURED":
      return "점검을 아직 준비하지 못했습니다."
    case "WRITING_CHECK_UNAVAILABLE":
      return "점검을 완료하지 못했습니다. 잠시 뒤 다시 시도해 주세요."
    case "WRITING_VERSION_CONFLICT":
      return "다른 화면에서 글이 변경되었습니다. 저장할 내용을 선택한 뒤 다시 점검해 주세요."
    default:
      return "글 점검을 시작하지 못했습니다. 입력한 내용은 이 화면에 남아 있습니다."
  }
}

function readCompleteErrorMessage(code: string): string {
  switch (code) {
    case "WRITING_CHECK_NOT_VALID":
      return "현재 본문에 유효한 점검이 없습니다. 점검한 뒤 마쳐 주세요."
    case "WRITING_VERSION_CONFLICT":
      return "다른 화면에서 글이 변경되었습니다. 내용을 확인한 뒤 다시 마쳐 주세요."
    default:
      return "글을 마치지 못했습니다. 입력한 내용은 이 화면에 남아 있습니다."
  }
}
