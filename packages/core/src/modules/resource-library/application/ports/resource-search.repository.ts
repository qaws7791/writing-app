import type {
  ResourceBreadcrumbItem,
  ResourceNodeId,
  ResourceTreeScope,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceSearchRecord = {
  readonly excerpt: string | null
  readonly id: ResourceNodeId
  readonly kind: "document" | "folder"
  readonly name: string
  readonly path: readonly ResourceBreadcrumbItem[]
}

export type ResourceSearchRepository = {
  readonly search: (input: {
    readonly limit: number
    readonly query: string
    readonly scope: ResourceTreeScope
  }) => Promise<readonly ResourceSearchRecord[]>
}
