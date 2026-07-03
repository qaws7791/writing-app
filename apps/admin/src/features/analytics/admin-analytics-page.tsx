import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminAnalytics,
  AdminLessonAnalyticsPage,
} from "@/lib/api/admin-api"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table"
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
                className="flex items-center justify-between gap-3 rounded-card border border-border/50 bg-background px-3 py-2.5 text-body-sm"
                key={point.date}
              >
                <span className="font-semibold text-muted-foreground">
                  {point.date}
                </span>
                <strong className="font-black text-foreground">
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
                className="flex items-center justify-between gap-3 rounded-card border border-border/50 bg-background px-3 py-2.5 text-body-sm"
                key={bucket.label}
              >
                <span className="font-semibold text-muted-foreground">
                  {bucket.label}
                </span>
                <strong className="font-black text-foreground">
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
        <Table aria-label="레슨별 분석">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">레슨</TableHead>
              <TableHead scope="col">코스</TableHead>
              <TableHead scope="col">시작</TableHead>
              <TableHead scope="col">완료</TableHead>
              <TableHead scope="col">완료율</TableHead>
              <TableHead scope="col">이탈률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessonRows.map((lesson) => (
              <TableRow key={lesson.lessonId}>
                <TableCell>{lesson.lessonTitle}</TableCell>
                <TableCell>{lesson.courseTitle}</TableCell>
                <TableCell>{lesson.started}</TableCell>
                <TableCell>{lesson.completed}</TableCell>
                <TableCell>{lesson.completionRate}%</TableCell>
                <TableCell>{lesson.dropOffRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Surface>
    </>
  )
}
