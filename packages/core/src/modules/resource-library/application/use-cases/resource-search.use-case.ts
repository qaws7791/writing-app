import {
  adminResourceSearchDtoSchema,
  type AdminResourceSearchDto,
} from "@workspace/contracts/admin"

import type { ResourceSearchRepository } from "#core/modules/resource-library/application/ports/resource-search.repository"

export type ResourceSearchUseCase = {
  readonly search: (input: {
    readonly limit: number
    readonly query: string
  }) => Promise<AdminResourceSearchDto>
}

export function createResourceSearchUseCase(
  repository: ResourceSearchRepository
): ResourceSearchUseCase {
  return {
    async search(input) {
      const records = await repository.search(input)

      return adminResourceSearchDtoSchema.parse({ items: records })
    },
  }
}
