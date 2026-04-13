import { Card } from "@workspace/ui/components/card"

export function StatsCards({
  completedJourneyCount,
  writingCount,
}: {
  completedJourneyCount: number
  writingCount: number
}) {
  return (
    <div className="flex gap-4 px-4 pb-10">
      <Card.Root className="flex-1">
        <Card.Content className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
            완료한 여정
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            여정 {completedJourneyCount}개
          </p>
        </Card.Content>
      </Card.Root>
      <Card.Root className="flex-1">
        <Card.Content className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted uppercase">
            작성한 글
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            글 {writingCount}개
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  )
}
