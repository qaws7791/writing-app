import { BookOpenIcon, FlameIcon } from "@workspace/ui/components/icons"
import { StatCard, StatGrid } from "@workspace/ui/components/ui/stat-card"

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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-14">
      <div className="lg:w-[360px] lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
        <div className="mb-8">
          <p className="mb-2 text-body-sm font-bold text-muted-foreground">
            안녕하세요 👋
          </p>
          <h1 className="text-heading-lg font-black">
            {firstName}님,
            <br />
            오늘도 함께 써봐요.
          </h1>
        </div>
        <StatGrid aria-label="학습 현황" className="grid-cols-2 gap-3">
          <StatCard
            icon={<FlameIcon size={20} />}
            label="연속 학습"
            layout="compact"
            value={`${profileStats.currentStreakDays}일`}
          />
          <StatCard
            icon={<BookOpenIcon size={20} />}
            label="완료한 레슨"
            layout="compact"
            value={`${profileStats.completedLessons}개`}
          />
        </StatGrid>
      </div>

      <HomeProgressClient inProgress={inProgress} />
    </div>
  )
}

function normalizeFirstName(name: null | string | undefined): string {
  const trimmed = name?.trim()

  if (trimmed === undefined || trimmed.length === 0 || trimmed === "학습자") {
    return "글쓰기"
  }

  return trimmed.split(/\s+/)[0] ?? "글쓰기"
}
