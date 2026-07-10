import {
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
  type AdminImportResourceDocumentRequest,
  type AdminImportResourceDocumentResultDto,
  type AdminResourceDocumentDto,
  type AdminSaveResourceDocumentRequest,
} from "@workspace/contracts/admin"
import {
  normalizeResourceMarkdown,
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
  type ResourceDocumentIssue,
} from "@workspace/resource-document/resource-markdown-import"

import type {
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

export type ResourceDocumentSaveResult =
  | {
      readonly issues: readonly ResourceDocumentIssue[]
      readonly kind: "invalid-markdown"
    }
  | { readonly kind: "not-found" }
  | {
      readonly actualContentRevision: number
      readonly kind: "stale-content-revision"
    }
  | { readonly kind: "ok"; readonly value: AdminResourceDocumentDto }

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
  readonly saveDocument: (
    input: AdminSaveResourceDocumentRequest & {
      readonly actorId: string
      readonly documentId: string
      readonly now: Date
    }
  ) => Promise<ResourceDocumentSaveResult>
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
      const document = await documentRepository.readDocument(
        toResourceDocumentId(documentId)
      )

      if (document === null) {
        return { kind: "not-found" }
      }

      const heading = `# ${document.name}`

      return {
        kind: "ok",
        value: {
          fileName: `${sanitizeMarkdownFileName(document.name)}.md`,
          markdown:
            document.contentMarkdown.length === 0
              ? heading
              : `${heading}\n\n${document.contentMarkdown}`,
        },
      }
    },
    async getDocument({ documentId }) {
      const document = await documentRepository.readDocument(
        toResourceDocumentId(documentId)
      )

      return document === null ? null : toDocumentDto(document)
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
    async saveDocument(input) {
      const normalization = normalizeResourceMarkdown(input.markdown)

      if (normalization.status === "invalid") {
        return {
          issues: normalization.issues,
          kind: "invalid-markdown",
        }
      }

      const plainText = readResourceMarkdownPlainText(normalization.markdown)

      if (plainText.status === "invalid") {
        throw new Error(
          "정규화한 자료 Markdown에서 검색 텍스트를 만들지 못했습니다."
        )
      }

      const result = await documentRepository.saveDocument({
        actorId: input.actorId,
        bodyText: plainText.text,
        documentId: toResourceDocumentId(input.documentId),
        expectedContentRevision: input.expectedContentRevision,
        markdown: normalization.markdown,
        now: input.now,
      })

      return result.kind === "ok"
        ? { kind: "ok", value: toDocumentDto(result.value) }
        : result
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
      document: toDocumentDto(result.value.document),
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

function toDocumentDto(
  document: ResourceDocumentRecord
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
