import { alphaValue } from "#alpha/domain/alpha-value"

export function createAlpha(id: string): string {
  return alphaValue(id)
}
