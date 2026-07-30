import { validate } from "@scalar/openapi-parser"
import { describe, expect, it } from "vitest"

import {
  createOpenApiDocuments,
  serializeOpenApiDocument,
} from "@/http/openapi-documents"

const httpMethods = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
])

const documents = createOpenApiDocuments()

const audienceDocuments = [
  ["admin", documents.admin as unknown],
  ["learner", documents.learner as unknown],
] as const

/** 각 audience에서 인증 실패 envelope을 대표하는 operation이다. */
const unauthorizedResponses = [
  ["admin", documents.admin as unknown, "/api/admin/session"],
  ["learner", documents.learner as unknown, "/profile"],
] as const

/** 관리자 문서에서 strict 응답 계약을 선언한 감사·분석 operation이다. */
const strictAdminResponsePaths = [
  "/api/admin/audit-events",
  "/api/admin/analytics/ai-feedback",
] as const

describe("생성 OpenAPI 문서", () => {
  it.each(audienceDocuments)(
    "%s 문서는 OpenAPI 3.1 schema 검증을 통과한다",
    async (_audience, document) => {
      const result = await validate(serializeOpenApiDocument(document))

      expect(result.errors ?? []).toEqual([])
      expect(result.valid).toBe(true)
      expect(document).toHaveProperty("openapi", "3.1.0")
    }
  )

  it("audience path를 분리하고 제거된 operation을 다시 노출하지 않는다", () => {
    const learnerOperations = readOperations(documents.learner)
    const adminOperations = readOperations(documents.admin)

    expect(learnerOperations.length).toBeGreaterThan(0)
    expect(adminOperations.length).toBeGreaterThan(0)
    expect(
      learnerOperations.filter((operation) =>
        operation.path.startsWith("/api/admin")
      )
    ).toEqual([])
    expect(
      adminOperations.filter(
        (operation) => !operation.path.startsWith("/api/admin")
      )
    ).toEqual([])
    expect(adminOperations).toContainEqual(
      expect.objectContaining({
        operationId: "getAdminAiFeedbackQuality",
        path: "/api/admin/analytics/ai-feedback",
      })
    )
  })

  it.each(audienceDocuments)(
    "%s 문서의 operationId는 서로 겹치지 않는다",
    (_audience, document) => {
      const operationIds = readOperations(document).map(
        (operation) => operation.operationId
      )

      expect(new Set(operationIds).size).toBe(operationIds.length)
    }
  )

  it.each(unauthorizedResponses)(
    "%s 문서의 401 응답은 requestId와 violations를 가진 strict envelope다",
    (_audience, document, path) => {
      expect(document).toHaveProperty(
        [
          "paths",
          path,
          "get",
          "responses",
          "401",
          "content",
          "application/json",
          "schema",
        ],
        expect.objectContaining({
          additionalProperties: false,
          properties: expect.objectContaining({
            requestId: expect.objectContaining({ type: "string" }),
            violations: expect.objectContaining({
              items: expect.objectContaining({ additionalProperties: false }),
            }),
          }),
          required: expect.arrayContaining(["code", "message", "requestId"]),
        })
      )
    }
  )

  it.each(strictAdminResponsePaths)(
    "관리자 %s 응답 schema는 예기치 않은 필드를 허용하지 않는다",
    (path) => {
      expect(documents.admin).toHaveProperty(
        [
          "paths",
          path,
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
          "additionalProperties",
        ],
        false
      )
    }
  )

  it("콘텐츠 이미지 upload의 multipart file을 binary required로 노출한다", () => {
    expect(documents.admin).toHaveProperty(
      [
        "paths",
        "/api/admin/courses/{courseId}/assets",
        "post",
        "requestBody",
        "content",
        "multipart/form-data",
        "schema",
      ],
      expect.objectContaining({
        properties: expect.objectContaining({
          file: { format: "binary", type: "string" },
        }),
        required: expect.arrayContaining(["file"]),
      })
    )
  })
})

type OpenApiOperation = Readonly<{
  method: string
  operationId: string
  path: string
}>

function readOperations(document: unknown): OpenApiOperation[] {
  if (!isRecord(document) || !isRecord(document["paths"])) return []

  return Object.entries(document["paths"]).flatMap(([path, pathItem]) => {
    if (!isRecord(pathItem)) return []

    return Object.entries(pathItem).flatMap(([method, operation]) => {
      if (
        !httpMethods.has(method) ||
        !isRecord(operation) ||
        typeof operation["operationId"] !== "string"
      ) {
        return []
      }

      return [{ method, operationId: operation["operationId"], path }]
    })
  })
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
