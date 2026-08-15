"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  acknowledgeWritingAiNotice,
  checkWriting,
} from "@workspace/http-client/learner"
import {
  BookOpenIcon,
  ChevronLeftIcon,
  MessageIcon,
  SparklesIcon,
} from "@workspace/ui/components/icons"
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
import { Button } from "@workspace/ui/components/primitives/button"
import { ComposeCanvas } from "@workspace/ui/components/learning/compose-canvas"
import {
  Compose,
  ComposeActions,
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
  WritingStudioShell,
  writingStudioCanvasContentClassName,
  writingStudioCanvasPlaceholderClassName,
} from "@workspace/ui/components/learning/writing-studio-shell"
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
import { WritingCheckGuidePopover } from "@/features/writing/ui/writing-check-guide-popover"
import {
  calculateKoreanWritingMetrics,
  WritingStatsPopover,
} from "@/features/writing/ui/writing-stats-popover"
import {
  readLearnerApiErrorCode,
  settleLearnerApiRequest,
  type LearnerWritingDetailDto,
} from "@/shared/http/learner-api-client"

type StudioPanel = "brief" | "closed" | "feedback"

export function WritingStudio({
  initialWriting,
}: {
  readonly initialWriting: LearnerWritingDetailDto
}) {
  const router = useRouter()
  const [writing, setWriting] = useState(initialWriting)
  const [body, setBody] = useState(initialWriting.body)
  const [panel, setPanel] = useState<StudioPanel>("closed")
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [checkGuideAnchor, setCheckGuideAnchor] = useState<HTMLElement | null>(
    null
  )
  const checkGuideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showCheckGuide = useCallback((anchor: HTMLElement) => {
    if (checkGuideTimerRef.current !== null) {
      clearTimeout(checkGuideTimerRef.current)
    }
    setCheckGuideAnchor(anchor)
    checkGuideTimerRef.current = setTimeout(() => {
      setCheckGuideAnchor(null)
      checkGuideTimerRef.current = null
    }, 3500)
  }, [])

  const closeCheckGuide = useCallback(() => {
    if (checkGuideTimerRef.current !== null) {
      clearTimeout(checkGuideTimerRef.current)
      checkGuideTimerRef.current = null
    }
    setCheckGuideAnchor(null)
  }, [])

  useEffect(() => {
    return () => {
      if (checkGuideTimerRef.current !== null) {
        clearTimeout(checkGuideTimerRef.current)
      }
    }
  }, [])

  const applyWriting = useCallback((next: LearnerWritingDetailDto) => {
    setWriting(next)
    setBody(next.body)
    setActionError(null)
  }, [])

  const applyPersistedWriting = useCallback((next: LearnerWritingDetailDto) => {
    setWriting((current) => ({
      ...current,
      aiNoticeAcknowledged: next.aiNoticeAcknowledged,
      check: next.check,
      dailyChecksRemaining: next.dailyChecksRemaining,
      updatedAt: next.updatedAt,
      version: next.version,
    }))
  }, [])

  const autosave = useWritingAutosave({
    initialWriting,
    onPersistedWriting: applyPersistedWriting,
    onServerWritingApplied: applyWriting,
  })

  const hasCheck = writing.check !== null

  const handleBodyChange = (nextBody: string) => {
    setBody(nextBody)
    autosave.stageWriting({ body: nextBody })
    if (checkGuideAnchor !== null) {
      closeCheckGuide()
    }
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

  const runCheck = async (anchor?: HTMLElement) => {
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
      if (code === "WRITING_CHECK_MIN_CHARS") {
        if (anchor) showCheckGuide(anchor)
        return
      }
      setActionError(readCheckErrorMessage(code))
      return
    }

    applyWriting(result.value)
    setPanel("feedback")
  }

  const koreanMetrics = calculateKoreanWritingMetrics(body)

  const handleCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (checking || autosave.status.kind === "conflict") return

    if (koreanMetrics.charCountWithSpaces < writing.brief.minChars) {
      showCheckGuide(event.currentTarget)
      return
    }

    closeCheckGuide()
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
    await runCheck(event.currentTarget)
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

  const meter = (
    <WritingStatsPopover
      metrics={koreanMetrics}
      minChars={writing.brief.minChars}
    >
      <ComposeMeter
        eojeol={koreanMetrics.eojeolCount}
        {...(koreanMetrics.charCountWithSpaces < writing.brief.minChars
          ? { min: writing.brief.minChars }
          : {})}
        value={koreanMetrics.charCountWithSpaces}
      />
    </WritingStatsPopover>
  )
  const checkButton = (
    <Button
      disabled={checking || autosave.status.kind === "conflict"}
      onClick={(e) => void handleCheck(e)}
      size="sm"
      type="button"
    >
      <SparklesIcon aria-hidden="true" />
      {checking ? "검토 중…" : "점검"}
    </Button>
  )

  const brief = <WritingTaskBrief writing={writing} />
  const feedback =
    writing.check === null ? null : <WritingCheckPanel check={writing.check} />

  return (
    <>
      <WritingStudioShell
        companion={
          panel === "closed"
            ? undefined
            : panel === "feedback"
              ? feedback
              : brief
        }
        companionDescription={
          panel === "feedback"
            ? "최근 점검 결과입니다."
            : "쓰면서 다시 확인할 조건입니다."
        }
        companionTitle={panel === "feedback" ? "이번 점검" : "과제"}
        onCompanionClose={() => setPanel("closed")}
        footer={
          <>
            {meter}
            <div className="ml-auto">{checkButton}</div>
          </>
        }
        headerCenter={meter}
        headerEnd={
          <>
            <div className="flex items-center rounded-full border border-border/40 bg-muted/40 p-0.5">
              <PanelIconButton
                label="과제 보기"
                onClick={() =>
                  setPanel((current) =>
                    current === "brief" ? "closed" : "brief"
                  )
                }
                pressed={panel === "brief"}
              >
                <BookOpenIcon aria-hidden="true" />
              </PanelIconButton>
              {hasCheck ? (
                <PanelIconButton
                  label="점검 결과 보기"
                  onClick={() =>
                    setPanel((current) =>
                      current === "feedback" ? "closed" : "feedback"
                    )
                  }
                  pressed={panel === "feedback"}
                >
                  <MessageIcon aria-hidden="true" />
                </PanelIconButton>
              ) : null}
            </div>
            <div className="hidden lg:block">{checkButton}</div>
          </>
        }
        headerStart={
          <>
            <Button
              aria-label="쓰기 홈으로"
              className="rounded-full shrink-0"
              disabled={checking}
              onClick={() => void handleLeave()}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </Button>
            <p className="min-w-0 truncate text-sm font-medium tracking-[-0.01em] pr-1">
              {writing.brief.title}
            </p>
            <WritingSaveStatus status={autosave.status} />
          </>
        }
        notice={
          <>
            {autosave.status.kind === "conflict" ? (
              <div className="rounded-3xl bg-popover shadow-lg">
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
              </div>
            ) : null}
            {actionError === null ? null : (
              <div className="rounded-3xl bg-popover shadow-lg">
                <Insight className="px-1 sm:px-2" role="alert" tone="incorrect">
                  <InsightDescription>{actionError}</InsightDescription>
                </Insight>
              </div>
            )}
          </>
        }
      >
        <Compose className="flex h-full min-h-0 flex-1 flex-col gap-0">
          <label
            className="sr-only"
            htmlFor="writing-studio-editor"
            id="writing-studio-editor-label"
          >
            본문
          </label>
          <ComposeCanvas
            aria-labelledby="writing-studio-editor-label"
            className="min-h-0 flex-1 bg-transparent"
            contentClassName={writingStudioCanvasContentClassName}
            disabled={checking}
            id="writing-studio-editor"
            onBlur={() => void autosave.flushWriting()}
            onChange={handleBodyChange}
            placeholder="여기에 글을 씁니다."
            placeholderClassName={writingStudioCanvasPlaceholderClassName}
            value={body}
          />
        </Compose>
      </WritingStudioShell>

      <WritingCheckGuidePopover
        anchor={checkGuideAnchor}
        charCount={koreanMetrics.charCountWithSpaces}
        minChars={writing.brief.minChars}
        onOpenChange={(open) => {
          if (!open) closeCheckGuide()
        }}
        open={checkGuideAnchor !== null}
      />

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

function PanelIconButton({
  children,
  className,
  label,
  onClick,
  pressed,
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly label: string
  readonly onClick: () => void
  readonly pressed: boolean
}) {
  return (
    <Button
      aria-label={label}
      aria-pressed={pressed}
      className={className}
      onClick={onClick}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
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
        <span
          aria-live="polite"
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse"
          role="status"
          title="저장 중"
        />
      )
    case "saved":
      return (
        <span className="sr-only" role="status">
          저장됨
        </span>
      )
    case "offline":
    case "error":
    case "conflict":
      return (
        <span
          aria-live="assertive"
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
          role="alert"
          title="저장하지 못함"
        />
      )
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
