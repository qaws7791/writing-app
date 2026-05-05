import { Card, CardContent } from "@workspace/ui/components/ui/card"

export function StatsCards({
  gardenCardCount,
  sentenceCount,
}: {
  gardenCardCount: number
  sentenceCount: number
}) {
  return (
    <div className="flex gap-4 px-4 pb-10">
      <Card className="flex-1">
        <CardContent className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
            표현 카드
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            카드 {gardenCardCount}개
          </p>
        </CardContent>
      </Card>
      <Card className="flex-1">
        <CardContent className="flex flex-col gap-1 p-6">
          <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground uppercase">
            저장한 문장
          </p>
          <p className="text-xl leading-8 font-semibold text-foreground">
            문장 {sentenceCount}개
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
