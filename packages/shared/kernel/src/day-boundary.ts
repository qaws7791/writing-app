/**
 * 학습 날짜 경계의 정본. IANA 시간대 이름과 고정 offset을 함께 두는 이유는
 * `Intl`은 시간대 이름을, SQLite `date()`와 밀리초 산술은 offset을 요구하기 때문이다.
 * Asia/Seoul은 DST를 쓰지 않으므로 두 표현이 같은 경계를 가리킨다.
 */
export const platformDayBoundary = {
  offsetMs: 9 * 60 * 60 * 1_000,
  sqliteOffset: "+9 hours",
  timeZone: "Asia/Seoul",
} as const

const dayKeyFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  timeZone: platformDayBoundary.timeZone,
  year: "numeric",
})

/** 플랫폼 날짜 경계를 적용한 `YYYY-MM-DD` 논리 날짜. */
export function toPlatformDayKey(date: Date): string {
  const parts = dayKeyFormatter.formatToParts(date)

  return `${readDatePart(parts, "year")}-${readDatePart(parts, "month")}-${readDatePart(parts, "day")}`
}

function readDatePart(
  parts: readonly Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  const value = parts.find((part) => part.type === type)?.value

  if (value === undefined) {
    throw new Error(`Missing ${type} in platform day key`)
  }

  return value
}
