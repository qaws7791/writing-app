import { describe, expect, it } from "vitest"

import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimePorts,
} from "#env/local-runtime-defaults"

describe("local runtime defaults", () => {
  it("문서화된 로컬 포트 계약을 한 곳에서 제공한다", () => {
    expect(localRuntimePorts).toEqual({
      adminApi: 4001,
      adminWeb: 3001,
      learnerApi: 4000,
      learnerWeb: 3000,
    })
  })

  it("로컬 URL은 같은 생성 규칙으로 만든다", () => {
    expect(localRuntimeDefaults).toEqual({
      adminApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.adminApi),
      adminWebOrigin: createLocalRuntimeUrl(localRuntimePorts.adminWeb),
      learnerApiBaseUrl: createLocalRuntimeUrl(localRuntimePorts.learnerApi),
      learnerWebOrigin: createLocalRuntimeUrl(localRuntimePorts.learnerWeb),
    })
  })
})
