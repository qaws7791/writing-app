import { describe, expect, it } from "vitest"

import {
  normalizeApiHostAuthority,
  parseApiHostConfiguration,
} from "@/config/api-hosts"

describe("API Host 설정", () => {
  it("대소문자와 port를 canonical authority로 정규화한다", () => {
    const configuration = parseApiHostConfiguration({
      adminAllowedHosts: "Admin-Api.Example.test:0443,admin-api-unified:4000",
      learnerAllowedHosts: "API.Example.test,api:4000",
    })

    expect([...configuration.learner]).toEqual(["api.example.test", "api:4000"])
    expect([...configuration.admin]).toEqual([
      "admin-api.example.test:443",
      "admin-api-unified:4000",
    ])
  })

  it.each([
    "",
    " api.example.test",
    "api.example.test ",
    "https://api.example.test",
    "api.example.test/path",
    "user@api.example.test",
    "*.example.test",
    "api_example.test",
    "api..example.test",
    "api.example.test.",
    "api.example.test:0",
    "api.example.test:65536",
  ])("잘못된 authority %j를 거절한다", (authority) => {
    expect(() => normalizeApiHostAuthority(authority)).toThrow(
      "유효한 Host authority"
    )
  })

  it("빈 목록과 canonical 중복을 startup 오류로 처리한다", () => {
    expect(() =>
      parseApiHostConfiguration({
        adminAllowedHosts: "admin.example.test",
        learnerAllowedHosts: undefined,
      })
    ).toThrow("LEARNER_API_ALLOWED_HOSTS는 비어 있을 수 없습니다")
    expect(() =>
      parseApiHostConfiguration({
        adminAllowedHosts: "admin.example.test",
        learnerAllowedHosts: "API.EXAMPLE.test,api.example.test",
      })
    ).toThrow("중복 authority")
  })

  it("port가 달라도 두 audience가 같은 hostname을 공유하지 못하게 한다", () => {
    expect(() =>
      parseApiHostConfiguration({
        adminAllowedHosts: "api.example.test:4001",
        learnerAllowedHosts: "api.example.test:4000",
      })
    ).toThrow("같은 hostname을 공유할 수 없습니다")
  })
})
