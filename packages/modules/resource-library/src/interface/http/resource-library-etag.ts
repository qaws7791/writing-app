export function parseResourceVersionEtag(value: string): number | null {
  const match = /^"(0|[1-9]\d*)"$/u.exec(value.trim())
  if (match?.[1] === undefined) return null

  const parsed = Number(match[1])
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function toResourceVersionEtag(version: number): string {
  return `"${version}"`
}
