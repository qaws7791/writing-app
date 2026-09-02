"use client"

import { useEffect, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import { LessonActiveScreen } from "@/features/lesson-session/ui/lesson-active-screen"
import { LessonCompleteScreen } from "@/features/lesson-session/ui/lesson-complete-screen"
import { useLessonSession } from "@/features/lesson-session/hooks/use-lesson-session"
import { getLessonStep } from "@/features/lesson-session/model/lesson-logic"
import type { Lesson } from "@/features/lesson-session/model/lesson-view-model"
import { useIsHydrated } from "@/shared/hooks/use-is-hydrated"

type LessonExperienceProps = {
  readonly lesson: Lesson
}

export function LessonExperience(props: LessonExperienceProps) {
  return <LessonExperienceSession key={props.lesson.id} {...props} />
}

function LessonExperienceSession({ lesson }: LessonExperienceProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLElement>(null)
  const isHydrated = useIsHydrated()
  const [exitError, setExitError] = useState<null | string>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const session = useLessonSession({ lesson })
  const { hasStarted, isSavingStart, startError, startLesson } = session

  useEffect(() => {
    if (!isHydrated) return
    if (lesson.learning.status !== "not_started") return
    if (hasStarted || isSavingStart) return
    if (startError !== null) return

    void startLesson()
  }, [
    isHydrated,
    lesson.learning.status,
    hasStarted,
    isSavingStart,
    startError,
    startLesson,
  ])

  useEffect(() => {
    if (!session.hasStarted) {
      return
    }

    contentRef.current?.scrollTo?.({ top: 0 })
    scrollWindowToTop()
  }, [session.currentStepIndex, session.hasStarted])

  if (session.isComplete) {
    return (
      <LessonCompleteScreen
        completion={session.completion}
        lesson={lesson}
        onCourse={() => router.push(`/app/courses/${lesson.courseId}`)}
        onNext={(nextLessonId) =>
          router.push(
            `/app/lesson?lesson_id=${encodeURIComponent(nextLessonId)}`
          )
        }
      />
    )
  }

  const activeStep = session.currentStep ?? getLessonStep(lesson, 0)
  if (activeStep === null) {
    return null
  }

  const isBootstrapping = !session.hasStarted

  return (
    <LessonActiveScreen
      answerError={session.answerError}
      answerPayload={session.currentAnswerPayload}
      checked={session.checked}
      completeError={session.completeError}
      contentRef={contentRef}
      currentStep={activeStep}
      currentStepIndex={session.currentStepIndex}
      exitError={exitError}
      isReady={!isBootstrapping && session.isReady}
      isLeaving={isLeaving}
      isSubmitting={session.isSubmitting}
      lesson={lesson}
      onAnswerPayloadChange={session.saveAnswer}
      onCancelExit={() => {
        setExitError(null)
        setShowExit(false)
      }}
      onConfirmExit={() => {
        void (async () => {
          if (isLeaving) return
          setExitError(null)
          setIsLeaving(true)
          const result = await session.prepareToLeave()
          if (result.status === "blocked") {
            setExitError(
              "지금은 나갈 수 없어요. 작성한 내용은 그대로 있어요. 잠시 후 다시 시도해 주세요."
            )
            setIsLeaving(false)
            return
          }
          setShowExit(false)
          router.push(`/app/courses/${lesson.courseId}`)
        })()
      }}
      onDraftFlush={() => void session.flushCurrentDraft()}
      onExit={() => {
        setExitError(null)
        setShowExit(true)
      }}
      onContinueLessonStep={() => void session.continueLessonStep()}
      onSubmitCurrentStep={() => void session.submitCurrentStep()}
      progress={session.progress}
      renderRevision={session.renderRevision}
      sessionBootstrap={
        isBootstrapping
          ? {
              error: session.startError,
              isStarting: session.isSavingStart,
              onRetry: () => void session.startLesson(),
            }
          : undefined
      }
      showExit={showExit}
      visibleStepNumber={session.visibleStepNumber}
    />
  )
}

function scrollWindowToTop() {
  window.scrollTo(0, 0)
}
