"use client"

import type {
  Lesson as LessonViewModel,
  LessonCompleteStepResult,
} from "@/features/lesson-session/model/lesson-view-model"
import { CheckCircleIcon } from "@workspace/ui/components/icons/authentication-icons"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Insight,
  InsightEyebrow,
  InsightItem,
  InsightList,
} from "@workspace/ui/components/learning/insight"
import {
  Lesson,
  LessonBody,
  LessonComplete,
  LessonCompleteDescription,
  LessonCompleteTitle,
} from "@workspace/ui/components/learning/lesson"

type LessonCompletionTransition = Extract<
  LessonCompleteStepResult,
  { readonly status: "lesson_completed" }
>

export function LessonCompleteScreen({
  completion,
  lesson,
  onCourse,
  onNext,
}: {
  readonly completion: LessonCompletionTransition | null
  readonly lesson: LessonViewModel
  readonly onCourse: () => void
  readonly onNext: (nextLessonId: string) => void
}) {
  const nextLesson = completion?.courseLearning.nextLesson ?? null

  return (
    <div className="fixed inset-0 z-50 h-dvh overflow-hidden bg-background text-foreground">
      <Lesson className="h-full">
        <LessonBody className="overflow-y-auto">
          <LessonComplete className="my-auto motion-safe:animate-drift-in">
            <div
              aria-label="완료"
              className="relative flex size-24 items-center justify-center"
              role="img"
            >
              <span
                aria-hidden
                className="bg-success/50 absolute top-1 left-2 size-2 rounded-full motion-safe:animate-breathe"
              />
              <span
                aria-hidden
                className="bg-success/40 absolute top-3 right-1 size-1.5 rounded-full motion-safe:animate-breathe"
              />
              <span
                aria-hidden
                className="bg-success/35 absolute bottom-2 left-4 size-1.5 rounded-full motion-safe:animate-breathe"
              />
              <span
                aria-hidden
                className="bg-success/45 absolute right-3 bottom-1 size-2 rounded-full motion-safe:animate-breathe"
              />
              <CheckCircleIcon aria-hidden className="text-success size-16" />
            </div>
            <p className="text-success text-sm font-medium">
              {`${lesson.steps.length}개 활동 완료`}
            </p>
            <LessonCompleteTitle>
              <h1>레슨을 완료했어요!</h1>
            </LessonCompleteTitle>
            <LessonCompleteDescription>
              {lesson.title}
            </LessonCompleteDescription>

            {lesson.summary.length === 0 ? null : (
              <Insight className="w-full text-left" tone="neutral">
                <InsightEyebrow>이번 레슨 요약</InsightEyebrow>
                <InsightList>
                  {lesson.summary.map((point) => (
                    <InsightItem key={point}>{point}</InsightItem>
                  ))}
                </InsightList>
              </Insight>
            )}

            <div className="flex w-full flex-col gap-3">
              {nextLesson === null ? (
                <Button className="w-full" onClick={onCourse} size="lg">
                  코스로 돌아가기
                </Button>
              ) : (
                <>
                  <p className="w-full text-left text-sm font-medium leading-6 text-foreground">
                    <span className="block">다음 레슨</span>
                    <span className="mt-1 block">{nextLesson.title}</span>
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => onNext(nextLesson.id)}
                    size="lg"
                  >
                    다음 레슨
                  </Button>
                  <Button
                    className="w-full"
                    onClick={onCourse}
                    size="lg"
                    variant="ghost"
                  >
                    코스로 돌아가기
                  </Button>
                </>
              )}
            </div>
          </LessonComplete>
        </LessonBody>
      </Lesson>
    </div>
  )
}
