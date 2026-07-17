import type {
  ModuleReference,
  RepositoryFile,
} from "#repository-tooling/repository-graph"

export type ImportEdge = {
  readonly source: string
  readonly sourcePath: string
}

export type ImportRatchetResult =
  | {
      readonly status: "success"
    }
  | {
      readonly staleAllowances: readonly ImportEdge[]
      readonly status: "failure"
      readonly unexpectedEdges: readonly ImportEdge[]
    }

export function evaluateImportRatchet({
  allowances,
  files,
  matches,
}: {
  readonly allowances: readonly ImportEdge[]
  readonly files: readonly RepositoryFile[]
  readonly matches: (input: {
    readonly file: RepositoryFile
    readonly reference: ModuleReference
  }) => boolean
}): ImportRatchetResult {
  const actualEdges = uniqueSortedEdges(
    files.flatMap((file) =>
      file.references
        .filter((reference) => matches({ file, reference }))
        .map((reference) => ({
          source: reference.source,
          sourcePath: file.relativePath,
        }))
    )
  )
  const expectedEdges = uniqueSortedEdges(allowances)
  const actualKeys = new Set(actualEdges.map(importEdgeKey))
  const expectedKeys = new Set(expectedEdges.map(importEdgeKey))
  const unexpectedEdges = actualEdges.filter(
    (edge) => !expectedKeys.has(importEdgeKey(edge))
  )
  const staleAllowances = expectedEdges.filter(
    (edge) => !actualKeys.has(importEdgeKey(edge))
  )

  return unexpectedEdges.length === 0 && staleAllowances.length === 0
    ? { status: "success" }
    : { staleAllowances, status: "failure", unexpectedEdges }
}

export function formatImportEdge(edge: ImportEdge): string {
  return `${edge.sourcePath} -> ${edge.source}`
}

function uniqueSortedEdges(edges: readonly ImportEdge[]): ImportEdge[] {
  return [
    ...new Map(edges.map((edge) => [importEdgeKey(edge), edge])).values(),
  ].sort((left, right) =>
    importEdgeKey(left).localeCompare(importEdgeKey(right))
  )
}

function importEdgeKey(edge: ImportEdge): string {
  return `${edge.sourcePath}\u0000${edge.source}`
}
