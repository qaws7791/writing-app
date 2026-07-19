import { describe, expect, it } from "vitest"

import {
  normalizeApiHostAuthority,
  parseApiHostConfiguration,
} from "@/config/api-hosts"

describe("API Host 설정", () => {
  it("대소문자와 port를 canonical authority로 정규화한다", () => {
    const configuration = parseApiHostConfiguration(
      "API.Example.test:0443,api:4000"
    )

    expect([...configuration]).toEqual(["api.example.test:443", "api:4000"])
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
    expect(() => parseApiHostConfiguration(undefined)).toThrow(
      "API_ALLOWED_HOSTS는 비어 있을 수 없습니다"
    )
    expect(() =>
      parseApiHostConfiguration("API.EXAMPLE.test,api.example.test")
    ).toThrow("중복 authority")
  })
})
