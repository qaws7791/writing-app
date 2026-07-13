import { describe, expect, it } from "vitest"

import {
  findMissingUiStyleSentinels,
  uiStyleSentinels,
} from "#scripts/check-ui-style-compiled-css"

describe("UI style compiled CSS sentinel", () => {
  const completeCss = uiStyleSentinels
    .map((sentinel) => sentinel.marker)
    .join("\n")

  it("typography, animation, token, custom utility가 모두 있으면 통과한다", () => {
    expect(findMissingUiStyleSentinels(completeCss)).toEqual([])
  })

  it.each(uiStyleSentinels)("$label 누락을 검출한다", (missingSentinel) => {
    const incompleteCss = completeCss.replace(missingSentinel.marker, "")

    expect(findMissingUiStyleSentinels(incompleteCss)).toEqual([
      missingSentinel,
    ])
  })
})
