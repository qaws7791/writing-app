import { describe, expect, it } from "vitest"
import type { AdminId } from "@workspace/types/ids"

import {
  nextResourceDocumentVersion,
  validateResourceDocumentVersion,
  type ResourceDocument,
} from "#resource-library/domain/resource-document"
import { readResourceDocumentId } from "#resource-library/domain/resource-tree-node"

const actor = Object.freeze({
  email: "admin@example.com",
  id: "admin-1" as AdminId,
  name: "관리자",
})
const document: ResourceDocument = Object.freeze({
  contentMarkdown: "본문",
  createdAt: new Date("2026-07-18T00:00:00.000Z"),
  createdBy: actor,
  id: readResourceDocumentId("document-1"),
  name: "운영 기준",
  parentId: null,
  path: Object.freeze([]),
  status: "active",
  updatedAt: new Date("2026-07-18T00:00:00.000Z"),
  updatedBy: actor,
  version: 3,
})

describe("resource document version policy", () => {
  it("현재 ETag version만 허용하고 stale version에는 최신 문서를 포함한다", () => {
    expect(validateResourceDocumentVersion(document, 3).isOk()).toBe(true)
    expect(
      validateResourceDocumentVersion(document, 2)._unsafeUnwrapErr()
    ).toEqual({
      document,
      kind: "resource-conflict",
      reason: "stale-version",
    })
    expect(nextResourceDocumentVersion(3)).toBe(4)
  })

  it.each([-1, Number.MAX_SAFE_INTEGER + 1, 1.5])(
    "유효하지 않은 version %s 증가를 거절한다",
    (version) => {
      expect(() => nextResourceDocumentVersion(version)).toThrow(TypeError)
    }
  )
})
