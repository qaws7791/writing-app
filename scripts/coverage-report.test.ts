import { describe, expect, it } from "bun:test"

import { readLcovLineCoverage } from "#scripts/coverage-report"

describe("LCOV line coverage", () => {
  it("대상 파일의 line baseline을 계산한다", () => {
    const lcov = [
      "TN:",
      "SF:src/example.ts",
      "DA:1,1",
      "DA:2,0",
      "LF:2",
      "LH:1",
      "end_of_record",
    ].join("\n")

    expect(readLcovLineCoverage(lcov, "src/example.ts")).toEqual({
      found: 2,
      hit: 1,
      percentage: 50,
    })
    expect(readLcovLineCoverage(lcov, "src/missing.ts")).toBeNull()
  })
})
