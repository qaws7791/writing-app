export type DailySeriesPoint = {
  readonly completions: number
  readonly date: string
  readonly signups: number
}

export type StreakBucket = {
  readonly count: number
  readonly label: string
}

export type AdminChartPanelProps =
  | {
      readonly data: readonly DailySeriesPoint[]
      readonly kind: "completions" | "signups"
    }
  | {
      readonly data: readonly StreakBucket[]
      readonly kind: "streaks"
    }
