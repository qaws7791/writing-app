import { describe, expect, test } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  evaluateGuardrails,
  type Guardrail,
} from "./check-design-system-guardrails"

const rawHexGuardrail: Guardrail = {
  allowedPaths: ["apps/allowed.tsx"],
  description: "허용 파일 밖의 raw hex color",
  label: "raw hex color",
  pattern: /#[0-9a-fA-F]{3,8}\b/g,
  roots: ["apps"],
}

const semanticColorAliasGuardrail: Guardrail = {
  description: "미정의 semantic color alias",
  label: "legacy semantic color alias",
  pattern: /--semantic-color-[a-z0-9-]+/g,
  roots: ["apps"],
}

describe("디자인 시스템 guardrail", () => {
  test("허용되지 않은 raw hex를 발견하면 실패한다", () => {
    using fixture = createFixture("#fff #000")

    expect(
      evaluateGuardrails([rawHexGuardrail], fixture.path).failures
    ).toEqual([expect.stringContaining("raw hex color 2건")])
  })

  test("명시적 소유 파일의 raw hex는 허용한다", () => {
    using fixture = createFixture("색상 토큰만 사용", "#fff")

    expect(
      evaluateGuardrails([rawHexGuardrail], fixture.path).failures
    ).toEqual([])
  })

  test("미정의 semantic color alias를 검출한다", () => {
    using fixture = createFixture("var(--semantic-color-bg-canvas)")

    expect(
      evaluateGuardrails([semanticColorAliasGuardrail], fixture.path).failures
    ).toEqual([expect.stringContaining("legacy semantic color alias 1건")])
  })
})

function createFixture(
  content: string,
  allowedContent?: string
): Disposable & { readonly path: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-guardrail-"))
  const appRoot = path.join(root, "apps")
  fs.mkdirSync(appRoot)
  fs.writeFileSync(path.join(appRoot, "fixture.tsx"), content)
  if (allowedContent !== undefined) {
    fs.writeFileSync(path.join(appRoot, "allowed.tsx"), allowedContent)
  }

  return {
    path: root,
    [Symbol.dispose]() {
      fs.rmSync(root, { force: true, recursive: true })
    },
  }
}
