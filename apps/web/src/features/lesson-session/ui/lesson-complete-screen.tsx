"use client"

import type {
  Lesson as LessonViewModel,
  LessonCompleteLessonResult,
} from "@/features/lesson-session/model/lesson-view-model"
import { CheckCircleIcon } from "@workspace/ui/components/icons/authentication-icons"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Insight,
  InsightEyebrow,
  InsightItem,
  InsightList,
} from "@workspace/ui/components/learning/insight"

export function LessonCompleteScreen({
  completion,
  lesson,
  onCourse,
  onNext,
}: {
  readonly completion: LessonCompleteLessonResult | null
  readonly lesson: LessonViewModel
  readonly onCourse: () => void
  readonly onNext: (nextLessonId: string) => void
}) {
  const nextLesson = completion?.courseLearning.nextLesson ?? null
  const accuracyPercent = completion?.accuracyPercent ?? 100
  const durationMinutes = completion?.durationMinutes ?? 0
  const streakDays = completion?.streakDays ?? 0
  const streakIncreased = completion?.streakIncreased ?? false

  return (
    <div className="fixed inset-0 z-50 flex flex-col h-dvh overflow-hidden bg-background text-foreground">
      {/* 75% 상단 영역: 성과 축하 집중 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 overflow-y-auto">
        <div
          aria-label="완료"
          className="relative flex size-32 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-drift-in"
          role="img"
        >
          <CheckCircleIcon aria-hidden className="size-16" />
        </div>

        <div
          className="text-center space-y-2 motion-safe:animate-fade-in-up"
          style={{ animationDelay: "150ms" }}
        >
          <h1 className="text-3xl font-bold tracking-tight">훌륭합니다!</h1>
          <p className="text-muted-foreground">{lesson.title}</p>
        </div>

        {/* 성과 대시보드 */}
        <div
          className="grid grid-cols-3 gap-4 w-full max-w-sm pt-6 motion-safe:animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex flex-col items-center p-4 bg-muted/30 rounded-2xl">
            <span className="text-sm font-medium text-muted-foreground mb-1">
              정답률
            </span>
            <span className="text-2xl font-bold">{accuracyPercent}%</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted/30 rounded-2xl">
            <span className="text-sm font-medium text-muted-foreground mb-1">
              소요 시간
            </span>
            <span className="text-2xl font-bold">{durationMinutes}분</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted/30 rounded-2xl relative">
            <span className="text-sm font-medium text-muted-foreground mb-1">
              스트릭
            </span>
            <span className="text-2xl font-bold flex items-center">
              {streakDays}일
            </span>
            {streakIncreased && (
              <span className="absolute -top-2 -right-2 text-success font-bold text-sm bg-success/10 px-2 py-0.5 rounded-full motion-safe:animate-bounce">
                +1
              </span>
            )}
          </div>
        </div>

        {lesson.summary.length > 0 && (
          <div
            className="w-full max-w-sm mt-8 motion-safe:animate-fade-in-up"
            style={{ animationDelay: "450ms" }}
          >
            <Insight className="w-full text-left" tone="neutral">
              <InsightEyebrow>이번 레슨 요약</InsightEyebrow>
              <InsightList>
                {lesson.summary.map((point) => (
                  <InsightItem key={point}>{point}</InsightItem>
                ))}
              </InsightList>
            </Insight>
          </div>
        )}
      </div>

      {/* 25% 하단 영역: 버튼 통합 및 나가기 */}
      <div
        className="flex-none p-6 pb-8 bg-background border-t border-border/50 motion-safe:animate-fade-in-up"
        style={{ animationDelay: "600ms" }}
      >
        <div className="flex w-full flex-col gap-3 max-w-md mx-auto">
          {nextLesson === null ? (
            <Button
              className="w-full h-16 text-lg rounded-2xl"
              onClick={onCourse}
              size="lg"
            >
              코스로 돌아가기
            </Button>
          ) : (
            <>
              <Button
                className="w-full h-20 flex flex-col items-center justify-center rounded-2xl"
                onClick={() => onNext(nextLesson.id)}
                size="lg"
              >
                <span className="text-primary-foreground/70 text-sm mb-1">
                  다음 단계 시작하기
                </span>
                <span className="text-lg font-bold truncate max-w-full px-4">
                  {nextLesson.title}
                </span>
              </Button>
              <Button
                className="w-full h-14 rounded-2xl"
                onClick={onCourse}
                size="lg"
                variant="ghost"
              >
                코스로 돌아가기
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
