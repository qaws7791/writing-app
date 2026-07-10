export function formatResourceExactDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

export function formatResourceRelativeDate(value: string): string {
  const differenceInSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1_000
  )
  const absoluteSeconds = Math.abs(differenceInSeconds)
  const [amount, unit] =
    absoluteSeconds < 60
      ? [differenceInSeconds, "second"]
      : absoluteSeconds < 3_600
        ? [Math.round(differenceInSeconds / 60), "minute"]
        : absoluteSeconds < 86_400
          ? [Math.round(differenceInSeconds / 3_600), "hour"]
          : absoluteSeconds < 2_592_000
            ? [Math.round(differenceInSeconds / 86_400), "day"]
            : absoluteSeconds < 31_536_000
              ? [Math.round(differenceInSeconds / 2_592_000), "month"]
              : [Math.round(differenceInSeconds / 31_536_000), "year"]

  return new Intl.RelativeTimeFormat("ko-KR", { numeric: "auto" }).format(
    amount,
    unit as Intl.RelativeTimeFormatUnit
  )
}
