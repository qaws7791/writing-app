import {
  adminContentResetResultSchema,
  type AdminContentResetResultDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  ContentResetRepository,
  ResetAdminContentInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminContentResetUseCase = {
  readonly resetContent: (
    input: ResetAdminContentInput
  ) => Promise<AdminContentResetResultDto>
}

export function createAdminContentResetUseCase(
  contentResetRepository: ContentResetRepository
): AdminContentResetUseCase {
  return {
    async resetContent(input) {
      return adminContentResetResultSchema.parse(
        await contentResetRepository.resetContent(input)
      )
    },
  }
}
