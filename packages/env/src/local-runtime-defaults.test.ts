import { describe, expect, it } from "vitest"

import {
  createLocalRuntimeUrl,
  localRuntimeDefaults,
  localRuntimeHosts,
  localRuntimePorts,
} from "#env/local-runtime-defaults"

describe("local runtime defaults", () => {
  it("문서화된 로컬 포트 계약을 한 곳에서 제공한다", () => {
    expect(localRuntimePorts).toEqual({
      adminWeb: 3001,
      api: 4000,
      learnerWeb: 3000,
    })
  })

  it("로컬 URL은 같은 생성 규칙으로 만든다", () => {
    expect(localRuntimeDefaults).toEqual({
      adminWebOrigin: createLocalRuntimeUrl(
        "localhost",
        localRuntimePorts.adminWeb
      ),
      apiBaseUrl: createLocalRuntimeUrl(
        localRuntimeHosts.api,
        localRuntimePorts.api
      ),
      learnerWebOrigin: createLocalRuntimeUrl(
        "localhost",
        localRuntimePorts.learnerWeb
      ),
    })
  })

  it("모든 API consumer가 운영체제 DNS가 필요 없는 단일 host를 사용한다", () => {
    expect(localRuntimeHosts).toEqual({ api: "localhost" })
  })
})
