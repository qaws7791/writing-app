import { describe, expect, it } from "vitest"

import {
  evaluateImportRatchet,
  type ImportEdge,
} from "#repository-tooling/import-ratchet"
import type { RepositoryFile } from "#repository-tooling/repository-graph"

const existingEdge: ImportEdge = {
  source: "@fixture/runtime",
  sourcePath: "legacy.ts",
}

describe("import ratchet", () => {
  it("기준선과 정확히 같은 edge만 허용한다", () => {
    expect(
      evaluateImportRatchet({
        allowances: [existingEdge],
        files: [createFile(existingEdge)],
        matches: () => true,
      })
    ).toEqual({ status: "success" })
  })

  it("새 edge와 제거 뒤 남은 allowance를 각각 실패로 반환한다", () => {
    const newEdge: ImportEdge = {
      source: "@fixture/runtime",
      sourcePath: "new.ts",
    }

    expect(
      evaluateImportRatchet({
        allowances: [existingEdge],
        files: [createFile(newEdge)],
        matches: () => true,
      })
    ).toEqual({
      staleAllowances: [existingEdge],
      status: "failure",
      unexpectedEdges: [newEdge],
    })
  })
})

function createFile(edge: ImportEdge): RepositoryFile {
  return {
    path: edge.sourcePath,
    references: [
      {
        importedNames: [],
        kind: "import",
        runtime: true,
        source: edge.source,
      },
    ],
    relativePath: edge.sourcePath,
  }
}
