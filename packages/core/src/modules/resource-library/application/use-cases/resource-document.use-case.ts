import {
  adminImportResourceDocumentResultDtoSchema,
  adminResourceActiveDocumentDtoSchema,
  adminResourceDocumentDtoSchema,
  type AdminImportResourceDocumentRequest,
  type AdminImportResourceDocumentResultDto,
  type AdminResourceDocumentDto,
} from "@workspace/contracts/admin"
import {
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
  type ResourceDocumentIssue,
} from "@workspace/resource-document/resource-markdown-import"

import type {
  ResourceDocumentMetadataRecord,
  ResourceDocumentRecord,
  ResourceDocumentRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-document.repository"
import type { ResourceTreeCommandRejection } from "@workspace/core/modules/resource-library/application/ports/resource-tree.repository"
import {
  toResourceDocumentId,
  toResourceFolderId,
  type ResourceAuditEventId,
  type ResourceDocumentId,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"

export type ResourceDocumentImportResult =
  | {
      readonly issues: readonly ResourceDocumentIssue[]
      readonly kind: "invalid-markdown"
    }
  | {
      readonly kind: "invalid-file-name"
    }
  | ResourceTreeCommandRejection
  | {
      readonly kind: "ok"
      readonly value: AdminImportResourceDocumentResultDto
    }

export type ResourceDocumentUseCase = {
  readonly exportDocument: (input: { readonly documentId: string }) => Promise<
    | { readonly kind: "not-found" }
    | {
        readonly kind: "ok"
        readonly value: { readonly fileName: string; readonly markdown: string }
      }
  >
  readonly getDocument: (input: {
    readonly documentId: string
  }) => Promise<AdminResourceDocumentDto | null>
  readonly importDocument: (
    input: AdminImportResourceDocumentRequest & {
      readonly actorId: string
      readonly now: Date
    }
  ) => Promise<ResourceDocumentImportResult>
}

export type ResourceDocumentUseCaseDependencies = {
  readonly createAuditEventId: () => ResourceAuditEventId
  readonly createDocumentId: () => ResourceDocumentId
  readonly documentRepository: ResourceDocumentRepository
}

export function createResourceDocumentUseCase({
  createAuditEventId,
  createDocumentId,
  documentRepository,
}: ResourceDocumentUseCaseDependencies): ResourceDocumentUseCase {
  return {
    async exportDocument({ documentId }) {
      const resourceDocumentId = toResourceDocumentId(documentId)
      const [document, contentMarkdown] = await Promise.all([
        documentRepository.readDocumentMetadata(resourceDocumentId),
        documentRepository.readDocumentContent(resourceDocumentId),
      ])

      if (document === null || contentMarkdown === null) {
        return { kind: "not-found" }
      }

      const heading = `# ${document.name}`

      return {
        kind: "ok",
        value: {
          fileName: `${sanitizeMarkdownFileName(document.name)}.md`,
          markdown:
            contentMarkdown.length === 0
              ? heading
              : `${heading}\n\n${contentMarkdown}`,
        },
      }
    },
    async getDocument({ documentId }) {
      const resourceDocumentId = toResourceDocumentId(documentId)
      const document =
        await documentRepository.readDocumentMetadata(resourceDocumentId)

      if (document === null) return null
      if (document.status === "active") return toDocumentDto(document)

      const contentMarkdown =
        await documentRepository.readDocumentContent(resourceDocumentId)

      return contentMarkdown === null
        ? null
        : toDocumentDto({ ...document, contentMarkdown })
    },
    async importDocument(input) {
      const fileNameTitle = readMarkdownFileNameTitle(input.fileName)

      if (fileNameTitle === null) {
        return { kind: "invalid-file-name" }
      }

      const preparation = prepareResourceMarkdownImport(input.markdown)

      if (preparation.status === "invalid") {
        return {
          issues: preparation.issues,
          kind: "invalid-markdown",
        }
      }

      const plainText = readResourceMarkdownPlainText(preparation.markdown)

      if (plainText.status === "invalid") {
        throw new Error(
          "정규화한 자료 Markdown에서 검색 텍스트를 만들지 못했습니다."
        )
      }

      const result = await documentRepository.importDocument({
        actorId: input.actorId,
        auditEventId: createAuditEventId(),
        bodyText: plainText.text,
        documentId: createDocumentId(),
        expectedRevision: input.expectedRevision,
        markdown: preparation.markdown,
        name: preparation.headingTitle ?? fileNameTitle,
        now: input.now,
        parentId:
          input.parentId === null ? null : toResourceFolderId(input.parentId),
      })

      return mapImportResult(result)
    },
  }
}

function mapImportResult(
  result: Awaited<ReturnType<ResourceDocumentRepository["importDocument"]>>
): ResourceDocumentImportResult {
  if (result.kind !== "ok") {
    return result
  }

  return {
    kind: "ok",
    value: adminImportResourceDocumentResultDtoSchema.parse({
      document: toActiveDocumentDto(result.value.document),
      mutation: {
        ...result.value.mutation,
        node: {
          hasChildren: false,
          id: result.value.mutation.node.id,
          kind: "document",
          name: result.value.mutation.node.name,
          parentId: result.value.mutation.node.parentId,
          sortOrder: result.value.mutation.node.sortOrder,
          status: result.value.mutation.node.status,
        },
      },
    }),
  }
}

function toActiveDocumentDto(
  document: ResourceDocumentRecord
): AdminImportResourceDocumentResultDto["document"] {
  if (document.status !== "active") {
    throw new Error("가져온 자료 문서가 활성 상태가 아닙니다.")
  }

  return adminResourceActiveDocumentDtoSchema.parse({
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  })
}

function toDocumentDto(
  document: ResourceDocumentMetadataRecord | ResourceDocumentRecord
): AdminResourceDocumentDto {
  return adminResourceDocumentDtoSchema.parse({
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  })
}

function readMarkdownFileNameTitle(fileName: string): string | null {
  return fileName.toLowerCase().endsWith(".md")
    ? fileName.slice(0, -3).trim()
    : null
}

function sanitizeMarkdownFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]|\p{Cc}/gu, "_")
}
