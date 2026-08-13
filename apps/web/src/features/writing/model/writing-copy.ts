export function formatWritingStartedAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Seoul",
  })
}
