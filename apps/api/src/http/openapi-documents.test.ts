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

describe("생성 OpenAPI 문서", () => {
  it("admin과 learner 문서를 OpenAPI 3.1 schema로 검증한다", async () => {
    const documents = createOpenApiDocuments()

    for (const [audience, document] of Object.entries(documents)) {
      const result = await validate(serializeOpenApiDocument(document))
      expect(result.errors ?? [], audience).toEqual([])
      expect(result.valid, audience).toBe(true)
      expect(document.openapi).toBe("3.1.0")
    }
  })

  it("audience path를 분리하고 제거된 operation을 다시 노출하지 않는다", () => {
    const documents = createOpenApiDocuments()
    const learnerOperations = readOperations(documents.learner)
    const adminOperations = readOperations(documents.admin)

    expect(learnerOperations.length).toBeGreaterThan(0)
    expect(adminOperations.length).toBeGreaterThan(0)
    expect(
      learnerOperations.every(
        (operation) => !operation.path.startsWith("/api/admin")
      )
    ).toBe(true)
    expect(
      adminOperations.every((operation) =>
        operation.path.startsWith("/api/admin")
      )
    ).toBe(true)
    expect(adminOperations).toContainEqual(
      expect.objectContaining({
        operationId: "getAdminAiFeedbackQuality",
        path: "/api/admin/analytics/ai-feedback",
      })
    )

    for (const operation of [...learnerOperations, ...adminOperations]) {
      expect(`${operation.path} ${operation.operationId}`).not.toMatch(
        /resource|chat|reset/iu
      )
    }
  })

  it("각 문서의 operationId가 고유하고 canonical error schema를 포함한다", () => {
    const documents = createOpenApiDocuments()

    for (const [audience, document] of Object.entries(documents)) {
      const operationIds = readOperations(document).map(
        (operation) => operation.operationId
      )
      expect(new Set(operationIds).size, audience).toBe(operationIds.length)

      const serialized = serializeOpenApiDocument(document)
      expect(serialized).toContain('"requestId"')
      expect(serialized).toContain('"violations"')
    }
  })

  it("콘텐츠 이미지 upload의 multipart file을 binary required로 노출한다", () => {
    const { admin } = createOpenApiDocuments()
    const path = admin.paths["/api/admin/courses/{courseId}/assets"]
    expect(path).toBeDefined()

    const serialized = serializeOpenApiDocument(path)
    expect(serialized).toContain('"format": "binary"')
    expect(serialized).toMatch(/"required": \[[\s\S]*"file"[\s\S]*\]/u)
  })

  it("동일한 route source에서 byte-identical JSON을 생성한다", () => {
    const first = createOpenApiDocuments()
    const second = createOpenApiDocuments()

    expect(serializeOpenApiDocument(first.admin)).toBe(
      serializeOpenApiDocument(second.admin)
    )
    expect(serializeOpenApiDocument(first.learner)).toBe(
      serializeOpenApiDocument(second.learner)
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
