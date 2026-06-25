import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  DataTable,
  DataTableContainer,
} from "@workspace/ui/components/ui/data-table"
import { PageHeader } from "@workspace/ui/components/ui/page-header"
import { SectionHeader } from "@workspace/ui/components/ui/section-header"
import { Surface } from "@workspace/ui/components/ui/surface"

export function AdminAnalyticsPage({
  analyticsResult,
  lessonAnalyticsResult,
}: {
  readonly analyticsResult: AdminApiResult<AdminAnalytics>
  readonly lessonAnalyticsResult: AdminApiResult<AdminLessonAnalyticsPage>
}) {
  if (analyticsResult.status === "error") {
    return (
      <>
        <PageHeader
          description="가입, 완료, 이탈 지표를 분석합니다."
          title="분석"
        />
        <Alert role="alert" tone="danger">
          <AlertDescription>{analyticsResult.error.message}</AlertDescription>
        </Alert>
      </>
    )
  }

  const lessonRows =
    lessonAnalyticsResult.status === "ok"
      ? lessonAnalyticsResult.value.items
      : []

  return (
    <>
      <PageHeader
        description="가입, 완료, 이탈 지표를 분석합니다."
        title="분석"
      />
      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <Surface variant="panel">
          <SectionHeader
            title="최근 30일 가입 추이"
            description="일별 가입과 레슨 완료를 함께 봅니다."
          />
          <ol className="grid list-none gap-2 p-0">
            {analyticsResult.value.dailySeries.map((point) => (
              <li
                className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-bg-canvas px-3 py-2.5 text-body-sm"
                key={point.date}
              >
                <span className="font-semibold text-fg-muted">
                  {point.date}
                </span>
                <strong className="font-black text-fg-default">
                  가입 {point.signups} · 완료 {point.completions}
                </strong>
              </li>
            ))}
          </ol>
        </Surface>
        <Surface variant="panel">
          <SectionHeader
            title="연속 학습일 분포"
            description="현재 streak bucket입니다."
          />
          <ol className="grid list-none gap-2 p-0">
            {analyticsResult.value.streakBuckets.map((bucket) => (
              <li
                className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-bg-canvas px-3 py-2.5 text-body-sm"
                key={bucket.label}
              >
                <span className="font-semibold text-fg-muted">
                  {bucket.label}
                </span>
                <strong className="font-black text-fg-default">
                  {bucket.count}명
                </strong>
              </li>
            ))}
          </ol>
        </Surface>
      </section>
      <Surface variant="panel">
        <SectionHeader
          title="레슨별 완료율"
          description="완료율과 이탈률을 기준으로 개선 대상을 찾습니다."
        />
        <DataTableContainer>
          <DataTable aria-label="레슨별 분석">
            <thead>
              <tr>
                <th scope="col">레슨</th>
                <th scope="col">코스</th>
                <th scope="col">시작</th>
                <th scope="col">완료</th>
                <th scope="col">완료율</th>
                <th scope="col">이탈률</th>
              </tr>
            </thead>
            <tbody>
              {lessonRows.map((lesson) => (
                <tr key={lesson.lessonId}>
                  <td>{lesson.lessonTitle}</td>
                  <td>{lesson.courseTitle}</td>
                  <td>{lesson.started}</td>
                  <td>{lesson.completed}</td>
                  <td>{lesson.completionRate}%</td>
                  <td>{lesson.dropOffRate}%</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </DataTableContainer>
      </Surface>
    </>
  )
}
