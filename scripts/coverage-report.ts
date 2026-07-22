import fs from "node:fs"
import path from "node:path"

export type LineCoverageThreshold = {
  readonly filePath: string
  readonly minimum: number
  readonly reportDirectory: string
}

export type LineCoverage = {
  readonly found: number
  readonly hit: number
  readonly percentage: number
}

export function aggregateLcovReports({
  coverageDirectory,
  reportDirectories,
}: {
  readonly coverageDirectory: string
  readonly reportDirectories: readonly string[]
}): string {
  const aggregatePath = path.join(coverageDirectory, "lcov.info")
  const aggregate = reportDirectories
    .map((directory) =>
      fs.readFileSync(
        path.join(coverageDirectory, directory, "lcov.info"),
        "utf8"
      )
    )
    .join("\n")

  fs.writeFileSync(aggregatePath, aggregate)
  return aggregatePath
}

export function assertLineCoverageThresholds({
  coverageDirectory,
  thresholds,
}: {
  readonly coverageDirectory: string
  readonly thresholds: readonly LineCoverageThreshold[]
}): void {
  for (const threshold of thresholds) {
    const lcov = fs.readFileSync(
      path.join(coverageDirectory, threshold.reportDirectory, "lcov.info"),
      "utf8"
    )
    const coverage = readLcovLineCoverage(lcov, threshold.filePath)

    if (coverage === null) {
      throw new Error(`핵심 coverage 파일이 없습니다: ${threshold.filePath}`)
    }
    if (coverage.percentage < threshold.minimum) {
      throw new Error(
        `${threshold.filePath} line coverage ${coverage.percentage.toFixed(2)}%가 ${threshold.minimum}% 미만입니다.`
      )
    }
  }
}

export function readLcovLineCoverage(
  lcov: string,
  filePath: string
): LineCoverage | null {
  const normalizedPath = filePath.replaceAll("/", "\\")
  const block = lcov
    .split("end_of_record")
    .find((record) => record.replaceAll("/", "\\").includes(normalizedPath))

  if (block === undefined) return null

  const found = Number(block.match(/\nLF:(\d+)/u)?.[1] ?? 0)
  const hit = Number(block.match(/\nLH:(\d+)/u)?.[1] ?? 0)

  return {
    found,
    hit,
    percentage: found === 0 ? 0 : (hit / found) * 100,
  }
}
