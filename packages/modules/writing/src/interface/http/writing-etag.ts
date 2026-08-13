export function toIntegerEtag(version: number): string {
  return `"${version}"`
}

export function parseIntegerEtag(value: string): number | null {
  const match = /^"(\d+)"$/u.exec(value.trim())
  if (match === null) return null

  const version = Number(match[1])
  return Number.isSafeInteger(version) ? version : null
}
