import {
  adminContentResetResultSchema,
  type AdminContentResetResultDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  ContentResetRepository,
  ResetAdminContentInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"
import {
  canExecuteOwnerMutation,
  type AdminOwnerMutationResult,
  type OwnerAdminCommand,
} from "@workspace/core/modules/admin/application/policies/admin-actor-policy"

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
      if (!canExecuteOwnerMutation(actor)) {
        return { kind: "forbidden" }
      }
      const value = adminContentResetResultSchema.parse(
        await contentResetRepository.resetContent(input)
      )
      return { kind: "ok", value }
    },
  }
}
