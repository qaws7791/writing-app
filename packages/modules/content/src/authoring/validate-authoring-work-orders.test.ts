import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { validateAuthoringWorkOrdersFromFiles } from "#content/authoring/validate-authoring-work-orders"

const repositoryRoot = process.cwd()

describe("validateAuthoringWorkOrdersFromFiles", () => {
  it("lead magnet work-orders를 통과한다", async () => {
    const issues = await validateAuthoringWorkOrdersFromFiles({
      lessonsRoot: resolve(repositoryRoot, "content-authoring/lead-magnet"),
      workOrdersPath: resolve(
        repositoryRoot,
        "content-authoring/lead-magnet/work-orders.json"
      ),
    })

    expect(issues).toEqual([])
  })
})
