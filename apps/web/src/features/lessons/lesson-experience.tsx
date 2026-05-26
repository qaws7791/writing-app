"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { Checkbox } from "@workspace/ui/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/ui/toggle-group"
import {
  CheckIcon,
  GripVerticalIcon,
  HeartIcon,
  SparklesIcon,
  XIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"

import {
  createConfettiPieces,
  findStepIndexByType,
  getBlankStatus,
  getChecklistComplete,
  getChoiceStatus,
  getClassifyStatus,
  getDeterministicOrder,
  getLessonProgress,
  getMatchRate,
  isSelectedChoiceCorrect,
  parseFillBlankTemplate,
  parseMarkedText,
  splitMarkdownEmphasis,
  splitParagraphs,
  type BlankAssignments,
  type ChoiceStatus,
  type ClassifyAssignments,
  type ClassifyStatus,
  type MatchConnections,
} from "@/features/lessons/lesson-logic"
import type {
  AiFeedbackContent,
  ChecklistContent,
  ClassifyContent,
  CompareContent,
  CompleteContent,
  ConceptContent,
  ExampleRevealContent,
  FillBlankContent,
  IntroContent,
  Lesson,
  LessonId,
  LessonStep,
  LessonStepId,
  LessonTone,
  LongWriteContent,
  MatchContent,
  MultipleChoiceContent,
  ReadingPassageContent,
  ReflectionContent,
  ReorderContent,
  RevisionContent,
  ShortWriteContent,
  SummaryContent,
  TranscribeContent,
  WordSelectContent,
} from "@/features/lessons/lesson-types"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { AiFeedbackResult, WritingAppApi } from "@/lib/api/writing-app-api"

const lessonMaxWidthClassName = "mx-auto w-full max-w-[680px]"
const actionHeightClassName = "h-[52px]"

const toneClasses: Record<
  LessonTone,
  {
    bg: string
    border: string
    text: string
    strong: string
    solid: string
    solidText: string
  }
> = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/35",
    text: "text-primary",
    strong: "text-primary",
    solid: "bg-primary",
    solidText: "text-primary-foreground",
  },
  success: {
    bg: "bg-primary/10",
    border: "border-primary/35",
    text: "text-primary",
    strong: "text-primary",
    solid: "bg-primary",
    solidText: "text-primary-foreground",
  },
  info: {
    bg: "bg-chart-2/10",
    border: "border-chart-2/35",
    text: "text-chart-2",
    strong: "text-chart-2",
    solid: "bg-chart-2",
    solidText: "text-white",
  },
  warning: {
    bg: "bg-chart-3/10",
    border: "border-chart-3/35",
    text: "text-chart-3",
    strong: "text-chart-3",
    solid: "bg-chart-3",
    solidText: "text-background",
  },
  danger: {
    bg: "bg-destructive/10",
    border: "border-destructive/35",
    text: "text-destructive",
    strong: "text-destructive",
    solid: "bg-destructive",
    solidText: "text-destructive-foreground",
  },
  neutral: {
    bg: "bg-muted",
    border: "border-border/70",
    text: "text-muted-foreground",
    strong: "text-foreground",
    solid: "bg-muted",
    solidText: "text-foreground",
  },
}

const confettiToneClasses: Record<LessonTone, string> = {
  primary: "bg-primary",
  success: "bg-primary",
  info: "bg-chart-2",
  warning: "bg-chart-3",
  danger: "bg-destructive",
  neutral: "bg-foreground",
}

interface LessonExperienceProps {
  lesson: Lesson
  api?: Pick<
    WritingAppApi,
    | "saveLessonProgress"
    | "saveLessonAnswer"
    | "completeLesson"
    | "createAiFeedback"
  >
}

type WrittenStepResponses = Partial<Record<LessonStepId, string>>

export function LessonExperience({ lesson, api }: LessonExperienceProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [showExitDialog, setShowExitDialog] = React.useState(false)
  const [writtenResponses, setWrittenResponses] =
    React.useState<WrittenStepResponses>({})
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const apiRef = React.useRef(api ?? getBrowserWritingAppApi())

  const currentStep = lesson.steps[currentStepIndex] ?? lesson.steps[0]
  const progress = getLessonProgress(currentStepIndex, lesson.steps.length)

  const scrollToTop = React.useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const createAiFeedback = React.useCallback<WritingAppApi["createAiFeedback"]>(
    (input) => apiRef.current.createAiFeedback(input),
    []
  )

  const handleNext = React.useCallback(() => {
    setCurrentStepIndex((index) => {
      const nextIndex = Math.min(index + 1, lesson.steps.length - 1)
      const nextStep = lesson.steps[nextIndex]

      if (nextStep) {
        void apiRef.current.saveLessonProgress(lesson.id, {
          currentStepId: nextStep.id,
          stepOrder: nextStep.order,
        })
      }

      if (nextStep?.type === "COMPLETE") {
        void apiRef.current.completeLesson(lesson.id)
      }

      return nextIndex
    })
    scrollToTop()
  }, [lesson.id, lesson.steps, scrollToTop])

  const handleRevise = React.useCallback(
    (sourceStepId: LessonStepId) => {
      const writeStepIndex = lesson.steps.findIndex(
        (step) => step.id === sourceStepId
      )

      if (writeStepIndex >= 0) {
        setCurrentStepIndex(writeStepIndex)
        scrollToTop()
        return
      }

      const fallbackWriteStepIndex =
        findStepIndexByType(lesson.steps, "SHORT_WRITE") >= 0
          ? findStepIndexByType(lesson.steps, "SHORT_WRITE")
          : findStepIndexByType(lesson.steps, "LONG_WRITE")

      if (fallbackWriteStepIndex >= 0) {
        setCurrentStepIndex(fallbackWriteStepIndex)
        scrollToTop()
      }
    },
    [lesson.steps, scrollToTop]
  )

  const saveWrittenResponse = React.useCallback(
    (stepId: LessonStepId, text: string) => {
      setWrittenResponses((current) => ({
        ...current,
        [stepId]: text,
      }))
      void apiRef.current.saveLessonAnswer(lesson.id, {
        stepId,
        answer: text,
      })
    },
    [lesson.id]
  )

  const goToCourses = React.useCallback(() => {
    setCurrentStepIndex(0)
    setShowExitDialog(false)
    router.push("/app/courses")
  }, [router])

  const continueAfterComplete = React.useCallback(() => {
    if (lesson.nextLessonId) {
      router.push(`/app/lesson?lesson_id=${lesson.nextLessonId}`)
      return
    }

    router.push("/app/courses")
  }, [lesson.nextLessonId, router])

  React.useEffect(() => {
    setCurrentStepIndex(0)
    setWrittenResponses({})
    contentRef.current?.scrollTo({ top: 0 })
  }, [lesson.id])

  if (!currentStep) {
    return null
  }

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <LessonHeader
        progress={progress}
        lives={3}
        onExit={() => setShowExitDialog(true)}
      />
      <div ref={contentRef} className="h-svh overflow-y-auto pt-14">
        <LessonStepRenderer
          step={currentStep}
          lessonTitle={lesson.title}
          writtenResponses={writtenResponses}
          onNext={handleNext}
          onRevise={handleRevise}
          onSaveWrite={saveWrittenResponse}
          onHome={goToCourses}
          onContinue={continueAfterComplete}
          createAiFeedback={createAiFeedback}
          lessonId={lesson.id}
        />
      </div>
      <ExitLessonDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={goToCourses}
      />
    </div>
  )
}

function LessonHeader({
  progress,
  lives,
  onExit,
}: {
  progress: number
  lives: number
  onExit: () => void
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-border/50 bg-background px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="레슨 나가기"
        onClick={onExit}
      >
        <XIcon aria-hidden="true" />
      </Button>

      <div className="mx-4 flex-1">
        <ProgressBar
          value={progress}
          aria-label="레슨 진행률"
          className="gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-muted"
        />
      </div>

      <div
        className="flex shrink-0 items-center gap-1"
        aria-label={`${lives}개 남음`}
      >
        {["heart-1", "heart-2", "heart-3"].map((heartKey, index) => (
          <HeartIcon
            key={heartKey}
            className={cn(
              "size-4.5",
              index < lives
                ? "fill-destructive text-destructive"
                : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </header>
  )
}

function ExitLessonDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="p-6">
          <DialogTitle className="text-lg font-bold">
            레슨을 나가시겠어요?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            현재 진행 상황은 자동으로 저장됩니다. 나중에 이어서 학습할 수
            있어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-0 border-t border-border p-0 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            className="h-14 rounded-none border-r border-border"
            onClick={() => onOpenChange(false)}
          >
            계속 학습
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-14 rounded-none text-destructive hover:text-destructive"
            onClick={onConfirm}
          >
            나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LessonStepRenderer({
  step,
  lessonTitle,
  writtenResponses,
  onNext,
  onRevise,
  onSaveWrite,
  onHome,
  onContinue,
  createAiFeedback,
  lessonId,
}: {
  step: LessonStep
  lessonTitle: string
  writtenResponses: WrittenStepResponses
  onNext: () => void
  onRevise: (sourceStepId: LessonStepId) => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  onHome: () => void
  onContinue: () => void
  createAiFeedback: WritingAppApi["createAiFeedback"]
  lessonId: LessonId
}) {
  switch (step.type) {
    case "INTRO":
      return (
        <>
          <IntroStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>시작하기</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "CONCEPT":
      return (
        <>
          <ConceptStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>
              이해했어요
            </PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "READING_PASSAGE":
      return (
        <>
          <ReadingPassageStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>
              다 읽었어요
            </PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "EXAMPLE_REVEAL":
      return (
        <>
          <ExampleRevealStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>다음</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "COMPARE":
      return (
        <>
          <CompareStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>다음</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceStep content={step.content} onNext={onNext} />
    case "FILL_BLANK":
      return <FillBlankStep content={step.content} onNext={onNext} />
    case "WORD_SELECT":
      return <WordSelectStep content={step.content} onNext={onNext} />
    case "REORDER":
      return <ReorderStep content={step.content} onNext={onNext} />
    case "MATCH":
      return <MatchStep content={step.content} onNext={onNext} />
    case "CLASSIFY":
      return <ClassifyStep content={step.content} onNext={onNext} />
    case "SHORT_WRITE":
      return (
        <ShortWriteStep
          stepId={step.id}
          content={step.content}
          onNext={onNext}
          onSaveWrite={onSaveWrite}
          savedText={writtenResponses[step.id] ?? ""}
        />
      )
    case "LONG_WRITE":
      return (
        <LongWriteStep
          stepId={step.id}
          content={step.content}
          onNext={onNext}
          onSaveWrite={onSaveWrite}
          savedText={writtenResponses[step.id] ?? ""}
        />
      )
    case "AI_FEEDBACK":
      return (
        <AiFeedbackStep
          content={step.content}
          createAiFeedback={createAiFeedback}
          lessonId={lessonId}
          stepId={step.id}
          userWrite={writtenResponses[step.content.sourceStepId] ?? ""}
          onNext={onNext}
          onRevise={onRevise}
        />
      )
    case "REVISION":
      return <RevisionStep content={step.content} onNext={onNext} />
    case "CHECKLIST":
      return <ChecklistStep content={step.content} onNext={onNext} />
    case "REFLECTION":
      return <ReflectionStep content={step.content} onNext={onNext} />
    case "SUMMARY":
      return <SummaryStep content={step.content} onNext={onNext} />
    case "TRANSCRIBE":
      return <TranscribeStep content={step.content} onNext={onNext} />
    case "COMPLETE":
      return (
        <CompleteStep
          content={step.content}
          lessonTitle={lessonTitle}
          onHome={onHome}
          onContinue={onContinue}
        />
      )
  }
}

function StepFrame({
  children,
  centered = false,
}: {
  children: React.ReactNode
  centered?: boolean
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 px-5 pt-6 pb-28 duration-300">
      <div
        className={cn(
          lessonMaxWidthClassName,
          "flex flex-col gap-5",
          centered && "items-center text-center"
        )}
      >
        {children}
      </div>
    </section>
  )
}

function BottomActionBar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div
        className={cn(
          lessonMaxWidthClassName,
          "flex items-center gap-3",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

function PrimaryActionButton({
  children,
  disabled,
  onClick,
  className,
  tone = "primary",
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  className?: string
  tone?: "primary" | "info"
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      size="lg"
      onClick={onClick}
      className={cn(
        actionHeightClassName,
        "flex-1 rounded-full text-[15px] font-bold tracking-[0.08em] uppercase",
        tone === "info" && "bg-chart-2 text-white hover:bg-chart-2/85",
        className
      )}
    >
      {children}
    </Button>
  )
}

function SecondaryActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(actionHeightClassName, "shrink-0 px-4 font-semibold")}
    >
      {children}
    </Button>
  )
}

function IntroStep({ content }: { content: IntroContent }) {
  return (
    <StepFrame>
      <Badge
        variant="outline"
        className={cn(
          "w-fit border text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[content.tagTone].bg,
          toneClasses[content.tagTone].border,
          toneClasses[content.tagTone].text
        )}
      >
        {content.category}
      </Badge>
      <h1 className="m-0 text-3xl/10 font-bold tracking-normal">
        {content.title}
      </h1>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          이 레슨에서 배우는 것
        </p>
        <div className="flex flex-col gap-3">
          {content.bullets.map((bullet, index) => (
            <div
              key={bullet}
              className="animate-in fade-in slide-in-from-bottom-2 flex items-start gap-3 duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/15 text-primary">
                <SparklesIcon className="size-3" aria-hidden="true" />
              </span>
              <span className="text-sm/6 text-foreground">{bullet}</span>
            </div>
          ))}
        </div>
      </div>
      <Card variant="filled" className="rounded-xl bg-muted py-0">
        <CardContent className="grid grid-cols-3 px-0 py-4">
          <IntroStat
            value={`${content.estimatedMinutes}분`}
            label="예상 시간"
          />
          <IntroStat
            value={`${content.totalSteps}개`}
            label="학습 스텝"
            bordered
          />
          <IntroStat
            value={`${content.xpAvailable} XP`}
            label="획득 가능"
            bordered
          />
        </CardContent>
      </Card>
    </StepFrame>
  )
}

function IntroStat({
  value,
  label,
  bordered,
}: {
  value: string
  label: string
  bordered?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center",
        bordered && "border-l border-border/70"
      )}
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function ConceptStep({ content }: { content: ConceptContent }) {
  const [expandedTermIndex, setExpandedTermIndex] = React.useState<
    number | null
  >(null)

  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">{content.subtitle}</h2>
      <ParagraphMarkdown text={content.body} />
      {content.highlight ? (
        <ToneCallout
          tone={content.highlight.tone}
          icon={content.highlight.icon}
        >
          {content.highlight.text}
        </ToneCallout>
      ) : null}
      {content.keyTerms ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            핵심 용어
          </p>
          {content.keyTerms.map((term, index) => {
            const expanded = expandedTermIndex === index

            return (
              <div
                key={term.term}
                className="overflow-hidden rounded-xl border border-border/70"
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors",
                    expanded ? "bg-muted" : "bg-card hover:bg-muted/80"
                  )}
                  onClick={() =>
                    setExpandedTermIndex((current) =>
                      current === index ? null : index
                    )
                  }
                >
                  <span>{term.term}</span>
                  <span className="text-lg text-muted-foreground">
                    {expanded ? "-" : "+"}
                  </span>
                </button>
                {expanded ? (
                  <div className="bg-muted px-4 pt-1 pb-3 text-sm/6 text-muted-foreground">
                    {term.definition}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </StepFrame>
  )
}

function ReadingPassageStep({ content }: { content: ReadingPassageContent }) {
  return (
    <StepFrame>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted-foreground">
          {content.instruction}
        </p>
        <Badge variant="secondary" className="shrink-0">
          약 {content.estimatedReadMinutes}분
        </Badge>
      </div>
      {content.focusQuestion ? (
        <ToneCallout tone="warning" label="읽으면서 생각해보세요">
          {content.focusQuestion}
        </ToneCallout>
      ) : null}
      <article className="rounded-xl border border-border/70 bg-card p-5">
        <h3 className="m-0 border-b border-border/70 pb-3 text-base/6 font-bold">
          {content.title}
        </h3>
        <div className="mt-4">
          <ParagraphMarkdown text={content.text} />
        </div>
        {content.source ? (
          <p className="m-0 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            출처: {content.source}
          </p>
        ) : null}
      </article>
      {content.highlightEnabled ? (
        <p className="m-0 text-center text-xs text-muted-foreground">
          텍스트를 길게 눌러 하이라이트할 수 있어요
        </p>
      ) : null}
    </StepFrame>
  )
}

function ExampleRevealStep({ content }: { content: ExampleRevealContent }) {
  const [revealed, setRevealed] = React.useState(false)

  return (
    <StepFrame>
      <p className="m-0 text-sm text-muted-foreground">{content.instruction}</p>
      {content.bad ? (
        <TonePanel tone="danger" label={content.bad.label}>
          {content.bad.text}
        </TonePanel>
      ) : null}
      {!revealed ? (
        <Button
          type="button"
          variant="outline"
          className="h-14 w-full rounded-xl border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          onClick={() => setRevealed(true)}
        >
          <SparklesIcon data-icon="inline-start" />
          분석 보기
        </Button>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-4 duration-300">
          <TonePanel tone="primary" label={content.good.label}>
            {content.good.text}
          </TonePanel>
          <div className="rounded-xl border border-border/70 bg-muted p-4">
            <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              왜 다른가요?
            </p>
            <p className="m-0 text-sm/6">
              <InlineMarkdown text={content.analysis} />
            </p>
          </div>
        </div>
      )}
    </StepFrame>
  )
}

function CompareStep({ content }: { content: CompareContent }) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeVersion = content.versions[activeIndex] ?? content.versions[0]

  if (!activeVersion) {
    return null
  }

  return (
    <StepFrame>
      <p className="m-0 text-sm text-muted-foreground">{content.instruction}</p>
      <ToggleGroup
        value={[String(activeIndex)]}
        onValueChange={(nextValue) => {
          const nextIndex = Number(nextValue.at(-1))

          if (Number.isInteger(nextIndex)) {
            setActiveIndex(nextIndex)
          }
        }}
        className="grid w-full grid-cols-2 border-b border-border/70"
        variant="default"
        spacing={0}
      >
        {content.versions.map((version, index) => {
          const active = activeIndex === index

          return (
            <ToggleGroupItem
              key={version.label}
              value={String(index)}
              className={cn(
                "h-12 rounded-none border-b-2 border-transparent",
                active &&
                  cn(
                    "border-current bg-transparent",
                    toneClasses[version.tone].text
                  )
              )}
            >
              {version.label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <div
        className={cn(
          "animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-4 text-sm/6 duration-200",
          toneClasses[activeVersion.tone].bg,
          toneClasses[activeVersion.tone].border
        )}
      >
        {activeVersion.text}
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4">
        <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          분석
        </p>
        <p className="m-0 text-sm/6">{content.analysis}</p>
      </div>
      {content.discussionQuestion ? (
        <ToneCallout tone="info" label="생각해볼 점">
          {content.discussionQuestion}
        </ToneCallout>
      ) : null}
    </StepFrame>
  )
}

function MultipleChoiceStep({
  content,
  onNext,
}: {
  content: MultipleChoiceContent
  onNext: () => void
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState(false)
  const isCorrect = isSelectedChoiceCorrect(content.options, selectedId)

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      {content.context ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/6">
          {content.context}
        </div>
      ) : null}
      <h2 className="m-0 text-lg/7 font-bold">{content.question}</h2>
      <div className="flex flex-col gap-3">
        {content.options.map((option) => {
          const status = getChoiceStatus(option, selectedId, confirmed)

          return (
            <ChoiceOptionButton
              key={option.id}
              id={option.id}
              text={option.text}
              status={status}
              disabled={confirmed}
              onClick={() => setSelectedId(option.id)}
            />
          )
        })}
      </div>
      {confirmed ? (
        <FeedbackPanel tone={isCorrect ? "primary" : "danger"}>
          <p className="m-0 font-bold">{isCorrect ? "정답!" : "오답"}</p>
          <p className="m-0 text-sm/6 text-foreground">{content.explanation}</p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!selectedId} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ChoiceOptionButton({
  id,
  text,
  status,
  disabled,
  onClick,
}: {
  id: string
  text: string
  status: ChoiceStatus
  disabled: boolean
  onClick: () => void
}) {
  const tone =
    status === "correct" || status === "selected"
      ? "primary"
      : status === "incorrect"
        ? "danger"
        : "neutral"

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-4 text-left transition-colors",
        "hover:bg-muted disabled:cursor-default disabled:hover:bg-card",
        status !== "neutral" && toneClasses[tone].border
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          status === "neutral" && "bg-muted text-muted-foreground",
          status !== "neutral" &&
            cn(toneClasses[tone].bg, toneClasses[tone].text),
          (status === "correct" || status === "incorrect") &&
            cn(toneClasses[tone].solid, toneClasses[tone].solidText)
        )}
      >
        {status === "correct" ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : status === "incorrect" ? (
          <XIcon className="size-4" aria-hidden="true" />
        ) : (
          id
        )}
      </span>
      <span className="text-sm/6">{text}</span>
    </button>
  )
}

function FillBlankStep({
  content,
  onNext,
}: {
  content: FillBlankContent
  onNext: () => void
}) {
  const [blanks, setBlanks] = React.useState<BlankAssignments>({})
  const [confirmed, setConfirmed] = React.useState(false)
  const templateParts = React.useMemo(
    () => parseFillBlankTemplate(content.template),
    [content.template]
  )
  const blankById = React.useMemo(
    () => new Map(content.blanks.map((blank) => [blank.id, blank])),
    [content.blanks]
  )
  const usedWords = Object.values(blanks)
  const availableWords = content.wordBank.filter(
    (word) => !usedWords.includes(word)
  )
  const allFilled = content.blanks.every((blank) => blanks[blank.id])

  const fillNextBlank = (word: string) => {
    if (confirmed) {
      return
    }

    const nextBlank = content.blanks.find((blank) => !blanks[blank.id])

    if (nextBlank) {
      setBlanks((current) => ({
        ...current,
        [nextBlank.id]: word,
      }))
    }
  }

  const clearBlank = (blankId: string) => {
    if (confirmed) {
      return
    }

    setBlanks((current) => {
      const next = { ...current }
      delete next[blankId]

      return next
    })
  }

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          단어를 탭하여 빈칸에 넣고, 빈칸을 탭하면 취소됩니다.
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/8">
        {templateParts.map((part) => {
          if (part.type === "text") {
            return <span key={part.key}>{part.content}</span>
          }

          const blank = blankById.get(part.id)
          const value = blanks[part.id]
          const status = getBlankStatus({
            blankId: part.id,
            blankValue: value,
            correctAnswers: blank?.correctAnswers ?? [],
            confirmed,
            caseSensitive: content.caseSensitive,
          })

          return (
            <button
              key={part.id}
              type="button"
              className={cn(
                "mx-1 inline-flex min-w-16 items-center justify-center rounded-lg border px-3 py-0.5 text-sm font-semibold",
                getBlankStatusClass(status)
              )}
              onClick={() => clearBlank(part.id)}
            >
              {value || "_ _ _"}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          단어 선택
        </p>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word) => (
            <Button
              key={word}
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={confirmed}
              onClick={() => fillNextBlank(word)}
            >
              {word}
            </Button>
          ))}
          {usedWords.map((word) => (
            <Badge
              key={`used-${word}`}
              variant="secondary"
              className="h-9 px-4 text-sm line-through opacity-50"
            >
              {word}
            </Badge>
          ))}
        </div>
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">{content.explanation}</p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!allFilled} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function WordSelectStep({
  content,
  onNext,
}: {
  content: WordSelectContent
  onNext: () => void
}) {
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([])
  const [confirmed, setConfirmed] = React.useState(false)
  const parts = React.useMemo(
    () => parseMarkedText(content.markedText),
    [content.markedText]
  )

  const toggleSpan = (spanId: string) => {
    if (confirmed) {
      return
    }

    setSelectedIds((current) =>
      current.includes(spanId)
        ? current.filter((selectedId) => selectedId !== spanId)
        : [...current, spanId]
    )
  }

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          선택됨:{" "}
          <span className="font-bold text-primary">{selectedIds.length}</span>개
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/7">
        {parts.map((part) => {
          if (part.type === "text") {
            return <span key={part.id}>{part.content}</span>
          }

          const selected = selectedIds.includes(part.id)
          const correctAndSelected = confirmed && part.isCorrect && selected
          const incorrect = confirmed && selected && !part.isCorrect
          const missed = confirmed && !selected && part.isCorrect

          return (
            <button
              key={part.id}
              type="button"
              disabled={confirmed}
              className={cn(
                "rounded px-0.5 text-left transition-colors",
                selected && !confirmed && "bg-primary/25 text-primary",
                correctAndSelected && "bg-primary/25 text-primary",
                missed && "bg-primary/20 text-primary",
                incorrect && "bg-destructive/25 text-destructive"
              )}
              onClick={() => toggleSpan(part.id)}
            >
              {part.content}
            </button>
          )
        })}
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.globalExplanation}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={selectedIds.length < 1} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ReorderStep({
  content,
  onNext,
}: {
  content: ReorderContent
  onNext: () => void
}) {
  const [items, setItems] = React.useState(() =>
    getDeterministicOrder(content.items)
  )
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [confirmed, setConfirmed] = React.useState(false)

  const dropItem = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }

    setItems((current) => {
      const next = [...current]
      const [removed] = next.splice(draggingIndex, 1)

      if (removed) {
        next.splice(targetIndex, 0, removed)
      }

      return next
    })
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          드래그하여 순서를 바꾸세요.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const status = !confirmed
            ? "neutral"
            : item.correctOrder === index + 1
              ? "correct"
              : "incorrect"

          return (
            <div
              key={item.id}
              draggable={!confirmed}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors",
                !confirmed && "cursor-grab active:cursor-grabbing",
                dragOverIndex === index && "bg-muted",
                status === "correct" && "border-primary bg-primary/10",
                status === "incorrect" &&
                  "border-destructive bg-destructive/10",
                draggingIndex === index && "opacity-50"
              )}
              onDragStart={(event) => {
                setDraggingIndex(index)
                event.dataTransfer.effectAllowed = "move"
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverIndex(index)
              }}
              onDrop={(event) => {
                event.preventDefault()
                dropItem(index)
              }}
              onDragEnd={() => {
                setDraggingIndex(null)
                setDragOverIndex(null)
              }}
            >
              <GripVerticalIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 text-sm/6">{item.text}</span>
              {confirmed ? (
                <StatusMark
                  status={status === "correct" ? "correct" : "incorrect"}
                />
              ) : null}
            </div>
          )
        })}
      </div>
      {confirmed ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4">
          <p className="m-0 mb-2 text-sm font-bold text-muted-foreground">
            올바른 순서
          </p>
          <p className="m-0 text-sm/6">{content.explanation}</p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function MatchStep({
  content,
  onNext,
}: {
  content: MatchContent
  onNext: () => void
}) {
  const rightItems = React.useMemo(
    () =>
      content.shuffleRight
        ? getDeterministicOrder(content.pairs)
        : [...content.pairs],
    [content.pairs, content.shuffleRight]
  )
  const [selectedLeftId, setSelectedLeftId] = React.useState<string | null>(
    null
  )
  const [connections, setConnections] = React.useState<MatchConnections>({})
  const [confirmed, setConfirmed] = React.useState(false)
  const allConnected = content.pairs.every((pair) => connections[pair.id])

  const connectRight = (rightText: string) => {
    if (!selectedLeftId || confirmed) {
      return
    }

    setConnections((current) => ({
      ...current,
      [selectedLeftId]: rightText,
    }))
    setSelectedLeftId(null)
  }

  const getConnectionStatus = (pairId: string) => {
    if (!confirmed || !connections[pairId]) {
      return "neutral" as const
    }

    const pair = content.pairs.find((candidate) => candidate.id === pairId)

    return pair?.right === connections[pairId] ? "correct" : "incorrect"
  }

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          {selectedLeftId
            ? "오른쪽 항목을 탭하여 연결하세요"
            : "왼쪽 항목을 먼저 탭하세요"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {content.pairs.map((pair) => {
            const status = getConnectionStatus(pair.id)
            const selected = selectedLeftId === pair.id
            const connected = Boolean(connections[pair.id])

            return (
              <button
                key={pair.id}
                type="button"
                disabled={confirmed}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left text-sm font-semibold transition-colors",
                  selected && "border-primary bg-primary/10 text-primary",
                  connected && !confirmed && "border-chart-2 text-chart-2",
                  status === "correct" && "border-primary bg-primary/10",
                  status === "incorrect" &&
                    "border-destructive bg-destructive/10"
                )}
                onClick={() =>
                  setSelectedLeftId((current) =>
                    current === pair.id ? null : pair.id
                  )
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{pair.left}</span>
                  {connected && !confirmed ? (
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {confirmed && status !== "neutral" ? (
                    <StatusMark status={status} />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rightItems.map((pair) => {
            const connected = Object.values(connections).includes(pair.right)

            return (
              <button
                key={pair.id}
                type="button"
                disabled={confirmed || !selectedLeftId}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left text-sm transition-colors",
                  selectedLeftId && "hover:bg-muted",
                  connected && "border-chart-2 bg-chart-2/10 text-chart-2"
                )}
                onClick={() => connectRight(pair.right)}
              >
                {pair.right}
              </button>
            )
          })}
        </div>
      </div>
      {confirmed ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4">
          <p className="m-0 mb-2 text-sm font-bold text-muted-foreground">
            해설
          </p>
          <p className="m-0 text-sm/6">{content.explanation}</p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton
          disabled={!allConnected && !confirmed}
          onClick={submit}
        >
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ClassifyStep({
  content,
  onNext,
}: {
  content: ClassifyContent
  onNext: () => void
}) {
  const [assignments, setAssignments] = React.useState<ClassifyAssignments>({})
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  )
  const [confirmed, setConfirmed] = React.useState(false)
  const selectedItem = content.items.find((item) => item.id === selectedItemId)
  const unassignedItems = content.items.filter((item) => !assignments[item.id])
  const allAssigned = content.items.length === Object.keys(assignments).length

  const assignToCategory = (categoryId: string) => {
    if (!selectedItemId || confirmed) {
      return
    }

    setAssignments((current) => ({
      ...current,
      [selectedItemId]: categoryId,
    }))
    setSelectedItemId(null)
  }

  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          {selectedItem
            ? `"${selectedItem.text}" 선택됨 - 카테고리를 탭하세요`
            : "카드를 탭한 후 카테고리를 선택하세요"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {content.categories.map((category) => {
          const categoryItems = content.items.filter(
            (item) => assignments[item.id] === category.id
          )
          const target = selectedItemId !== null

          return (
            <button
              key={category.id}
              type="button"
              disabled={!target || confirmed}
              className={cn(
                "min-h-32 rounded-xl border-2 bg-card p-3 text-left transition-colors",
                target && toneClasses[category.tone].border,
                target && toneClasses[category.tone].bg
              )}
              onClick={() => assignToCategory(category.id)}
            >
              <span
                className={cn(
                  "mb-3 block text-center text-xs font-bold tracking-[0.08em] uppercase",
                  toneClasses[category.tone].text
                )}
              >
                {category.label}
              </span>
              <span className="flex min-h-16 flex-col gap-2">
                {categoryItems.map((item) => {
                  const status = getClassifyStatus({
                    correctCategoryId: item.correctCategoryId,
                    assignedCategoryId: assignments[item.id],
                    confirmed,
                  })

                  return (
                    <span
                      key={item.id}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs/5",
                        getClassifyItemClass(status)
                      )}
                    >
                      {item.text}
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          분류할 카드 {unassignedItems.length}개
        </p>
        <div className="flex flex-wrap gap-2">
          {unassignedItems.map((item) => {
            const selected = selectedItemId === item.id

            return (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                disabled={confirmed}
                className={cn(
                  "h-auto rounded-lg px-3 py-2 text-sm whitespace-normal",
                  selected && "border-primary bg-primary/10 text-primary"
                )}
                onClick={() =>
                  setSelectedItemId((current) =>
                    current === item.id ? null : item.id
                  )
                }
              >
                {item.text}
              </Button>
            )
          })}
        </div>
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.globalExplanation}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton
          disabled={!allAssigned && !confirmed}
          onClick={submit}
        >
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ShortWriteStep({
  stepId,
  content,
  onNext,
  onSaveWrite,
  savedText,
}: {
  stepId: LessonStepId
  content: ShortWriteContent
  onNext: () => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  savedText: string
}) {
  const [text, setText] = React.useState(savedText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showReference, setShowReference] = React.useState(false)
  const activeStepIdRef = React.useRef(stepId)
  const canSubmit = text.length >= content.minChars

  React.useEffect(() => {
    if (activeStepIdRef.current !== stepId) {
      activeStepIdRef.current = stepId
      setText(savedText)
      setSubmitted(false)
      setShowReference(false)
    }
  }, [savedText, stepId])

  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      onSaveWrite(stepId, text)

      if (content.showReferenceAfterSubmit) {
        setShowReference(true)
      }

      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">{content.prompt}</p>
      </div>
      {content.sourceText ? (
        <SourcePanel label="원문">{content.sourceText}</SourcePanel>
      ) : null}
      <WritingBox
        value={text}
        minChars={content.minChars}
        maxChars={content.maxChars}
        rows={5}
        readOnly={submitted}
        onChange={setText}
      />
      {showReference ? (
        <FeedbackPanel tone="primary">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-primary uppercase">
            참고 답안
          </p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.referenceAnswer}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        {!submitted && content.referenceAnswer ? (
          <SecondaryActionButton
            onClick={() => setShowReference((visible) => !visible)}
          >
            예시 보기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canSubmit} onClick={submit}>
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function LongWriteStep({
  stepId,
  content,
  onNext,
  onSaveWrite,
  savedText,
}: {
  stepId: LessonStepId
  content: LongWriteContent
  onNext: () => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  savedText: string
}) {
  const [text, setText] = React.useState(savedText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showGuide, setShowGuide] = React.useState(false)
  const [draftSaved, setDraftSaved] = React.useState(false)
  const activeStepIdRef = React.useRef(stepId)
  const canSubmit = text.length >= content.minChars
  const progress = Math.min((text.length / content.targetChars) * 100, 100)

  React.useEffect(() => {
    if (activeStepIdRef.current !== stepId) {
      activeStepIdRef.current = stepId
      setText(savedText)
      setSubmitted(false)
      setDraftSaved(false)
      setShowGuide(false)
    }
  }, [savedText, stepId])

  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      onSaveWrite(stepId, text)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-chart-3 uppercase">
          {content.instruction}
        </p>
        <h2 className="m-0 text-base/7 font-semibold">{content.topic}</h2>
      </div>
      {content.context ? (
        <div className="rounded-xl border border-border/70 bg-muted p-3 text-sm/6 text-muted-foreground">
          {content.context}
        </div>
      ) : null}
      {content.structureGuide ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-fit px-0 text-chart-2 hover:bg-transparent hover:text-chart-2"
            onClick={() => setShowGuide((visible) => !visible)}
          >
            {showGuide ? "▼" : "▶"} 구조 가이드
          </Button>
          {showGuide ? (
            <div className="flex flex-col gap-1 rounded-xl border border-chart-2/30 bg-chart-2/10 p-3">
              {content.structureGuide.map((guide) => (
                <p key={guide} className="m-0 text-sm/6 text-chart-2">
                  {guide}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <WritingBox
        value={text}
        minChars={content.minChars}
        maxChars={content.maxChars}
        rows={8}
        readOnly={submitted}
        onChange={(nextText) => {
          setText(nextText)
          setDraftSaved(false)
        }}
        targetChars={content.targetChars}
      />
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {draftSaved ? (
        <p className="m-0 text-xs text-primary">임시저장됨</p>
      ) : null}
      <BottomActionBar>
        {!submitted && content.draftSaveEnabled ? (
          <SecondaryActionButton
            onClick={() => {
              onSaveWrite(stepId, text)
              setDraftSaved(true)
            }}
          >
            임시저장
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canSubmit} onClick={submit}>
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function AiFeedbackStep({
  content,
  createAiFeedback,
  lessonId,
  stepId,
  userWrite,
  onNext,
  onRevise,
}: {
  content: AiFeedbackContent
  createAiFeedback: WritingAppApi["createAiFeedback"]
  lessonId: LessonId
  stepId: LessonStepId
  userWrite: string
  onNext: () => void
  onRevise: (sourceStepId: LessonStepId) => void
}) {
  const [loading, setLoading] = React.useState(true)
  const [feedback, setFeedback] = React.useState<AiFeedbackResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true

    async function loadFeedback() {
      setLoading(true)
      const result = await createAiFeedback({
        answer: userWrite || undefined,
        feedbackStepId: stepId,
        lessonId,
      })

      if (!active) {
        return
      }

      if (result.status === "ok") {
        setFeedback(result.value)
        setErrorMessage(null)
      } else {
        setFeedback(null)
        setErrorMessage(result.error.message)
      }
      setLoading(false)
    }

    void loadFeedback()

    return () => {
      active = false
    }
  }, [createAiFeedback, lessonId, stepId, userWrite])

  if (loading) {
    return (
      <StepFrame centered>
        <div className="flex flex-col items-center gap-4 py-16">
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-primary">
            <SparklesIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="m-0 font-semibold">AI가 글을 읽고 있어요...</p>
          <p className="m-0 text-sm text-muted-foreground">
            AI가 읽는 동안 - 좋은 글은 소리 내 읽었을 때 자연스럽습니다.
          </p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 animate-[lesson-progress-fill_2s_ease_forwards] rounded-full bg-primary" />
          </div>
        </div>
      </StepFrame>
    )
  }

  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">AI 피드백</h2>
      {errorMessage ? (
        <FeedbackPanel tone="danger">
          <p className="m-0 font-bold">피드백을 불러오지 못했습니다</p>
          <p className="m-0 text-sm/6 text-foreground">{errorMessage}</p>
        </FeedbackPanel>
      ) : null}
      {content.showScore && feedback ? (
        <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4">
          <div className="relative size-16">
            <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${feedback.score} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{feedback.score}</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-lg font-bold">전체 평가</p>
            <p className="m-0 text-sm text-muted-foreground">
              {feedback.summary}
            </p>
          </div>
        </div>
      ) : null}
      {feedback ? (
        <>
          <FeedbackList
            label="잘된 점"
            tone="primary"
            marker="✓"
            items={feedback.strengths}
          />
          <FeedbackList
            label="개선 포인트"
            tone="warning"
            marker="→"
            items={feedback.improvements}
          />
          <ToneCallout tone="info" label="다음 행동">
            {feedback.nextAction}
          </ToneCallout>
        </>
      ) : null}
      {userWrite ? (
        <SourcePanel label="내가 쓴 글">{userWrite}</SourcePanel>
      ) : null}
      <BottomActionBar>
        {content.allowRevision ? (
          <SecondaryActionButton onClick={() => onRevise(content.sourceStepId)}>
            다시 쓰기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton onClick={onNext}>다음으로</PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function RevisionStep({
  content,
  onNext,
}: {
  content: RevisionContent
  onNext: () => void
}) {
  const [text, setText] = React.useState(content.originalText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showHints, setShowHints] = React.useState(false)
  const hasChanged = text !== content.originalText

  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      <ToneCallout tone="warning" label="퇴고 과제">
        {content.revisionTask}
      </ToneCallout>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-fit px-0 text-chart-2 hover:bg-transparent hover:text-chart-2"
          onClick={() => setShowHints((visible) => !visible)}
        >
          {showHints ? "▼" : "▶"} 힌트 보기
        </Button>
        {showHints ? (
          <div className="flex flex-col gap-2 rounded-xl border border-chart-2/30 bg-chart-2/10 p-3">
            {content.hints.map((hint) => (
              <p key={hint} className="m-0 text-sm/6 text-chart-2">
                {hint}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <Textarea
        value={text}
        readOnly={submitted}
        rows={6}
        className={cn(
          "min-h-40 border bg-card text-sm/7",
          hasChanged && "border-primary"
        )}
        onChange={(event) => setText(event.target.value)}
      />
      {hasChanged && !submitted ? (
        <p className="m-0 text-xs text-primary">수정 중...</p>
      ) : null}
      {submitted ? (
        <FeedbackPanel tone="primary">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-primary uppercase">
            모범 퇴고 예시
          </p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.referenceRevision}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        {hasChanged && !submitted ? (
          <SecondaryActionButton onClick={() => setText(content.originalText)}>
            초기화
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton
          disabled={!hasChanged && !submitted}
          onClick={submit}
        >
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ChecklistStep({
  content,
  onNext,
}: {
  content: ChecklistContent
  onNext: () => void
}) {
  const [checkedIds, setCheckedIds] = React.useState<readonly string[]>([])
  const progress = Math.round((checkedIds.length / content.items.length) * 100)
  const canComplete = getChecklistComplete({
    checkedCount: checkedIds.length,
    totalCount: content.items.length,
    completionMode: content.completionMode,
    minimumChecks: content.minimumChecks,
  })

  const toggleCheck = (itemId: string) => {
    setCheckedIds((current) =>
      current.includes(itemId)
        ? current.filter((checkedId) => checkedId !== itemId)
        : [...current, itemId]
    )
  }

  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {checkedIds.length} / {content.items.length} 완료
          </span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {content.items.map((item) => {
          const checked = checkedIds.includes(item.id)

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                checked && "border-primary bg-primary/10"
              )}
              onClick={() => toggleCheck(item.id)}
            >
              <Checkbox checked={checked} readOnly aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm/6">{item.text}</span>
                {item.required ? (
                  <span className="text-xs text-chart-3">필수</span>
                ) : null}
                {item.tip && checked ? (
                  <span className="text-xs/5 text-muted-foreground">
                    {item.tip}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
      <BottomActionBar>
        <PrimaryActionButton disabled={!canComplete} onClick={onNext}>
          완료
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ReflectionStep({
  content,
  onNext,
}: {
  content: ReflectionContent
  onNext: () => void
}) {
  const [text, setText] = React.useState("")
  const canRecord = text.trim().length > 0

  return (
    <StepFrame>
      <p className="m-0 text-xs font-bold tracking-[0.08em] text-chart-2 uppercase">
        성찰 기록
      </p>
      <h2 className="m-0 text-xl/8 font-bold">{content.question}</h2>
      {content.context ? (
        <p className="m-0 text-sm/6 text-muted-foreground">{content.context}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {content.promptStarters.map((starter) => (
          <Button
            key={starter}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-chart-2/30 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15 hover:text-chart-2"
            onClick={() => setText((current) => current || starter)}
          >
            {starter}
          </Button>
        ))}
      </div>
      <Textarea
        value={text}
        rows={6}
        placeholder="솔직하게 적어보세요. 정답이 없어요."
        className="min-h-40 border bg-card text-sm/7 focus-visible:border-chart-2 focus-visible:ring-chart-2/30"
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-chart-2">📓</span>
        <p className="m-0 text-xs text-muted-foreground">
          이 기록은 내 학습 일지에 저장됩니다.
        </p>
      </div>
      <BottomActionBar>
        {content.isSkippable ? (
          <SecondaryActionButton onClick={onNext}>
            건너뛰기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canRecord} onClick={onNext} tone="info">
          기록하기
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function SummaryStep({
  content,
  onNext,
}: {
  content: SummaryContent
  onNext: () => void
}) {
  const [sharing, setSharing] = React.useState(false)

  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">오늘 배운 것</h2>
      <div className="flex flex-col gap-4">
        {content.points.map((point, index) => (
          <div
            key={point.number}
            className="animate-in fade-in slide-in-from-bottom-2 flex gap-4 rounded-xl border border-border/70 bg-card p-4 duration-300"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg font-bold text-primary">
              {point.icon || point.number}
            </span>
            <p className="m-0 mt-0.5 text-sm/6">{point.text}</p>
          </div>
        ))}
      </div>
      {content.nextLesson ? (
        <ToneCallout tone="info" label="다음 레슨">
          <span className="block font-semibold text-foreground">
            {content.nextLesson.title}
          </span>
          {content.nextLesson.description ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {content.nextLesson.description}
            </span>
          ) : null}
        </ToneCallout>
      ) : null}
      {sharing ? (
        <p className="m-0 text-sm text-primary">공유 문구가 준비됐어요.</p>
      ) : null}
      <BottomActionBar>
        {content.shareableQuote ? (
          <SecondaryActionButton onClick={() => setSharing(true)}>
            공유하기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton onClick={onNext}>
          다음 레슨으로
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function TranscribeStep({
  content,
  onNext,
}: {
  content: TranscribeContent
  onNext: () => void
}) {
  const [text, setText] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const matchRate = getMatchRate({
    sourceText: content.sourceText,
    userText: text,
    caseSensitive: content.caseSensitive,
    punctuationSensitive: content.punctuationSensitive,
  })
  const matchTone =
    matchRate >= 90 ? "primary" : matchRate >= 60 ? "warning" : "danger"

  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      return
    }

    onNext()
  }

  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      {content.focusNote ? (
        <ToneCallout tone="warning" label="포인트">
          {content.focusNote}
        </ToneCallout>
      ) : null}
      <SourcePanel
        label="원문"
        footer={content.source ? `출처: ${content.source}` : undefined}
      >
        {content.sourceText}
      </SourcePanel>
      <Textarea
        value={text}
        readOnly={submitted}
        rows={5}
        placeholder="원문을 보면서 그대로 따라 써보세요..."
        className={cn(
          "min-h-32 border bg-card text-sm/7",
          text && "border-primary"
        )}
        onChange={(event) => setText(event.target.value)}
      />
      {content.showMatchRate && text.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">일치율</span>
            <span
              className={cn("text-xs font-bold", toneClasses[matchTone].text)}
            >
              {matchRate}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                toneClasses[matchTone].solid
              )}
              style={{ width: `${matchRate}%` }}
            />
          </div>
        </div>
      ) : null}
      {submitted ? (
        <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 duration-300">
          <TonePanel tone="primary" label="원문">
            {content.sourceText}
          </TonePanel>
          <TonePanel tone="info" label="내가 쓴 글">
            {text}
          </TonePanel>
          <p
            className={cn(
              "m-0 text-center text-sm font-bold",
              toneClasses[matchTone].text
            )}
          >
            최종 일치율: {matchRate}%
          </p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!text} onClick={submit}>
          {submitted ? "다음" : "완료"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function CompleteStep({
  content,
  lessonTitle,
  onHome,
  onContinue,
}: {
  content: CompleteContent
  lessonTitle: string
  onHome: () => void
  onContinue: () => void
}) {
  const { xp, showConfetti, confettiPieces } = useCompleteCelebration(
    content.xpEarned
  )

  return (
    <StepFrame centered>
      {showConfetti
        ? confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={cn(
                "fixed top-[-20px] rounded-sm animate-[lesson-confetti_3s_ease-in_forwards]",
                confettiToneClasses[piece.tone]
              )}
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
              }}
            />
          ))
        : null}
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="text-6xl">🎉</div>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl/10 font-bold">레슨 완료!</h1>
          <p className="m-0 text-sm text-muted-foreground">
            {lessonTitle} 마스터!
          </p>
        </div>
        <div className="animate-in zoom-in-95 inline-flex items-center gap-2 rounded-full border-2 border-primary bg-primary/15 px-8 py-4 duration-500">
          <span className="text-4xl font-bold text-primary">+{xp}</span>
          <span className="text-xl font-bold">XP</span>
        </div>
        {content.showStreak ? (
          <div className="animate-[lesson-pulse_2s_infinite] inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-bold">7일 연속 학습 중</span>
          </div>
        ) : null}
        <div className="w-full rounded-2xl border border-border/70 bg-card p-5 text-left">
          <p className="m-0 mb-4 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            이번 레슨 요약
          </p>
          <div className="flex flex-col gap-3">
            {content.lessonStats.correctRate !== undefined ? (
              <SummaryMetric
                label="정답률"
                value={`${content.lessonStats.correctRate}%`}
                progress={content.lessonStats.correctRate}
              />
            ) : null}
            {content.lessonStats.writingCount !== undefined ? (
              <SummaryMetric
                label="글쓰기 완료"
                value={`✦ ${content.lessonStats.writingCount}개`}
              />
            ) : null}
            {content.lessonStats.aiFeedbackCount !== undefined ? (
              <SummaryMetric
                label="AI 피드백"
                value={`✦ ${content.lessonStats.aiFeedbackCount}회`}
              />
            ) : null}
          </div>
        </div>
      </div>
      <BottomActionBar>
        <SecondaryActionButton onClick={onHome}>홈으로</SecondaryActionButton>
        <PrimaryActionButton onClick={onContinue}>계속하기</PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}

function ToneCallout({
  tone,
  label,
  icon,
  children,
}: {
  tone: LessonTone
  label?: string
  icon?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        toneClasses[tone].bg,
        toneClasses[tone].border
      )}
    >
      {icon ? <span className="shrink-0 text-xl">{icon}</span> : null}
      <div className="flex min-w-0 flex-col gap-1">
        {label ? (
          <p
            className={cn(
              "m-0 text-xs font-bold tracking-[0.08em] uppercase",
              toneClasses[tone].text
            )}
          >
            {label}
          </p>
        ) : null}
        <div className={cn("text-sm/6", toneClasses[tone].text)}>
          {children}
        </div>
      </div>
    </div>
  )
}

function TonePanel({
  tone,
  label,
  children,
}: {
  tone: LessonTone
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        toneClasses[tone].bg,
        toneClasses[tone].border
      )}
    >
      <p
        className={cn(
          "m-0 mb-2 text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[tone].text
        )}
      >
        {label}
      </p>
      <p className="m-0 text-sm/6">{children}</p>
    </div>
  )
}

function FeedbackPanel({
  tone,
  children,
}: {
  tone: LessonTone
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-1 rounded-xl border p-4 duration-300",
        toneClasses[tone].bg,
        toneClasses[tone].border,
        toneClasses[tone].text
      )}
    >
      {children}
    </div>
  )
}

function FeedbackList({
  label,
  tone,
  marker,
  items,
}: {
  label: string
  tone: LessonTone
  marker: string
  items: readonly string[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className={cn(
          "m-0 text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[tone].text
        )}
      >
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              "flex gap-3 rounded-xl border p-3",
              toneClasses[tone].bg,
              toneClasses[tone].border
            )}
          >
            <span className={cn("shrink-0 text-sm", toneClasses[tone].text)}>
              {marker}
            </span>
            <p className="m-0 text-sm/6 text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourcePanel({
  label,
  footer,
  children,
}: {
  label: string
  footer?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted p-4">
      <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="m-0 text-sm/6 italic">{children}</p>
      {footer ? (
        <p className="m-0 mt-3 border-t border-border/70 pt-2 text-xs text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </div>
  )
}

function WritingBox({
  value,
  minChars,
  maxChars,
  targetChars,
  rows,
  readOnly,
  onChange,
}: {
  value: string
  minChars: number
  maxChars: number
  targetChars?: number
  rows: number
  readOnly: boolean
  onChange: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxChars}
        placeholder="여기에 작성하세요..."
        className={cn(
          "border bg-card text-sm/7",
          value.length > 0 && "border-primary"
        )}
        onChange={(event) => {
          if (!readOnly) {
            onChange(event.target.value)
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {value.length > 0 && value.length < minChars ? (
            <span className="text-chart-3">
              최소 {minChars}자 이상 작성하세요
            </span>
          ) : targetChars ? (
            <span>
              목표: {value.length} / {targetChars}자
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            value.length >= minChars ? "text-primary" : "text-muted-foreground"
          )}
        >
          {value.length} / {maxChars}
        </span>
      </div>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  progress,
}: {
  label: string
  value: string
  progress?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-bold">
        {progress !== undefined ? (
          <span className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </span>
        ) : null}
        {value}
      </span>
    </div>
  )
}

function InlineMarkdown({
  text,
  strongClassName = "text-primary font-bold",
}: {
  text: string
  strongClassName?: string
}) {
  return (
    <>
      {splitMarkdownEmphasis(text).map((segment) =>
        segment.emphasized ? (
          <strong key={segment.id} className={strongClassName}>
            {segment.text}
          </strong>
        ) : (
          <React.Fragment key={segment.id}>{segment.text}</React.Fragment>
        )
      )}
    </>
  )
}

function ParagraphMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3">
      {splitParagraphs(text).map((paragraph) => (
        <p key={paragraph} className="m-0 text-sm/6">
          <InlineMarkdown text={paragraph} />
        </p>
      ))}
    </div>
  )
}

function StatusMark({ status }: { status: "correct" | "incorrect" }) {
  return (
    <span
      className={cn(
        "shrink-0 text-xs font-bold",
        status === "correct" ? "text-primary" : "text-destructive"
      )}
    >
      {status === "correct" ? "✓" : "✗"}
    </span>
  )
}

function getBlankStatusClass(status: ReturnType<typeof getBlankStatus>) {
  if (status === "correct") {
    return "border-primary bg-primary/10 text-primary"
  }

  if (status === "incorrect") {
    return "border-destructive bg-destructive/10 text-destructive"
  }

  if (status === "filled") {
    return "border-primary bg-primary/10 text-primary"
  }

  return "border-border bg-card text-muted-foreground"
}

function getClassifyItemClass(status: ClassifyStatus) {
  if (status === "correct") {
    return "border-primary bg-primary/10 text-foreground"
  }

  if (status === "incorrect") {
    return "border-destructive bg-destructive/10 text-foreground"
  }

  return "border-border bg-muted text-foreground"
}

function useCompleteCelebration(xpEarned: number) {
  const [xp, setXp] = React.useState(0)
  const [showConfetti, setShowConfetti] = React.useState(false)
  const confettiPieces = React.useMemo(() => createConfettiPieces(24), [])

  React.useEffect(() => {
    setShowConfetti(true)
    let animationFrame = 0
    let start: number | null = null
    const duration = 1200

    const step = (timestamp: number) => {
      start ??= timestamp

      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setXp(Math.floor(eased * xpEarned))

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step)
      }
    }

    animationFrame = window.requestAnimationFrame(step)
    const timer = window.setTimeout(() => setShowConfetti(false), 4000)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timer)
    }
  }, [xpEarned])

  return { xp, showConfetti, confettiPieces }
}
