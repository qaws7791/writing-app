import type { AdminChartPanelProps } from "@/components/admin-chart-types"
import { AdminChartVisual } from "@/components/admin-chart-visual"

export function AdminChartPanel(props: AdminChartPanelProps) {
  const title = readChartTitle(props.kind)

  return (
    <article className="rounded-4xl border border-surface-hover p-6">
      <h2 className="mb-2 text-[1.125rem] font-bold text-foreground">
        {title}
      </h2>
      <ChartSummary props={props} />
      <ChartDataTable props={props} title={title} />
      <AdminChartVisual {...props} />
    </article>
  )
}

function ChartSummary({ props }: { readonly props: AdminChartPanelProps }) {
  if (props.kind === "streaks") {
    const total = props.data.reduce((sum, bucket) => sum + bucket.count, 0)
    return (
      <p className="text-[0.875rem] font-medium text-muted-foreground">
        분포에 포함된 사용자 {total.toLocaleString("ko-KR")}명
      </p>
    )
  }

  const valueKey = props.kind === "signups" ? "signups" : "completions"
  const total = props.data.reduce((sum, point) => sum + point[valueKey], 0)
  const label = props.kind === "signups" ? "가입" : "레슨 완료"
  return (
    <p className="text-[0.875rem] font-medium text-muted-foreground">
      기간 합계 {label} {total.toLocaleString("ko-KR")}건
    </p>
  )
}

function ChartDataTable({
  props,
  title,
}: {
  readonly props: AdminChartPanelProps
  readonly title: string
}) {
  if (props.kind === "streaks") {
    return (
      <table className="sr-only">
        <caption>{title} 데이터</caption>
        <thead>
          <tr>
            <th scope="col">연속 학습일</th>
            <th scope="col">사용자 수</th>
          </tr>
        </thead>
        <tbody>
          {props.data.map((bucket) => (
            <tr key={bucket.label}>
              <th scope="row">{bucket.label}</th>
              <td>{bucket.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const valueKey = props.kind === "signups" ? "signups" : "completions"
  const valueLabel = props.kind === "signups" ? "가입 수" : "완료 수"
  return (
    <table className="sr-only">
      <caption>{title} 데이터</caption>
      <thead>
        <tr>
          <th scope="col">날짜</th>
          <th scope="col">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((point) => (
          <tr key={point.date}>
            <th scope="row">{point.date}</th>
            <td>{point[valueKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function readChartTitle(kind: AdminChartPanelProps["kind"]) {
  if (kind === "signups") return "최근 30일 가입 추이"
  if (kind === "completions") return "일별 레슨 완료"
  return "스트릭 유지 분포"
}
