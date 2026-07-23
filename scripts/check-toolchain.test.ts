import { describe, expect, test } from "bun:test"

import {
  readToolchainContract,
  validateToolchainRuntime,
} from "#scripts/check-toolchain"

describe("toolchain 계약", () => {
  test("manifest의 exact Bun과 Node major를 읽는다", () => {
    expect(
      readToolchainContract({
        engines: { node: "24.x" },
        packageManager: "bun@1.3.10",
      })
    ).toEqual({
      contract: {
        bunVersion: "1.3.10",
        nodeMajor: 24,
        nodeRange: "24.x",
      },
      kind: "valid",
    })
  })

  test("범위 Bun version과 exact Node patch를 거부한다", () => {
    const result = readToolchainContract({
      engines: { node: "24.15.0" },
      packageManager: "bun@^1.3.10",
    })

    expect(result.kind).toBe("invalid")
  })

  test("실행 중인 Bun floor는 허용하고 Node major 불일치는 거부한다", () => {
    const contract = {
      bunVersion: "1.3.10",
      nodeMajor: 24,
      nodeRange: "24.x",
    } as const

    expect(
      validateToolchainRuntime(contract, {
        bunVersion: "1.3.14",
        nodeVersion: "22.18.0",
      })
    ).toHaveLength(1)
  })
})
