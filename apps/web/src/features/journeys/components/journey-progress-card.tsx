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
    <div className="mx-4 mt-6 flex flex-col gap-4 rounded-[2rem] bg-surface py-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-label-large text-on-surface-low">
            전체 진행률
          </span>
          <span className="text-title-large-em text-on-surface">
            {completedCount} / {totalCount} 세션
          </span>
        </div>
        <span className="text-title-small text-on-surface">
          {progressPercent}% 달성
        </span>
      </div>
      <ProgressSegments total={totalCount} completed={completedCount} />
    </div>
  )
}
