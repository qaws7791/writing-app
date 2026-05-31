"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { XIcon } from "@workspace/ui/components/icons"

import {
  findStepIndexByType,
  getLessonProgress,
} from "@/features/lessons/lesson-logic"
import {
  LessonStepRenderer,
  type WrittenStepResponses,
} from "@/features/lessons/lesson-step-renderer"
import type { Lesson, LessonStepId } from "@/features/lessons/lesson-types"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

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
  onExit,
}: {
  progress: number
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
