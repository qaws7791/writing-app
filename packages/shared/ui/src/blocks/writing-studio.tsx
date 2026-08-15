import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, BookOpen02Icon } from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { SparklesIcon } from "#ui/components/icons/action-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#ui/components/primitives/alert-dialog"
import { Button } from "#ui/components/primitives/button"
import { ComposeCanvas } from "#ui/components/learning/compose-canvas"
import { Compose, ComposeMeter } from "#ui/components/learning/compose"
import {
  FeedbackSummary,
  FeedbackSummaryActions,
  FeedbackSummaryHeader,
  FeedbackSummaryItem,
  FeedbackSummaryItemBody,
  FeedbackSummaryItemTitle,
  FeedbackSummaryMeta,
  FeedbackSummaryPriority,
  FeedbackSummaryTitle,
} from "#ui/components/learning/feedback-summary"
import {
  Insight,
  InsightDescription,
  InsightTitle,
} from "#ui/components/learning/insight"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
} from "#ui/components/primitives/popover"
import {
  WritingStudioShell,
  writingStudioCanvasContentClassName,
  writingStudioCanvasPlaceholderClassName,
} from "#ui/components/learning/writing-studio-shell"
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
} from "#ui/components/learning/writing-brief"

const TASK = {
  title: "숙제 폐지 찬반 칼럼",
  audience: "학교 신문 독자",
  minChars: 200,
  goalChars: 500,
  lead: "숙제를 줄이자는 주장과 근거, 예상 반론을 한 칼럼으로 씁니다.",
  requirements: [
    "한 문단 안에 주장과 근거를 연결한다",
    "반대 의견을 한 문장 이상 다룬다",
    "격식체를 유지한다",
  ],
}

const SAMPLE_STRENGTH =
  "첫 문장에서 입장을 바로 밝혀 독자가 칼럼의 방향을 빠르게 읽습니다."

const SAMPLE_FIXES = [
  {
    title: "반론을 한 문장 더 구체화하세요",
    body: "지금은 ‘반대하는 사람도 있다’고만 끝납니다. 어떤 부담을 말하는지 한 예를 붙이면 설득이 단단해집니다.",
    before: "반대하는 사람도 있다.",
    after: "숙제가 없으면 복습이 줄어든다고 걱정하는 목소리도 있다.",
  },
  {
    title: "만연한 문장을 나누세요",
    body: "한 문장에 주장·예시·결론이 겹칩니다. 두 문장으로 나누면 읽기 쉬워집니다.",
    before:
      "숙제를 줄이면 쉬는 시간이 늘고 자기 주도 학습이 살아나 성적이 오를 수 있다.",
    after:
      "숙제를 줄이면 쉬는 시간이 늘어난다. 그 시간에 스스로 복습하면 성적도 따라올 수 있다.",
  },
  {
    title: "격식체를 맞추세요",
    body: "본문은 ‘습니다’인데 한 문장만 ‘해요’로 바뀝니다. 독자인 신문 독자에게 한 목소리를 유지하세요.",
    before: "그래서 저는 숙제를 줄여야 해요.",
    after: "그래서 숙제를 줄여야 합니다.",
  },
] as const

type StudioPanel = "brief" | "closed" | "feedback"

function BriefBody() {
  return (
    <WritingBrief>
      <WritingBriefHeader>
        <WritingBriefTitle>{TASK.title}</WritingBriefTitle>
        <WritingBriefLead>{TASK.lead}</WritingBriefLead>
      </WritingBriefHeader>
      <WritingBriefFacts>
        <WritingBriefFact>
          <dt className="text-xs text-muted-foreground">독자</dt>
          <dd className="text-sm">{TASK.audience}</dd>
        </WritingBriefFact>
        <WritingBriefFact>
          <dt className="text-xs text-muted-foreground">분량</dt>
          <dd className="text-sm tabular-nums">
            최소 {TASK.minChars}자 · 목표 {TASK.goalChars}자
          </dd>
        </WritingBriefFact>
      </WritingBriefFacts>
      <WritingBriefSection>
        <WritingBriefSectionTitle>필수 요소</WritingBriefSectionTitle>
        <WritingBriefCriteria>
          {TASK.requirements.map((item) => (
            <WritingBriefCriterion key={item}>{item}</WritingBriefCriterion>
          ))}
        </WritingBriefCriteria>
      </WritingBriefSection>
      <WritingBriefRequirement>
        점검 결과는 이 조건과 글의 구성·문체를 함께 봅니다. 글을 통째로 다시 써
        주지는 않습니다.
      </WritingBriefRequirement>
    </WritingBrief>
  )
}

function FeedbackPanel({
  checking,
  onRecheck,
}: {
  readonly checking?: boolean
  readonly onRecheck?: () => void
}) {
  return (
    <FeedbackSummary className="min-h-0 overflow-auto">
      <FeedbackSummaryHeader>
        <FeedbackSummaryTitle>이번 점검</FeedbackSummaryTitle>
        <FeedbackSummaryMeta>고칠 일 3</FeedbackSummaryMeta>
      </FeedbackSummaryHeader>
      <Insight tone="think">
        <InsightTitle>잘된 점</InsightTitle>
        <InsightDescription>{SAMPLE_STRENGTH}</InsightDescription>
      </Insight>
      <FeedbackSummaryPriority>
        {SAMPLE_FIXES.map((item) => (
          <FeedbackSummaryItem key={item.title} priority="high">
            <FeedbackSummaryItemTitle>{item.title}</FeedbackSummaryItemTitle>
            <FeedbackSummaryItemBody>{item.body}</FeedbackSummaryItemBody>
            <p className="text-xs leading-5 text-muted-foreground">
              지금: {item.before}
            </p>
            <p className="text-xs leading-5">이렇게 고쳐 보면: {item.after}</p>
          </FeedbackSummaryItem>
        ))}
      </FeedbackSummaryPriority>
      {onRecheck ? (
        <FeedbackSummaryActions className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-2">
          <Button
            className="w-full justify-center gap-1.5"
            disabled={checking}
            onClick={onRecheck}
            size="sm"
            type="button"
          >
            <SparklesIcon aria-hidden="true" />
            {checking ? "검토 중…" : "다시 점검 받기"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            오늘 남은 점검 4회
          </p>
        </FeedbackSummaryActions>
      ) : null}
    </FeedbackSummary>
  )
}

function PanelIconButton({
  children,
  className,
  label,
  onClick,
  pressed,
}: {
  readonly children: React.ReactNode
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

/**
 * Immersive writing session: floating chrome, a docked companion pane, and in-place AI check.
 */
export function WritingStudio({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [text, setText] = React.useState("")
  const [panel, setPanel] = React.useState<StudioPanel>("closed")
  const [noticeOpen, setNoticeOpen] = React.useState(false)
  const [noticed, setNoticed] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [hasCheck, setHasCheck] = React.useState(false)
  const [checkGuideAnchor, setCheckGuideAnchor] =
    React.useState<HTMLElement | null>(null)
  const checkTimer = React.useRef<number | null>(null)
  const checkGuideTimerRef = React.useRef<number | null>(null)

  const charCount = [...text].length

  const showCheckGuide = React.useCallback((anchor: HTMLElement) => {
    if (checkGuideTimerRef.current !== null) {
      window.clearTimeout(checkGuideTimerRef.current)
    }
    setCheckGuideAnchor(anchor)
    checkGuideTimerRef.current = window.setTimeout(() => {
      setCheckGuideAnchor(null)
      checkGuideTimerRef.current = null
    }, 3500)
  }, [])

  const closeCheckGuide = React.useCallback(() => {
    if (checkGuideTimerRef.current !== null) {
      window.clearTimeout(checkGuideTimerRef.current)
      checkGuideTimerRef.current = null
    }
    setCheckGuideAnchor(null)
  }, [])

  React.useEffect(() => {
    return () => {
      if (checkTimer.current !== null) window.clearTimeout(checkTimer.current)
      if (checkGuideTimerRef.current !== null)
        window.clearTimeout(checkGuideTimerRef.current)
    }
  }, [])

  function handleTextChange(nextText: string) {
    setText(nextText)
    if (checkGuideAnchor !== null) {
      closeCheckGuide()
    }
  }

  function requestCheck(event: React.MouseEvent<HTMLButtonElement>) {
    if (checking) return
    if (charCount < TASK.minChars) {
      showCheckGuide(event.currentTarget)
      return
    }
    closeCheckGuide()
    if (!noticed) {
      setNoticeOpen(true)
      return
    }
    runCheck()
  }

  function runCheck() {
    setChecking(true)
    if (checkTimer.current !== null) window.clearTimeout(checkTimer.current)
    checkTimer.current = window.setTimeout(() => {
      setChecking(false)
      setHasCheck(true)
      setPanel("feedback")
      checkTimer.current = null
    }, 900)
  }

  const meter = (
    <ComposeMeter
      {...(charCount < TASK.minChars ? { min: TASK.minChars } : {})}
      value={charCount}
    />
  )
  const handleActionButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (hasCheck) {
      setPanel((current) => (current === "feedback" ? "closed" : "feedback"))
    } else {
      requestCheck(event)
    }
  }

  const checkButton = (
    <Button
      aria-label={
        hasCheck
          ? panel === "feedback"
            ? "점검 결과 닫기"
            : "점검 결과 보기 (고칠 일 3개)"
          : "점검 받기"
      }
      aria-pressed={hasCheck && panel === "feedback"}
      className="relative rounded-full"
      disabled={checking}
      onClick={handleActionButtonClick}
      size="icon-sm"
      type="button"
      variant={hasCheck && panel === "feedback" ? "secondary" : "default"}
    >
      <SparklesIcon aria-hidden="true" />
      {hasCheck ? (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1 shadow-sm"
        >
          3
        </span>
      ) : null}
    </Button>
  )
  const briefTrigger = (
    <PanelIconButton
      label="과제 보기"
      onClick={() =>
        setPanel((current) => (current === "brief" ? "closed" : "brief"))
      }
      pressed={panel === "brief"}
    >
      <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
    </PanelIconButton>
  )

  const brief = <BriefBody />
  const feedback = hasCheck ? (
    <FeedbackPanel checking={checking} onRecheck={() => runCheck()} />
  ) : null

  return (
    <div
      data-slot="writing-studio"
      className={cn("h-full min-h-0 w-full", className)}
      {...props}
    >
      <WritingStudioShell
        className="h-full"
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
        footer={
          <>
            {meter}
            <div className="ml-auto">{checkButton}</div>
          </>
        }
        headerCenter={meter}
        headerEnd={
          <>
            {briefTrigger}
            <div className="hidden lg:block">{checkButton}</div>
          </>
        }
        headerStart={
          <>
            <Button
              aria-label="쓰기 홈으로"
              className="rounded-full shrink-0"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
            <p className="min-w-0 truncate text-sm font-medium tracking-[-0.01em] pr-1">
              {TASK.title}
            </p>
            <span className="sr-only" role="status">
              {checking ? "글을 검토하는 중입니다." : "저장됨"}
            </span>
          </>
        }
        onCompanionClose={() => setPanel("closed")}
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
            onChange={handleTextChange}
            placeholder="여기에 글을 씁니다."
            placeholderClassName={writingStudioCanvasPlaceholderClassName}
            value={text}
          />
        </Compose>
      </WritingStudioShell>

      <WritingStudioCheckGuidePopover
        anchor={checkGuideAnchor}
        charCount={charCount}
        minChars={TASK.minChars}
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
            <AlertDialogAction
              onClick={() => {
                setNoticed(true)
                setNoticeOpen(false)
                runCheck()
              }}
            >
              점검 계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WritingStudioCheckGuidePopover({
  anchor,
  charCount,
  minChars,
  onOpenChange,
  open,
}: {
  readonly anchor: HTMLElement | null
  readonly charCount: number
  readonly minChars: number
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
}) {
  const remaining = Math.max(0, minChars - charCount)

  return (
    <Popover onOpenChange={onOpenChange} open={open && anchor !== null}>
      <PopoverContent
        align="end"
        anchor={anchor}
        aria-live="polite"
        className="w-72 p-3.5 gap-2 shadow-xl"
        side="top"
        sideOffset={8}
      >
        <PopoverHeader className="pb-0 gap-1">
          <div className="flex items-center gap-1.5 text-primary">
            <SparklesIcon className="size-3.5 shrink-0" />
            <span className="text-[11px] font-semibold tracking-tight">
              점검 조건 안내
            </span>
          </div>
          <PopoverTitle className="text-sm font-semibold tracking-tight text-foreground">
            최소 분량까지 {remaining.toLocaleString("ko-KR")}자 남았어요
          </PopoverTitle>
        </PopoverHeader>
        <p className="text-xs leading-5 text-pretty text-muted-foreground">
          최소 {minChars.toLocaleString("ko-KR")}자부터 점검을 받을 수 있어요.
          (현재 {charCount.toLocaleString("ko-KR")}자)
        </p>
      </PopoverContent>
    </Popover>
  )
}

export default WritingStudio
