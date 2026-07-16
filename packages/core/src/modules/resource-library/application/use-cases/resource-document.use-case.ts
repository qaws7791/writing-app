import {
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
  type AdminImportResourceDocumentResultDto,
  type AdminResourceDocumentDto,
} from "@workspace/contracts/admin"
import {
  normalizeResourceMarkdown,
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
  type ResourceDocumentIssue,
} from "@workspace/resource-document/resource-markdown"

import type {
  ResourceDocumentRecord,
  ResourceDocumentRepository,
} from "#core/modules/resource-library/application/ports/resource-document.repository"
import type { ResourceTreeCommandRejection } from "#core/modules/resource-library/application/ports/resource-tree.repository"
import {
  toResourceDocumentId,
  toResourceFolderId,
  type ResourceDocumentId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceDocumentInvalidMarkdown = {
  readonly issues: readonly ResourceDocumentIssue[]
  readonly kind: "invalid-markdown"
}

export type ResourceDocumentImportResult =
  | ResourceDocumentInvalidMarkdown
  | { readonly kind: "invalid-file-name" }
  | ResourceTreeCommandRejection
  | {
      readonly kind: "ok"
      readonly value: AdminImportResourceDocumentResultDto
    }

export type ResourceDocumentSaveResult =
  | ResourceDocumentInvalidMarkdown
  | { readonly kind: "not-found" }
  | { readonly kind: "name-conflict" }
  | {
      readonly kind: "invalid-name"
      readonly reason: "empty" | "invalid-character" | "too-long"
    }
  | { readonly kind: "conflict"; readonly document: AdminResourceDocumentDto }
  | { readonly kind: "ok"; readonly document: AdminResourceDocumentDto }

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
  readonly importDocument: (input: {
    readonly actorId: string
    readonly fileName: string
    readonly markdown: string
    readonly now: Date
    readonly parentId: string | null
  }) => Promise<ResourceDocumentImportResult>
  readonly saveDocument: (input: {
    readonly actorId: string
    readonly contentMarkdown: string
    readonly documentId: string
    readonly expectedVersion: number
    readonly name: string
    readonly now: Date
  }) => Promise<ResourceDocumentSaveResult>
}

export function createResourceDocumentUseCase({
  createDocumentId,
  documentRepository,
}: {
  readonly createDocumentId: () => ResourceDocumentId
  readonly documentRepository: ResourceDocumentRepository
}): ResourceDocumentUseCase {
  return {
    async exportDocument({ documentId }) {
      const document = await documentRepository.readDocument(
        toResourceDocumentId(documentId)
      )
      if (document === null) return { kind: "not-found" }
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
      if (fileNameTitle === null) return { kind: "invalid-file-name" }

      const preparation = prepareResourceMarkdownImport(input.markdown)
      if (preparation.status === "invalid") {
        return { issues: preparation.issues, kind: "invalid-markdown" }
      }
      const plainText = readResourceMarkdownPlainText(preparation.markdown)
      if (plainText.status === "invalid") {
        throw new Error(
          "정규화한 자료 Markdown에서 검색 텍스트를 만들지 못했습니다."
        )
      }

      const result = await documentRepository.importDocument({
        actorId: input.actorId,
        bodyText: plainText.text,
        documentId: createDocumentId(),
        markdown: preparation.markdown,
        name: preparation.headingTitle ?? fileNameTitle,
        now: input.now,
        parentId:
          input.parentId === null ? null : toResourceFolderId(input.parentId),
      })
      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminImportResourceDocumentResultDtoSchema.parse({
              document: toDocumentDto(result.value.document),
              mutation: {
                node: {
                  hasChildren: false,
                  id: result.value.node.id,
                  kind: "document",
                  name: result.value.node.name,
                  parentId: result.value.node.parentId,
                  status: result.value.node.status,
                },
              },
            }),
          }
        : result
    },
    async saveDocument(input) {
      const normalized = normalizeResourceMarkdown(input.contentMarkdown)
      if (normalized.status === "invalid") {
        return { issues: normalized.issues, kind: "invalid-markdown" }
      }
      const plainText = readResourceMarkdownPlainText(normalized.markdown)
      if (plainText.status === "invalid") {
        throw new Error(
          "정규화한 자료 Markdown에서 검색 텍스트를 만들지 못했습니다."
        )
      }
      const result = await documentRepository.saveDocument({
        ...input,
        bodyText: plainText.text,
        contentMarkdown: normalized.markdown,
        documentId: toResourceDocumentId(input.documentId),
      })
      return result.kind === "ok" || result.kind === "conflict"
        ? { ...result, document: toDocumentDto(result.document) }
        : result
    },
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
