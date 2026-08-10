import type { ReactNode } from "react"

import { FlameIcon } from "@workspace/ui/components/icons/learning-icons"
import { BookOpenIcon } from "@workspace/ui/components/icons/navigation-icons"
import { Card, CardContent } from "@workspace/ui/components/ui/card"

import { HomeProgressClient } from "@/features/learner-home/ui/home-progress-client"
import type {
  LearnerProfileStatsDto,
  LearnerProgressPageDto,
} from "@/shared/http/learner-api-client"

export function HomePage({
  inProgress,
  learnerName,
  profileStats,
}: {
  readonly inProgress: LearnerProgressPageDto
  readonly learnerName: null | string | undefined
  readonly profileStats: LearnerProfileStatsDto
}) {
  const firstName = normalizeFirstName(learnerName)

  return (
    <div className="@container w-full">
      <div className="grid w-full grid-cols-1 gap-10 @[48rem]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] @[48rem]:items-start @[48rem]:gap-12">
        <section
          aria-labelledby="home-learner-hello"
          className="flex flex-col gap-8"
        >
          <header className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">안녕하세요</p>
            <h1
              className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl sm:leading-[1.15]"
              id="home-learner-hello"
            >
              {firstName}님, 오늘도
              <br className="hidden @[32rem]:block" /> 이어서 써 볼까요
            </h1>
          </header>

          <div
            aria-label="학습 현황"
            className="flex flex-col gap-3 @[32rem]:flex-row"
          >
            <HomeStat
              icon={<FlameIcon size={16} />}
              label="연속 학습"
              value={`${profileStats.currentStreakDays}일`}
            />
            <HomeStat
              icon={<BookOpenIcon size={16} />}
              label="완료한 레슨"
              value={`${profileStats.completedLessons}개`}
            />
          </div>
        </section>

        <HomeProgressClient inProgress={inProgress} />
      </div>
    </div>
  )
}

function HomeStat({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <Card className="min-w-0 flex-1 rounded-3xl" size="sm" variant="muted">
      <CardContent className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-2xl bg-background text-muted-foreground"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-xl font-semibold tracking-[-0.02em] tabular-nums">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function normalizeFirstName(name: null | string | undefined): string {
  const trimmed = name?.trim()

  if (trimmed === undefined || trimmed.length === 0 || trimmed === "학습자") {
    return "글쓰기"
  }

  return trimmed.split(/\s+/)[0] ?? "글쓰기"
}
