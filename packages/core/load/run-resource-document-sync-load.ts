import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import {
  runResourceDocumentLoadIteration,
  type ResourceDocumentLoadMetrics,
} from "@load/resource-document-sync-load-fixture"

const defaultRunCount = 3
const thresholds = {
  maximumP95Milliseconds: 10_000,
  maximumP99Milliseconds: 15_000,
  maximumRetryCount: 500,
} as const

const runCount = readPositiveInteger(
  process.env["RESOURCE_LIBRARY_LOAD_RUNS"],
  defaultRunCount
)
const artifactPath = resolve(
  process.env["RESOURCE_LIBRARY_LOAD_ARTIFACT"] ??
    "../../artifacts/resource-library-load/latest.json"
)
const runs: ResourceDocumentLoadMetrics[] = []

for (let index = 0; index < runCount; index += 1) {
  const metrics = await runResourceDocumentLoadIteration()
  assertThresholds(metrics, index + 1)
  runs.push(metrics)
}

const artifact = {
  generatedAt: new Date().toISOString(),
  runCount,
  runs,
  thresholds,
}
mkdirSync(dirname(artifactPath), { recursive: true })
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`)
process.stdout.write(`artifact: ${artifactPath}\n`)

function assertThresholds(
  metrics: ResourceDocumentLoadMetrics,
  runNumber: number
): void {
  const failures = [
    metrics.acceptedTransactions === metrics.clientCount
      ? null
      : `승인 ${metrics.acceptedTransactions}/${metrics.clientCount}`,
    metrics.convergenceCount === metrics.clientCount
      ? null
      : `수렴 ${metrics.convergenceCount}/${metrics.clientCount}`,
    metrics.snapshotFallbackCount === 1
      ? null
      : `snapshot fallback ${metrics.snapshotFallbackCount}`,
    metrics.busyCount === 1 && metrics.busyRetryCount === 1
      ? null
      : `busy/retry ${metrics.busyCount}/${metrics.busyRetryCount}`,
    metrics.retryCount <= thresholds.maximumRetryCount
      ? null
      : `retry ${metrics.retryCount}`,
    metrics.latencyMilliseconds.p95 <= thresholds.maximumP95Milliseconds
      ? null
      : `p95 ${metrics.latencyMilliseconds.p95}ms`,
    metrics.latencyMilliseconds.p99 <= thresholds.maximumP99Milliseconds
      ? null
      : `p99 ${metrics.latencyMilliseconds.p99}ms`,
  ].filter((failure): failure is string => failure !== null)

  if (failures.length > 0) {
    throw new Error(`부하 실행 ${runNumber} 실패: ${failures.join(", ")}`)
  }
}

function readPositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined) return fallback
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("RESOURCE_LIBRARY_LOAD_RUNS는 양의 정수여야 합니다.")
  }
  return parsed
}
