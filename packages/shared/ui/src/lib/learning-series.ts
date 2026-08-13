export const LEARNING_SERIES_VALUES = [1, 2, 3, 4] as const

export type LearningSeries = (typeof LEARNING_SERIES_VALUES)[number]

export function learningSeriesAt(index: number): LearningSeries {
  if (index < 0) return 1
  const value = LEARNING_SERIES_VALUES[index % LEARNING_SERIES_VALUES.length]
  return value ?? 1
}

export const learningSeriesDotClass = {
  1: "bg-series-1",
  2: "bg-series-2",
  3: "bg-series-3",
  4: "bg-series-4",
} as const satisfies Record<LearningSeries, string>

export const learningSeriesSurfaceClass = {
  1: "border-series-1/30 bg-series-1/10 text-series-1",
  2: "border-series-2/30 bg-series-2/10 text-series-2",
  3: "border-series-3/30 bg-series-3/10 text-series-3",
  4: "border-series-4/30 bg-series-4/10 text-series-4",
} as const satisfies Record<LearningSeries, string>

export const learningSeriesActiveClass = {
  1: "border-series-1/45 bg-series-1/16 text-series-1 ring-1 ring-series-1/20",
  2: "border-series-2/45 bg-series-2/16 text-series-2 ring-1 ring-series-2/20",
  3: "border-series-3/45 bg-series-3/16 text-series-3 ring-1 ring-series-3/20",
  4: "border-series-4/45 bg-series-4/16 text-series-4 ring-1 ring-series-4/20",
} as const satisfies Record<LearningSeries, string>

export const learningSeriesStrokeClass = {
  1: "stroke-series-1/55",
  2: "stroke-series-2/55",
  3: "stroke-series-3/55",
  4: "stroke-series-4/55",
} as const satisfies Record<LearningSeries, string>
