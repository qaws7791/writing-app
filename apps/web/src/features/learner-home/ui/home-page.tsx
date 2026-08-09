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
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10 xl:gap-14">
      <aside className="lg:sticky lg:top-20 lg:w-[360px] lg:shrink-0 lg:self-start">
        <div className="mb-7">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            안녕하세요 👋
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-4xl">
            {firstName}님,
            <br />
            오늘도 함께 써봐요.
          </h1>
        </div>
        <div aria-label="학습 현황" className="grid grid-cols-2 gap-3">
          <HomeStat
            icon={<FlameIcon size={20} />}
            label="연속 학습"
            value={`${profileStats.currentStreakDays}일`}
          />
          <HomeStat
            icon={<BookOpenIcon size={20} />}
            label="완료한 레슨"
            value={`${profileStats.completedLessons}개`}
          />
        </div>
      </aside>

      <HomeProgressClient inProgress={inProgress} />
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
    <Card size="sm" variant="muted">
      <CardContent className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-xl bg-background/70 text-foreground"
        >
          {icon}
        </span>
        <div>
          <p className="font-heading text-xl font-semibold tabular-nums">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
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
