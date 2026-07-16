"use client"

import type {
  CompleteLearnerStepResult,
  LearnerLesson as Lesson,
} from "@workspace/contracts/learning"
import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

type LessonCompletionTransition = Extract<
  CompleteLearnerStepResult,
  { readonly status: "lesson_completed" }
>

export function LessonCompleteScreen({
  completion,
  lesson,
  onCourse,
  onNext,
}: {
  readonly completion: LessonCompletionTransition | null
  readonly lesson: Lesson
  readonly onCourse: () => void
  readonly onNext: (nextLessonId: string) => void
}) {
  const nextLesson = completion?.courseLearning.nextLesson ?? null

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col overflow-y-auto bg-background text-foreground">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center px-6 py-16 my-auto an-fi">
        <div className="mb-6 text-6xl" aria-hidden>
          🎉
        </div>
        <h1 className="mb-3 text-heading-lg font-black">레슨을 완료했어요!</h1>
        <p className="mb-8 text-body-lg font-medium text-muted-foreground">
          {lesson.title}
        </p>

        {lesson.summary.length === 0 ? null : (
          <Surface className="mb-8 w-full p-6 text-left">
            <h2 className="mb-3 text-title-md font-bold">이번 레슨 요약</h2>
            <ul className="space-y-2">
              {lesson.summary.map((point) => (
                <li className="font-medium" key={point}>
                  · {point}
                </li>
              ))}
            </ul>
          </Surface>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={onCourse}
            size="lg"
            variant="secondary"
          >
            코스로 돌아가기
          </Button>
          {nextLesson === null ? null : (
            <Button
              className="flex-1"
              onClick={() => onNext(nextLesson.id)}
              size="lg"
            >
              다음 레슨
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
