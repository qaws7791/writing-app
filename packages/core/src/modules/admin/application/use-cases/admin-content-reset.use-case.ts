import {
  adminContentResetResultSchema,
  type AdminContentResetResultDto,
} from "#core/modules/admin/domain/admin.dto"
import type {
  ContentResetRepository,
  ResetAdminContentInput,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  authorizeOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "#core/modules/admin/application/policies/admin-actor-policy"

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
      const value = adminContentResetResultSchema.parse(
        await contentResetRepository.resetContent(input)
      )
      return { kind: "ok", value }
    },
  }
}
