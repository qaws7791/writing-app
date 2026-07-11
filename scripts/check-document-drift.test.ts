import { describe, expect, test } from "bun:test"
import path from "node:path"
import { pathToFileURL } from "node:url"

const documentDriftModuleUrl = pathToFileURL(
  path.join(import.meta.dir, "check-document-drift.ts")
).href

describe("문서 route drift fixture", () => {
  const healthRoute = { method: "GET", path: "/health" } as const
  const sessionRoute = { method: "GET", path: "/session" } as const

  test("실제 route가 추가되면 누락으로 실패한다", async () => {
    const { findRouteDrift } = await import(documentDriftModuleUrl)

    expect(findRouteDrift([healthRoute, sessionRoute], [healthRoute])).toEqual({
      missing: ["GET /session"],
      stale: [],
    })
  })

  test("실제 route가 삭제되면 오래된 문서로 실패한다", async () => {
    const { findRouteDrift } = await import(documentDriftModuleUrl)

    expect(findRouteDrift([healthRoute], [healthRoute, sessionRoute])).toEqual({
      missing: [],
      stale: ["GET /session"],
    })
  })
})
