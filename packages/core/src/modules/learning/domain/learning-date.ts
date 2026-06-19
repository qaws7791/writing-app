import type { Brand } from "@workspace/contracts/content/content.ids"

export type LearningDateKey = Brand<string, "LearningDateKey">

export const platformLearningTimeZone = "Asia/Seoul"

const learningDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: platformLearningTimeZone,
  year: "numeric",
})

export function toLearningDateKey(date: Date): LearningDateKey {
  const parts = learningDateFormatter.formatToParts(date)
  const year = readDatePart(parts, "year")
  const month = readDatePart(parts, "month")
  const day = readDatePart(parts, "day")

  return `${year}-${month}-${day}` as LearningDateKey
}

export function addLearningCalendarDays(
  dateKey: LearningDateKey,
  days: number
): LearningDateKey {
  const parsed = parseLearningDateKey(dateKey)
  const result = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + days)
  )

  return formatUtcCalendarDate(result)
}

export function isLearningDateKeyInRange(
  dateKey: LearningDateKey,
  range: {
    readonly end: LearningDateKey
    readonly start: LearningDateKey
  }
): boolean {
  return (
    compareLearningDateKey(dateKey, range.start) >= 0 &&
    compareLearningDateKey(dateKey, range.end) <= 0
  )
}

export function compareLearningDateKey(
  left: LearningDateKey,
  right: LearningDateKey
): number {
  return left.localeCompare(right)
}

export function calculateCurrentStreakDays(
  activityDates: readonly LearningDateKey[]
): number {
  if (activityDates.length === 0) {
    return 0
  }

  const activitySet = new Set(activityDates)
  const latestActivityDate = activityDates[0]
  let streak = 0
  let cursor = latestActivityDate

  while (cursor !== undefined && activitySet.has(cursor)) {
    streak += 1
    cursor = addLearningCalendarDays(cursor, -1)
  }

  return streak
}

function readDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  const value = parts.find((part) => part.type === type)?.value

  if (value === undefined) {
    throw new Error(`Missing ${type} in learning activity date`)
  }

  return value
}

function parseLearningDateKey(dateKey: LearningDateKey): {
  readonly day: number
  readonly month: number
  readonly year: number
} {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)

  if (matched === null) {
    throw new Error(`Invalid learning activity date key: ${dateKey}`)
  }

  const [, year, month, day] = matched

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid learning activity date key: ${dateKey}`)
  }

  return {
    day: Number(day),
    month: Number(month),
    year: Number(year),
  }
}

function formatUtcCalendarDate(date: Date): LearningDateKey {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()

  return `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}` as LearningDateKey
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, "0")
}
