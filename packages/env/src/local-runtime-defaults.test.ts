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
      learnerApi: 4000,
      learnerWeb: 3000,
    })
  })

  it("로컬 URL은 같은 생성 규칙으로 만든다", () => {
    expect(localRuntimeDefaults).toEqual({
      adminApiBaseUrl: createLocalRuntimeUrl(
        localRuntimeHosts.admin,
        localRuntimePorts.learnerApi
      ),
      adminWebOrigin: createLocalRuntimeUrl(
        localRuntimeHosts.admin,
        localRuntimePorts.adminWeb
      ),
      learnerApiBaseUrl: createLocalRuntimeUrl(
        localRuntimeHosts.learner,
        localRuntimePorts.learnerApi
      ),
      learnerWebOrigin: createLocalRuntimeUrl(
        localRuntimeHosts.learner,
        localRuntimePorts.learnerWeb
      ),
    })
  })

  it("관리자와 학습자에 운영체제 DNS가 필요 없는 서로 다른 host를 사용한다", () => {
    expect(localRuntimeHosts).toEqual({
      admin: "127.0.0.1",
      learner: "localhost",
    })
  })
})
