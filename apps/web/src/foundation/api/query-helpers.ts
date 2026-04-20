export function getPositiveId(value: number | undefined): number | null {
  return value !== undefined && value > 0 ? value : null
}

export function requirePositiveId(
  value: number | null,
  errorMessage: string
): number {
  if (value === null) {
    throw new Error(errorMessage)
  }

  return value
}
