import { expect, test } from "bun:test"

import { applyImageOptimizerSecurityPolicy } from "@workspace/nextjs-config/image-optimizer-security"

test("image optimizer의 위험 decoder를 직접 차단한다", () => {
  const blockedOperations: string[][] = []

  applyImageOptimizerSecurityPolicy({
    block({ operation }) {
      blockedOperations.push(operation)
    },
  })

  expect(blockedOperations).toEqual([
    ["VipsForeignLoadNsgif", "VipsForeignLoadTiff", "VipsForeignLoadVips"],
  ])
})
