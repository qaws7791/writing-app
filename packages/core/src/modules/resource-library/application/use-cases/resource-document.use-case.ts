import type {
  AdminResourceDocumentDto,
  AdminResourceTreeNodeDto,
} from "@workspace/contracts/admin/resource-library-data"
import {
  normalizeResourceMarkdown,
  prepareResourceMarkdownImport,
  readResourceMarkdownPlainText,
} from "@workspace/resource-document/resource-markdown"

import type {
  ResourceDocumentRecord,
  ResourceDocumentRepository,
} from "#core/modules/resource-library/application/ports/resource-document.repository"
import type {
  ResourceDocumentInputRejection,
  ResourceDocumentInvalidMarkdown,
  ResourceTreeCommandRejection,
} from "#core/modules/resource-library/application/resource-library-error"
import {
  toResourceDocumentId,
  toResourceFolderId,
  type ResourceDocumentId,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ExportResourceDocumentQuery = {
  readonly documentId: string
}

export type ExportResourceDocumentResult =
  | { readonly kind: "not-found" }
  | {
      readonly kind: "ok"
      readonly value: { readonly fileName: string; readonly markdown: string }
    }

export type GetResourceDocumentQuery = {
  readonly documentId: string
}

export type ImportResourceDocumentCommand = {
  readonly actorId: string
  readonly fileName: string
  readonly markdown: string
  readonly now: Date
  readonly parentId: string | null
}

export type ImportedResourceDocument = {
  readonly document: AdminResourceDocumentDto
  readonly node: AdminResourceTreeNodeDto
}

export type ResourceDocumentImportResult =
  | ResourceDocumentInputRejection
  | ResourceTreeCommandRejection
  | {
      readonly kind: "ok"
      readonly value: ImportedResourceDocument
    }

export type SaveResourceDocumentCommand = {
  readonly actorId: string
  readonly contentMarkdown: string
  readonly documentId: string
  readonly expectedVersion: number
  readonly name: string
  readonly now: Date
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
  readonly exportDocument: (
    query: ExportResourceDocumentQuery
  ) => Promise<ExportResourceDocumentResult>
  readonly getDocument: (
    query: GetResourceDocumentQuery
  ) => Promise<AdminResourceDocumentDto | null>
  readonly importDocument: (
    command: ImportResourceDocumentCommand
  ) => Promise<ResourceDocumentImportResult>
  readonly saveDocument: (
    command: SaveResourceDocumentCommand
  ) => Promise<ResourceDocumentSaveResult>
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
      return document === null ? null : toDocumentData(document)
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
            value: {
              document: toDocumentData(result.value.document),
              node: {
                hasChildren: false,
                id: result.value.node.id,
                kind: "document",
                name: result.value.node.name,
                parentId: result.value.node.parentId,
                status: result.value.node.status,
              },
            },
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
        ? { ...result, document: toDocumentData(result.document) }
        : result
    },
  }
}

function toDocumentData(
  document: ResourceDocumentRecord
): AdminResourceDocumentDto {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    path: [...document.path],
    updatedAt: document.updatedAt.toISOString(),
  }
}

function readMarkdownFileNameTitle(fileName: string): string | null {
  return fileName.toLowerCase().endsWith(".md")
    ? fileName.slice(0, -3).trim()
    : null
}

function sanitizeMarkdownFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]|\p{Cc}/gu, "_")
}
