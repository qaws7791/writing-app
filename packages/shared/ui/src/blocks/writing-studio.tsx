"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
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
import { Badge } from "#ui/components/primitives/badge"
import { Button } from "#ui/components/primitives/button"
import {
  Compose,
  ComposeEditor,
  ComposeMeter,
} from "#ui/components/learning/compose"
import {
  FeedbackSummary,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#ui/components/primitives/sheet"
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
  difficulty: "심화" as const,
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

type StudioPhase = "writing" | "checking" | "feedback" | "complete"

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

function FeedbackPanel() {
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
    </FeedbackSummary>
  )
}

/**
 * Immersive writing session: collapsing brief, compose, in-place AI check, finish.
 */
export function WritingStudio({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [text, setText] = React.useState("")
  const [briefOpen, setBriefOpen] = React.useState(true)
  const [briefSheetOpen, setBriefSheetOpen] = React.useState(false)
  const [noticeOpen, setNoticeOpen] = React.useState(false)
  const [noticed, setNoticed] = React.useState(false)
  const [phase, setPhase] = React.useState<StudioPhase>("writing")
  const checkTimer = React.useRef<number | null>(null)

  const charCount = [...text].length
  const canCheck = charCount >= TASK.minChars && phase !== "checking"
  const showFeedback = phase === "feedback"

  React.useEffect(() => {
    return () => {
      if (checkTimer.current !== null) window.clearTimeout(checkTimer.current)
    }
  }, [])

  function handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value
    if (text.length === 0 && next.length > 0) setBriefOpen(false)
    if (phase === "feedback" || phase === "complete") setPhase("writing")
    setText(next)
  }

  function requestCheck() {
    if (!canCheck) return
    if (!noticed) {
      setNoticeOpen(true)
      return
    }
    runCheck()
  }

  function runCheck() {
    setPhase("checking")
    if (checkTimer.current !== null) window.clearTimeout(checkTimer.current)
    checkTimer.current = window.setTimeout(() => {
      setPhase("feedback")
      checkTimer.current = null
    }, 900)
  }

  return (
    <div
      data-slot="writing-studio"
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background text-foreground",
        className
      )}
      {...props}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="쓰기 홈으로"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-[-0.01em]">
            {TASK.title}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {TASK.difficulty} · 목표 {TASK.goalChars.toLocaleString("ko-KR")}자
          </p>
        </div>
        <Badge variant="outline">저장됨</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => setBriefOpen((open) => !open)}
        >
          과제 {briefOpen ? "접기" : "보기"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full sm:hidden"
          aria-label="과제 보기"
          onClick={() => setBriefSheetOpen(true)}
        >
          <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
        </Button>
      </header>

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          briefOpen && "lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
          showFeedback && "xl:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]",
          briefOpen &&
            showFeedback &&
            "xl:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(16rem,20rem)]"
        )}
      >
        {briefOpen ? (
          <aside className="hidden min-h-0 overflow-auto border-r border-border/50 p-5 lg:block">
            <BriefBody />
          </aside>
        ) : null}

        <Compose className="flex h-full min-h-0 flex-col gap-0">
          <label className="sr-only" htmlFor="writing-studio-editor">
            본문
          </label>
          <ComposeEditor
            id="writing-studio-editor"
            value={text}
            onChange={handleTextChange}
            placeholder="여기에 글을 씁니다."
            className="min-h-0 flex-1 resize-none rounded-none border-0 px-5 py-5 shadow-none sm:px-8 sm:py-6"
            disabled={phase === "checking"}
          />
        </Compose>

        {showFeedback ? (
          <aside className="hidden min-h-0 border-l border-border/50 p-5 xl:block">
            <FeedbackPanel />
          </aside>
        ) : null}
      </div>

      {showFeedback ? (
        <div className="border-t border-border/50 p-4 xl:hidden">
          <FeedbackPanel />
        </div>
      ) : null}

      <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-border/50 px-4 py-3 sm:px-6">
        <ComposeMeter
          value={charCount}
          min={TASK.minChars}
          goal={TASK.goalChars}
        />
        <span className="text-xs text-muted-foreground" role="status">
          {phase === "checking" ? "글을 검토하는 중입니다." : "저장됨"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={phase !== "feedback"}
            onClick={() => setPhase("complete")}
          >
            마치기
          </Button>
          <Button type="button" disabled={!canCheck} onClick={requestCheck}>
            {phase === "checking" ? "검토 중…" : "점검하기"}
          </Button>
        </div>
      </footer>

      {phase === "complete" ? (
        <Insight tone="correct" className="mx-4 mb-4 sm:mx-6">
          <InsightTitle>이 글을 마쳤습니다</InsightTitle>
          <InsightDescription>
            본문을 고치면 다시 작성 중이 되고, 점검을 한 번 더 해야 마칠 수
            있습니다.
          </InsightDescription>
        </Insight>
      ) : null}

      <Sheet open={briefSheetOpen} onOpenChange={setBriefSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-auto">
          <SheetHeader>
            <SheetTitle>과제</SheetTitle>
            <SheetDescription>쓰면서 다시 확인할 조건입니다.</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <BriefBody />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={noticeOpen} onOpenChange={setNoticeOpen}>
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

export default WritingStudio
