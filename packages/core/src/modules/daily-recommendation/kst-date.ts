const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function getKstDateString(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return kst.toISOString().slice(0, 10)
}
