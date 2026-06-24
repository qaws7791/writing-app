import {
  adminArchiveResourceDocumentResultSchema,
  adminDeleteResourceDocumentResultSchema,
  adminResourceDocumentDetailDtoSchema,
  adminResourceDocumentListDtoSchema,
  type AdminArchiveResourceDocumentResultDto,
  type AdminDeleteResourceDocumentResultDto,
  type AdminResourceDocumentDetailDto,
  type AdminResourceDocumentListDto,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  AdminOwnerMutationResult,
  ArchiveAdminResourceDocumentInput,
  CreateAdminResourceDocumentInput,
  DeleteAdminResourceDocumentInput,
  ReadAdminResourceDocumentInput,
  ReadAdminResourceDocumentsInput,
  ResourceAdminRepository,
  UpdateAdminResourceDocumentInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"

export type AdminResourceUseCase = {
  readonly archiveResourceDocument: (
    input: ArchiveAdminResourceDocumentInput
  ) => Promise<AdminOwnerMutationResult<AdminArchiveResourceDocumentResultDto>>
  readonly createResourceDocument: (
    input: CreateAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto>
  readonly deleteResourceDocument: (
    input: DeleteAdminResourceDocumentInput
  ) => Promise<AdminOwnerMutationResult<AdminDeleteResourceDocumentResultDto>>
  readonly getResourceDocument: (
    input: ReadAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto | null>
  readonly getResourceDocuments: (
    input: ReadAdminResourceDocumentsInput
  ) => Promise<AdminResourceDocumentListDto>
  readonly updateResourceDocument: (
    input: UpdateAdminResourceDocumentInput
  ) => Promise<AdminResourceDocumentDetailDto | null>
}

export function createAdminResourceUseCase(
  resourceRepository: ResourceAdminRepository
): AdminResourceUseCase {
  return {
    async archiveResourceDocument(input) {
      return parseOwnerMutationResult(
        await resourceRepository.archiveResourceDocument(input),
        adminArchiveResourceDocumentResultSchema.parse
      )
    },
    async createResourceDocument(input) {
      return adminResourceDocumentDetailDtoSchema.parse(
        await resourceRepository.createResourceDocument(input)
      )
    },
    async deleteResourceDocument(input) {
      return parseOwnerMutationResult(
        await resourceRepository.deleteResourceDocument(input),
        adminDeleteResourceDocumentResultSchema.parse
      )
    },
    async getResourceDocument(input) {
      return adminResourceDocumentDetailDtoSchema
        .nullable()
        .parse(await resourceRepository.readResourceDocument(input))
    },
    async getResourceDocuments(input) {
      return adminResourceDocumentListDtoSchema.parse(
        await resourceRepository.readResourceDocuments(input)
      )
    },
    async updateResourceDocument(input) {
      return adminResourceDocumentDetailDtoSchema
        .nullable()
        .parse(await resourceRepository.updateResourceDocument(input))
    },
  }
}

function parseOwnerMutationResult<TValue>(
  result: AdminOwnerMutationResult<TValue>,
  parseValue: (value: TValue) => TValue
): AdminOwnerMutationResult<TValue> {
  if (result.kind !== "ok") {
    return result
  }

  return {
    kind: "ok",
    value: parseValue(result.value),
  }
}
