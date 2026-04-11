export function StatsCards({
  completedJourneyCount,
  writingCount,
}: {
  completedJourneyCount: number
  writingCount: number
}) {
  return (
    <div className="flex gap-4 px-4 pb-10">
      <div className="flex flex-1 flex-col gap-1 rounded-[2rem] bg-surface-container p-6">
        <p className="text-label-medium-em text-on-surface-low uppercase">
          완료한 여정
        </p>
        <p className="text-title-large-em text-on-surface">
          여정 {completedJourneyCount}개
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-[2rem] bg-surface-container p-6">
        <p className="text-label-medium-em text-on-surface-low uppercase">
          작성한 글
        </p>
        <p className="text-title-large-em text-on-surface">
          글 {writingCount}개
        </p>
      </div>
    </div>
  )
}
