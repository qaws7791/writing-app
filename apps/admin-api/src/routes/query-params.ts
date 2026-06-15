export function parsePositiveIntegerParam(input: {
  readonly fallback: number
  readonly max?: number
  readonly value: string | undefined
}): number | null {
  if (input.value === undefined || input.value.trim() === "") {
    return input.fallback
  }

  const parsed = Number(input.value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }

  if (input.max !== undefined && parsed > input.max) {
    return null
  }

  return parsed
}
