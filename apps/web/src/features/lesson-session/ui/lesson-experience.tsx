"use client"

import { useEffect, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import { LessonActiveScreen } from "@/features/lesson-session/ui/lesson-active-screen"
import { LessonCompleteScreen } from "@/features/lesson-session/ui/lesson-complete-screen"
import { LessonStartScreen } from "@/features/lesson-session/ui/lesson-start-screen"
import { useLessonSession } from "@/features/lesson-session/hooks/use-lesson-session"
import type { LearnerLessonDto as Lesson } from "@/shared/http/learner-api-client"

type LessonExperienceProps = {
  readonly lesson: Lesson
}

export function LessonExperience(props: LessonExperienceProps) {
  return <LessonExperienceSession key={props.lesson.id} {...props} />
}

function LessonExperienceSession({ lesson }: LessonExperienceProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLElement>(null)
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
        aiFeedbackDraftText={session.aiFeedbackDraftText}
        answerError={session.answerError}
        answerPayload={session.currentAnswerPayload}
        checked={session.checked}
        completeError={session.completeError}
        contentRef={contentRef}
        currentDraftStatus={session.currentDraftStatus}
        currentStep={session.currentStep}
        currentStepIndex={session.currentStepIndex}
        isReady={session.isReady}
        isSubmitting={session.isSubmitting}
        lesson={lesson}
        onAiFeedbackRequest={session.requestAiFeedback}
        onAiFeedbackSkip={session.skipAiFeedback}
        onAnswerPayloadChange={session.saveAnswer}
        onCancelExit={() => setShowExit(false)}
        onConfirmExit={() => {
          void (async () => {
            await session.flushDrafts()
            setShowExit(false)
            router.push(`/app/courses/${lesson.courseId}`)
          })()
        }}
        onDraftFlush={() => void session.flushCurrentDraft()}
        onExit={() => {
          void session.flushCurrentDraft()
          setShowExit(true)
        }}
        onRetryDraft={() => void session.retryDraftSync()}
        onRetryLocalDraft={session.retryLocalDraft}
        onSubmitCurrentStep={() => void session.submitCurrentStep()}
        onUseServerDraft={session.useServerDraft}
        progress={session.progress}
        renderRevision={session.renderRevision}
        showExit={showExit}
        visibleStepNumber={session.visibleStepNumber}
      />
    )
  }

  return (
    <LessonStartScreen
      canStart={session.canStart}
      isSavingStart={session.isSavingStart}
      lesson={lesson}
      onExit={() => router.push(`/app/courses/${lesson.courseId}`)}
      onStart={() => void session.startLesson()}
      startError={session.startError}
    />
  )
}

function scrollWindowToTop() {
  if (navigator.userAgent.toLowerCase().includes("jsdom")) {
    return
  }

  window.scrollTo(0, 0)
}
