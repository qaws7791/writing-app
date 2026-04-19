import { Card, CardContent } from "@workspace/ui/components/ui/card"

export function StatsCards({
  completedJourneyCount,
  writingCount,
}: {
  completedJourneyCount: number
  writingCount: number
}) {
  return (
    <div className="flex gap-4 px-4 pb-10">
      <Card className="flex-1">
        <CardContent className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
            완료한 여정
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            여정 {completedJourneyCount}개
          </p>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
            작성한 글
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            글 {writingCount}개
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
