"use client"

import { useEffect, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import { LessonActiveScreen } from "@/features/lesson-session/ui/lesson-active-screen"
import { LessonCompleteScreen } from "@/features/lesson-session/ui/lesson-complete-screen"
import { LessonStartScreen } from "@/features/lesson-session/ui/lesson-start-screen"
import { useLessonSession } from "@/features/lesson-session/hooks/use-lesson-session"
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

  if (session.hasStarted && session.currentStep !== null) {
    return (
      <LessonActiveScreen
        answerError={session.answerError}
        answerPayload={session.currentAnswerPayload}
        checked={session.checked}
        completeError={session.completeError}
        contentRef={contentRef}
        currentStep={session.currentStep}
        currentStepIndex={session.currentStepIndex}
        exitError={exitError}
        isReady={session.isReady}
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
        onContinueLessonStep={() => session.continueLessonStep()}
        onRetryLessonStep={() => session.retryLessonStep()}
        onSkipIncorrectLessonStep={() => void session.skipIncorrectLessonStep()}
        onSubmitCurrentStep={() => void session.submitCurrentStep()}
        progress={session.progress}
        renderRevision={session.renderRevision}
        showExit={showExit}
        visibleStepNumber={session.visibleStepNumber}
      />
    )
  }

  return (
    <LessonStartScreen
      isInteractive={isHydrated}
      isSavingStart={session.isSavingStart}
      lesson={lesson}
      onExit={() => router.push(`/app/courses/${lesson.courseId}`)}
      onStart={() => void session.startLesson()}
      startError={session.startError}
    />
  )
}

function scrollWindowToTop() {
  window.scrollTo(0, 0)
}
