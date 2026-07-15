import { describe, expect, test } from "bun:test"

import {
  parseOsRelease,
  readChangedTaskCount,
  validateBootstrapEnvironment,
} from "./test-deployment-bootstrap"

const validEnvironment = {
  architecture: "x64",
  ci: "true",
  disposableUbuntu: "true",
  platform: "linux",
  release: { ID: "ubuntu", VERSION_ID: "24.04" },
} as const

describe("Ubuntu bootstrap 멱등성 계약", () => {
  test("Ubuntu 24.04 disposable CI만 허용한다", () => {
    expect(validateBootstrapEnvironment(validEnvironment)).toEqual([])
    expect(
      validateBootstrapEnvironment({
        ...validEnvironment,
        disposableUbuntu: undefined,
        platform: "win32",
      })
    ).toEqual(
      expect.arrayContaining([
        "bootstrap 멱등성 검증은 Linux에서만 실행할 수 있습니다.",
        "WRITING_APP_DISPOSABLE_UBUNTU=true로 일회성 호스트를 명시해야 합니다.",
      ])
    )
  })

  test("os-release의 따옴표 값을 해석한다", () => {
    expect(parseOsRelease('ID=ubuntu\nVERSION_ID="24.04"\n')).toEqual({
      ID: "ubuntu",
      VERSION_ID: "24.04",
    })
  })

  test("두 번째 Ansible recap의 changed 값을 읽는다", () => {
    expect(
      readChangedTaskCount(
        "integration : ok=12 changed=0 unreachable=0 failed=0 skipped=0"
      )
    ).toBe(0)
    expect(readChangedTaskCount("recap 없음")).toBeUndefined()
  })
})
