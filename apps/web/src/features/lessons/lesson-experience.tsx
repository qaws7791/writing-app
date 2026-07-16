"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { useRouter } from "next/navigation"

import {
  LessonActiveScreen,
  LessonCompleteScreen,
  LessonStartScreen,
} from "@/features/lessons/lesson-experience-screens"
import { useLessonSession } from "@/features/lessons/use-lesson-session"
import type { LearnerLesson as Lesson } from "@workspace/contracts/learning"
import { getBrowserLearnerSessionToken } from "@/lib/auth/session-token"
import { getBrowserWritingAppApi } from "@/lib/api/get-browser-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"

type LessonExperienceProps = {
  readonly api?: WritingAppApi
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
  const resolvedApi = useMemo(
    () =>
      api ??
      getBrowserWritingAppApi({
        tokenProvider: getBrowserLearnerSessionToken,
      }),
    [api]
  )
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
