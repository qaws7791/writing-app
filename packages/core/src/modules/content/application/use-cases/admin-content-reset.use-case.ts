import type { AdminContentResetResultDto } from "@workspace/contracts/admin/content-data"
import type {
  ContentResetRepository,
  ResetAdminContentInput,
} from "#core/modules/content/application/ports/admin-content.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "#core/shared/admin-owner-authorization"

export type AdminContentResetUseCase = {
  readonly resetContent: (
    input: OwnerAdminCommand<ResetAdminContentInput>
  ) => Promise<AdminOwnerMutationResult<AdminContentResetResultDto>>
}

export function createAdminContentResetUseCase(
  contentResetRepository: ContentResetRepository
): AdminContentResetUseCase {
  return {
    async resetContent({ actor, ...input }) {
      const authorization = authorizeOwnerMutation(actor)
      if (authorization !== "allowed") return { kind: authorization }
      const value = await contentResetRepository.resetContent(input)
      return { kind: "ok", value }
    },
  }
}
