import type {
  ResourceBreadcrumbItem,
  ResourceDocumentId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceSearchRecord = {
  readonly excerpt: string | null
  readonly id: ResourceDocumentId
  readonly name: string
  readonly path: readonly ResourceBreadcrumbItem[]
  readonly version: number
}

export type ResourceSearchRepository = {
  readonly search: (input: {
    readonly limit: number
    readonly query: string
  }) => Promise<readonly ResourceSearchRecord[]>
}
