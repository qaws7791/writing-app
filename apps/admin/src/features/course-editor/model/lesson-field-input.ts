export function readOptionalLessonText(value: string): string | null {
  return value.trim().length === 0 ? null : value
}

export function readLessonSummaryLines(value: string): readonly string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
