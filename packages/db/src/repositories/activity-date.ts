export const learningActivityTimeZone = "Asia/Seoul"

const learningDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: learningActivityTimeZone,
  year: "numeric",
})

export function toLearningDateKey(date: Date): string {
  const parts = learningDateFormatter.formatToParts(date)
  const year = readDatePart(parts, "year")
  const month = readDatePart(parts, "month")
  const day = readDatePart(parts, "day")

  return `${year}-${month}-${day}`
}

export function addLearningCalendarDays(dateKey: string, days: number): string {
  const parsed = parseLearningDateKey(dateKey)
  const result = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day + days)
  )

  return formatUtcCalendarDate(result)
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

function parseLearningDateKey(dateKey: string): {
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

function formatUtcCalendarDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()

  return `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`
}

function padTwoDigits(value: number): string {
  return value.toString().padStart(2, "0")
}
