import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  evaluateGuardrails,
  type Guardrail,
} from "./check-design-system-guardrails"

const rawHexGuardrail: Guardrail = {
  baseline: 1,
  description: "fixture raw hex color 기준선",
  label: "raw hex color",
  pattern: /#[0-9a-fA-F]{3,8}\b/g,
  roots: ["apps"],
}

describe("디자인 시스템 guardrail", () => {
  test("raw hex가 baseline보다 증가하면 실패한다", () => {
    using fixture = createFixture("#fff #000")

    expect(
      evaluateGuardrails([rawHexGuardrail], fixture.path).failures
    ).toEqual([expect.stringContaining("increased from 1 to 2")])
  })

  test("검출이 감소하면 baseline 갱신 없이는 실패한다", () => {
    using fixture = createFixture("색상 토큰만 사용")

    expect(
      evaluateGuardrails([rawHexGuardrail], fixture.path).failures
    ).toEqual([expect.stringContaining("decreased from 1 to 0")])
  })
})

function createFixture(
  content: string
): Disposable & { readonly path: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-guardrail-"))
  const appRoot = path.join(root, "apps")
  fs.mkdirSync(appRoot)
  fs.writeFileSync(path.join(appRoot, "fixture.tsx"), content)

  return {
    path: root,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}
