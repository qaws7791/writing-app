import type { AdminResourceSearchItemDto } from "@workspace/contracts/admin/resource-library-data"

import type { ResourceSearchRepository } from "#core/modules/resource-library/application/ports/resource-search.repository"

export type SearchResourcesQuery = {
  readonly limit: number
  readonly query: string
}

export type ResourceSearchResult = {
  readonly items: readonly AdminResourceSearchItemDto[]
}

export type ResourceSearchUseCase = {
  readonly search: (
    query: SearchResourcesQuery
  ) => Promise<ResourceSearchResult>
}

export function createResourceSearchUseCase(
  repository: ResourceSearchRepository
): ResourceSearchUseCase {
  return {
    async search(query) {
      const records = await repository.search(query)

      return {
        items: records.map((record) => ({
          ...record,
          path: [...record.path],
        })),
      }
    },
  }
}
