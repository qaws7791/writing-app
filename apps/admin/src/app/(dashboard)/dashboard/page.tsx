import { count } from "drizzle-orm"
import {
  BookOpenIcon,
  ChevronRightIcon,
  MapIcon,
  PenToolIcon,
} from "lucide-react"

import { journeys, journeySessions, writingPrompts } from "@workspace/database"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/ui/card"

import { getDb } from "@/lib/db"

export default async function DashboardPage() {
  const db = getDb()

  const [journeyRows, sessionRows, promptRows] = await Promise.all([
    db.select({ journeyCount: count() }).from(journeys),
    db.select({ sessionCount: count() }).from(journeySessions),
    db.select({ promptCount: count() }).from(writingPrompts),
  ])

  const journeyCount = journeyRows[0]?.journeyCount ?? 0
  const sessionCount = sessionRows[0]?.sessionCount ?? 0
  const promptCount = promptRows[0]?.promptCount ?? 0

  const stats = [
    {
      label: "전체 여정",
      value: journeyCount,
      description: "등록된 글쓰기 여정",
      icon: MapIcon,
    },
    {
      label: "전체 세션",
      value: sessionCount,
      description: "여정 내 학습 세션",
      icon: BookOpenIcon,
    },
    {
      label: "전체 글감",
      value: promptCount,
      description: "등록된 글쓰기 글감",
      icon: PenToolIcon,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-foreground">대시보드</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          글필 서비스 현황 개요
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-semibold text-foreground tabular-nums">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <stat.icon aria-hidden="true" size={20} strokeWidth={1.75} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              빠른 이동
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-1">
              <QuickLink
                href="/journeys"
                label="여정 관리"
                description="여정 목록 보기 및 편집"
              />
              <QuickLink
                href="/journeys/new"
                label="새 여정 추가"
                description="새로운 글쓰기 여정 만들기"
              />
              <QuickLink
                href="/prompts"
                label="글감 관리"
                description="글감 목록 보기 및 편집"
              />
              <QuickLink
                href="/prompts/new"
                label="새 글감 추가"
                description="새로운 글쓰기 글감 만들기"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              서비스 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              <StatRow
                label="여정당 평균 세션 수"
                value={
                  journeyCount > 0
                    ? (sessionCount / journeyCount).toFixed(1)
                    : "0"
                }
                unit="개"
              />
              <div className="border-t border-border" />
              <StatRow
                label="전체 여정 수"
                value={journeyCount.toString()}
                unit="개"
              />
              <StatRow
                label="전체 세션 수"
                value={sessionCount.toString()}
                unit="개"
              />
              <StatRow
                label="전체 글감 수"
                value={promptCount.toString()}
                unit="개"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string
  label: string
  description: string
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRightIcon
        aria-hidden="true"
        className="text-muted-foreground transition-colors group-hover:text-foreground"
        size={14}
        strokeWidth={1.75}
      />
    </a>
  )
}

function StatRow({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {value}
        <span className="ml-0.5 font-normal text-muted-foreground">{unit}</span>
      </span>
    </div>
  )
}
