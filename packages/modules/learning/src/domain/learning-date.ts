import type { Brand } from "@workspace/types/brand"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"

export type LearningDateKey = Brand<string, "LearningDateKey">

export function toLearningDateKey(date: Date): LearningDateKey {
  return toPlatformDayKey(date) as LearningDateKey
}

function addLearningCalendarDays(
  dateKey: LearningDateKey,
  days: number
): LearningDateKey {
  if (!Number.isInteger(days)) {
    throw new Error(`Invalid learning calendar day offset: ${days}`)
  }
  let current = parseLearningDateKey(dateKey)
  const direction = Math.sign(days)

  for (let remaining = Math.abs(days); remaining > 0; remaining -= 1) {
    current =
      direction > 0 ? nextCalendarDate(current) : previousCalendarDate(current)
  }

  return formatCalendarDate(current)
}

export function groupLearningActivityDatesByUserId(
  activities: readonly {
    readonly activityDate: string
    readonly userId: string
  }[]
): Map<string, LearningDateKey[]> {
  const activityDatesByUserId = new Map<string, LearningDateKey[]>()

  for (const activity of activities) {
    const activityDates = activityDatesByUserId.get(activity.userId) ?? []

    activityDates.push(activity.activityDate as LearningDateKey)
    activityDates.sort((left, right) => right.localeCompare(left))
    activityDatesByUserId.set(activity.userId, activityDates)
  }

  return activityDatesByUserId
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

  const parsed = {
    day: Number(day),
    month: Number(month),
    year: Number(year),
  }
  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > daysInMonth(parsed.year, parsed.month)
  ) {
    throw new Error(`Invalid learning activity date key: ${dateKey}`)
  }
  return parsed
}

function nextCalendarDate(date: {
  readonly day: number
  readonly month: number
  readonly year: number
}) {
  const lastDay = daysInMonth(date.year, date.month)
  if (date.day < lastDay) return { ...date, day: date.day + 1 }
  if (date.month < 12) return { day: 1, month: date.month + 1, year: date.year }
  return { day: 1, month: 1, year: date.year + 1 }
}

function previousCalendarDate(date: {
  readonly day: number
  readonly month: number
  readonly year: number
}) {
  if (date.day > 1) return { ...date, day: date.day - 1 }
  if (date.month > 1) {
    const month = date.month - 1
    return { day: daysInMonth(date.year, month), month, year: date.year }
  }
  return { day: 31, month: 12, year: date.year - 1 }
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function formatCalendarDate(date: {
  readonly day: number
  readonly month: number
  readonly year: number
}): LearningDateKey {
  return `${date.year}-${padTwoDigits(date.month)}-${padTwoDigits(date.day)}` as LearningDateKey
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, "0")
}
