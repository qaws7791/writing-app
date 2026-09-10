export function isIndexedSearchQueryValid(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length === 0 || [...trimmed].length >= 3
}
