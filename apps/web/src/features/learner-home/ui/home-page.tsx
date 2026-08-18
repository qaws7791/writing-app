import type { ReactNode } from "react"

import { CalendarIcon } from "@workspace/ui/components/icons/learning-icons"
import { BookOpenIcon } from "@workspace/ui/components/icons/navigation-icons"
import {
  Cadence,
  CadenceDay,
  CadenceHeader,
  CadenceHint,
  CadenceSummary,
  CadenceTitle,
  CadenceWeek,
} from "@workspace/ui/components/learning/cadence"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"

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
      <div className="grid w-full grid-cols-1 gap-10 @[48rem]:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] @[48rem]:items-start @[48rem]:gap-8">
        <section
          aria-labelledby="home-learner-hello"
          className="flex flex-col gap-8"
        >
          <header className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">안녕하세요</p>
            <h1
              className="font-heading text-3xl font-semibold tracking-[-0.01em] sm:text-4xl sm:leading-[1.15]"
              id="home-learner-hello"
            >
              {firstName}님, 오늘도 이어서 써 볼까요
            </h1>
          </header>

          <div className="flex flex-col gap-3">
            <div
              aria-label="학습 현황"
              className="flex flex-col gap-3 @[32rem]:flex-row"
            >
              <HomeStat
                icon={<CalendarIcon size={16} />}
                label="연속 학습"
                value={`${profileStats.currentStreakDays}일`}
              />
              <HomeStat
                icon={<BookOpenIcon size={16} />}
                label="완료한 레슨"
                value={`${profileStats.completedLessons}개`}
              />
            </div>
            <HomeCadence days={profileStats.recentCadenceDays} />
          </div>
        </section>

        <HomeProgressClient inProgress={inProgress} />
      </div>
    </div>
  )
}

function HomeCadence({
  days,
}: {
  readonly days: LearnerProfileStatsDto["recentCadenceDays"]
}) {
  const practicedCount = days.filter((day) => day.state === "practiced").length
  const todayIsOpen = days.some((day) => day.state === "today")

  return (
    <Card
      className="overflow-visible rounded-3xl py-4"
      size="sm"
      variant="muted"
    >
      <CardContent>
        <Cadence aria-label="최근 5일 학습 기록">
          <CadenceHeader className="hidden @[48rem]:flex">
            <CadenceTitle>최근 5일</CadenceTitle>
            <CadenceSummary>{practicedCount}일 학습</CadenceSummary>
          </CadenceHeader>
          <CadenceWeek className="grid-cols-5">
            {days.map((day) => (
              <CadenceDay key={day.date} label={day.label} state={day.state} />
            ))}
          </CadenceWeek>
          <CadenceHint className="hidden @[48rem]:block">
            {todayIsOpen
              ? "오늘은 짧게라도 한 레슨을 마치면 리듬이 이어집니다."
              : "오늘의 학습이 리듬을 이어 줍니다."}
          </CadenceHint>
        </Cadence>
      </CardContent>
    </Card>
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
    <Card
      className="min-w-0 flex-1 rounded-3xl py-3.5"
      size="sm"
      variant="muted"
    >
      <CardContent className="flex flex-row items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-2xl bg-background text-muted-foreground"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-heading text-base font-semibold tracking-[-0.01em] tabular-nums">
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
