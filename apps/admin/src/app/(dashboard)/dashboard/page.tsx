import { count } from "drizzle-orm"

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
      icon: (
        <svg
          aria-hidden="true"
          fill="none"
          height={20}
          viewBox="0 0 16 16"
          width={20}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M5.5 1.217A.75.75 0 0 1 6 1.25l4 1.5 3.75-1.5a.75.75 0 0 1 1 .7v10.3a.75.75 0 0 1-.5.707l-4 1.5a.75.75 0 0 1-.5 0l-4-1.5-3.75 1.5A.75.75 0 0 1 1 13.25V2.95a.75.75 0 0 1 .5-.707l4-1.026ZM5.25 3.04 2.5 3.77v8.79l2.75-1.1V3.04Zm1.5.46v8.46l3-1.125V2.375L6.75 3.5Zm4.5-.625v8.46l2.25-.844V2.031l-2.25.844Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
      ),
    },
    {
      label: "전체 세션",
      value: sessionCount,
      description: "여정 내 학습 세션",
      icon: (
        <svg
          aria-hidden="true"
          fill="none"
          height={20}
          viewBox="0 0 16 16"
          width={20}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 2.75Zm0 5A.75.75 0 0 1 2.75 7h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 7.75ZM2.75 12a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
      ),
    },
    {
      label: "전체 글감",
      value: promptCount,
      description: "등록된 글쓰기 글감",
      icon: (
        <svg
          aria-hidden="true"
          fill="none"
          height={20}
          viewBox="0 0 16 16"
          width={20}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.19 6.25 9.75 4.81 3.862 10.7a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.557a.253.253 0 0 0 .108-.065L11.19 6.25Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
      ),
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
                  {stat.icon}
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
      <svg
        aria-hidden="true"
        className="text-muted-foreground transition-colors group-hover:text-foreground"
        fill="none"
        height={14}
        viewBox="0 0 16 16"
        width={14}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M5.97 3.47a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06L9.44 8 5.97 4.53a.75.75 0 0 1 0-1.06Z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
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
