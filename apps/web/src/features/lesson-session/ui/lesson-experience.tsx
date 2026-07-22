"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import { LessonActiveScreen } from "@/features/lesson-session/ui/lesson-active-screen"
import { LessonCompleteScreen } from "@/features/lesson-session/ui/lesson-complete-screen"
import { LessonStartScreen } from "@/features/lesson-session/ui/lesson-start-screen"
import { useLessonSession } from "@/features/lesson-session/hooks/use-lesson-session"
import type { LearnerLesson as Lesson } from "@workspace/contracts/learning/learner-content"
import {
  getBrowserLessonSessionApi,
  type LessonSessionApi,
} from "@/features/lesson-session/api/lesson-session-api"

type LessonExperienceProps = {
  readonly api?: LessonSessionApi
  readonly lesson: Lesson
  readonly learnerId: string
}

export function LessonExperience(props: LessonExperienceProps) {
  return <LessonExperienceSession key={props.lesson.id} {...props} />
}

function LessonExperienceSession({
  api,
  lesson,
  learnerId,
}: LessonExperienceProps) {
  const router = useRouter()
  const contentRef = useRef<HTMLElement>(null)
  const [showExit, setShowExit] = useState(false)
  const resolvedApi = useMemo(() => api ?? getBrowserLessonSessionApi(), [api])
  const session = useLessonSession({
    api: resolvedApi,
    lesson,
  })

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
        checked={session.checked}
        completeError={session.completeError}
        contentRef={contentRef}
        currentStep={session.currentStep}
        currentStepIndex={session.currentStepIndex}
        isCompleting={session.isCompleting}
        isSavingProgress={session.isSavingProgress}
        isReady={session.isReady}
        lesson={lesson}
        learnerId={learnerId}
        onAiFeedbackRequest={session.requestAiFeedback}
        onAnswerChange={session.saveAnswer}
        onAnswerPayloadChange={session.setAnswerPayload}
        onCancelExit={() => setShowExit(false)}
        onConfirmExit={() => {
          setShowExit(false)
          router.push(`/app/courses/${lesson.courseId}`)
        }}
        onExit={() => setShowExit(true)}
        onSubmitCurrentStep={() => void session.submitCurrentStep()}
        progress={session.progress}
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
