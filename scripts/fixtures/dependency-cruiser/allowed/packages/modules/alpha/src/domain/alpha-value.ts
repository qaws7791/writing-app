import type { FixtureId } from "@fixture/types/id"

import type { AlphaLeft } from "#alpha/domain/alpha-left"

export function alphaValue(value: string): FixtureId {
  return value as FixtureId
}

export type AlphaValue = AlphaLeft
