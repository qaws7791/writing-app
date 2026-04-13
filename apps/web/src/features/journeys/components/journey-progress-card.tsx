import { ProgressSegments } from "./progress-segments"

export function JourneyProgressCard({
  completedCount,
  totalCount,
}: {
  completedCount: number
  totalCount: number
}) {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="mx-4 mt-6 flex flex-col gap-4 rounded-[2rem] bg-surface px-6 py-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm leading-5 font-medium text-muted">
            전체 진행률
          </span>
          <span className="text-xl leading-8 font-semibold text-foreground">
            {completedCount} / {totalCount} 세션
          </span>
        </div>
        <span className="text-base leading-6 font-medium text-foreground">
          {progressPercent}% 달성
        </span>
      </div>
      <ProgressSegments total={totalCount} completed={completedCount} />
    </div>
  )
}
