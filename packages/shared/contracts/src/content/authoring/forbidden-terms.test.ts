import { describe, expect, it } from "vitest"

import { findForbiddenBrandTerms } from "#contracts/content/authoring/forbidden-terms"

describe("findForbiddenBrandTerms", () => {
  it("단독 브랜드 이름을 찾는다", () => {
    expect(findForbiddenBrandTerms("슬랙에 올린 공지")).toEqual(["슬랙"])
  })

  it("한글 활용형 안의 부분 문자열은 건너뛴다", () => {
    expect(findForbiddenBrandTerms("비록 비가 올지라도")).toEqual([])
    expect(findForbiddenBrandTerms("비록 ~ㄹ지라도")).toEqual([])
  })
})
