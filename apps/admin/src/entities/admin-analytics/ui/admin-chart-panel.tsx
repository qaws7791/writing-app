import type {
  AdminChartKind,
  AdminChartPanelProps,
} from "@/entities/admin-analytics/model/admin-chart-types"
import { AdminChartVisual } from "@/entities/admin-analytics/ui/admin-chart-visual"
import { Surface } from "@workspace/ui/components/ui/surface"

const chartCopy = {
  "d7-return": {
    description: "관찰 기간이 끝난 첫 시작 cohort의 재방문입니다.",
    title: "D7 재방문",
  },
  "signup-activation": {
    description: "가입과 학습자별 첫 레슨 시작을 함께 비교합니다.",
    title: "가입·활성화",
  },
  "start-completion": {
    description: "첫 레슨 시작과 전체 레슨 완료 흐름을 비교합니다.",
    title: "시작·완료",
  },
} as const satisfies Record<
  AdminChartKind,
  Readonly<{ description: string; title: string }>
>

export function AdminChartPanel(props: AdminChartPanelProps) {
  const copy = chartCopy[props.kind]

  return (
    <Surface
      aria-labelledby={`${props.kind}-chart-title`}
      className="min-w-0"
      role="group"
      variant="panel"
    >
      <h2
        className="m-0 text-title-md font-black"
        id={`${props.kind}-chart-title`}
      >
        {copy.title}
      </h2>
      <p className="mt-1 text-body-sm font-semibold text-muted-foreground">
        {copy.description}
      </p>
      <ChartSummary {...props} />
      <AdminChartVisual {...props} />
    </Surface>
  )
}

function ChartSummary({ data, kind }: AdminChartPanelProps) {
  if (kind === "signup-activation") {
    return (
      <p className="mt-3 text-label-md font-black text-foreground">
        기간 합계 가입 {formatTotal(data, "signups")}명 · 첫 시작{" "}
        {formatTotal(data, "starts")}명
      </p>
    )
  }
  if (kind === "start-completion") {
    return (
      <p className="mt-3 text-label-md font-black text-foreground">
        기간 합계 첫 시작 {formatTotal(data, "starts")}명 · 완료{" "}
        {formatTotal(data, "completions")}건
      </p>
    )
  }

  const returnTotal = data.reduce(
    (total, point) => total + (point.returns ?? 0),
    0
  )
  const immatureDays = data.filter(
    (point) => point.returnStatus === "immature"
  ).length
  return (
    <p className="mt-3 text-label-md font-black text-foreground">
      성숙 cohort 재방문 합계 {returnTotal.toLocaleString("ko-KR")}명
      {immatureDays === 0
        ? null
        : ` · 아직 집계 중인 날짜 ${immatureDays.toLocaleString("ko-KR")}일`}
    </p>
  )
}

function formatTotal(
  data: AdminChartPanelProps["data"],
  key: "completions" | "signups" | "starts"
): string {
  return data
    .reduce((total, point) => total + point[key], 0)
    .toLocaleString("ko-KR")
}
