"use client"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/primitives/progress"

type CourseProgressProps = {
  readonly className?: string
  readonly completedLessonCount: number
  readonly progressPercent: number
  readonly totalEstimatedMinutes: number
  readonly totalLessonCount: number
}

export function CourseProgress({
  className,
  completedLessonCount,
  progressPercent,
  totalEstimatedMinutes,
  totalLessonCount,
}: CourseProgressProps) {
  return (
    <Progress className={className} value={progressPercent}>
      <ProgressLabel>학습 진행</ProgressLabel>
      <ProgressValue className="text-sm font-medium text-muted-foreground">
        {() =>
          `${completedLessonCount}/${totalLessonCount}개 레슨 · 약 ${totalEstimatedMinutes}분`
        }
      </ProgressValue>
    </Progress>
  )
}
