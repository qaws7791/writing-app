import type { ResourceDocumentId, ResourceFolderId } from "@workspace/types/ids"

import type {
  ResourceCommandResult,
  ResourceLibraryDependencies,
} from "#resource-library/application/ports/resource-library-ports"
import { hydrateResourceDocument } from "#resource-library/application/resource-library-queries"
import {
  authorizeResourceAccess,
  type ResourceActor,
} from "#resource-library/domain/resource-access-policy"
import type { ResourceDocument } from "#resource-library/domain/resource-document"
import type { ResourceTreeNode } from "#resource-library/domain/resource-tree-node"

type ResourceDocumentImportResult = ResourceCommandResult<
  Readonly<{
    document: ResourceDocument
    node: ResourceTreeNode
  }>
>

type ResourceDocumentSaveResult = ResourceCommandResult<ResourceDocument>

export type ResourceDocumentApplication = Readonly<{
  exportDocument: (
    documentId: ResourceDocumentId
  ) => Promise<
    ResourceCommandResult<Readonly<{ fileName: string; markdown: string }>>
  >
  importDocument: (input: {
    readonly actor: ResourceActor
    readonly fileName: string
    readonly markdown: string
    readonly parentId: ResourceFolderId | null
  }) => Promise<ResourceDocumentImportResult>
  saveDocument: (input: {
    readonly actor: ResourceActor
    readonly contentMarkdown: string
    readonly documentId: ResourceDocumentId
    readonly expectedVersion: number
    readonly name: string
  }) => Promise<ResourceDocumentSaveResult>
}>

export type ResourceDocumentCommandPort = Pick<
  ResourceDocumentApplication,
  "saveDocument"
>

export function createResourceDocumentApplication(
  dependencies: Pick<
    ResourceLibraryDependencies,
    | "actorDirectory"
    | "clock"
    | "codec"
    | "documentIdGenerator"
    | "documentRepository"
  >
): ResourceDocumentApplication {
  return Object.freeze({
    async exportDocument(documentId) {
      const record =
        await dependencies.documentRepository.readDocument(documentId)
      if (record === null) {
        return {
          kind: "resource-not-found",
          target: "document",
        }
      }
      const heading = `# ${record.name}`
      return {
        kind: "ok",
        value: {
          fileName: `${sanitizeMarkdownFileName(record.name)}.md`,
          markdown:
            record.contentMarkdown.length === 0
              ? heading
              : `${heading}\n\n${record.contentMarkdown}`,
        },
      }
    },
    async importDocument(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return { kind: "resource-forbidden" }
      }
      const fileNameTitle = readMarkdownFileNameTitle(input.fileName)
      if (fileNameTitle === null) {
        return {
          kind: "resource-validation",
          reason: "file-name-invalid",
        }
      }

      const preparation = dependencies.codec.prepareImport(input.markdown)
      if (preparation.status === "invalid") {
        return {
          issues: preparation.issues,
          kind: "resource-validation",
          reason: "markdown-invalid",
        }
      }
      const plainText = dependencies.codec.readPlainText(preparation.markdown)
      if (plainText.status === "invalid") {
        return {
          kind: "resource-validation",
          reason: "markdown-invalid",
        }
      }

      try {
        const result = await dependencies.documentRepository.importDocument({
          actorId: input.actor.id,
          bodyText: plainText.text,
          documentId: dependencies.documentIdGenerator.next(),
          markdown: preparation.markdown,
          name: preparation.headingTitle ?? fileNameTitle,
          now: dependencies.clock.now(),
          parentId: input.parentId,
        })
        if (result.kind !== "ok") return result

        return {
          kind: "ok",
          value: {
            document: await hydrateResourceDocument(
              result.value.document,
              dependencies.actorDirectory
            ),
            node: result.value.node,
          },
        }
      } catch {
        return {
          kind: "resource-persistence-failure",
          operation: "import-document",
        }
      }
    },
    async saveDocument(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return { kind: "resource-forbidden" }
      }
      const normalized = dependencies.codec.normalize(input.contentMarkdown)
      if (normalized.status === "invalid") {
        return {
          issues: normalized.issues,
          kind: "resource-validation",
          reason: "markdown-invalid",
        }
      }
      const plainText = dependencies.codec.readPlainText(normalized.markdown)
      if (plainText.status === "invalid") {
        return {
          kind: "resource-validation",
          reason: "markdown-invalid",
        }
      }

      try {
        const result = await dependencies.documentRepository.saveDocument({
          actorId: input.actor.id,
          bodyText: plainText.text,
          contentMarkdown: normalized.markdown,
          documentId: input.documentId,
          expectedVersion: input.expectedVersion,
          name: input.name,
          now: dependencies.clock.now(),
        })
        if (result.kind === "stale-version") {
          return {
            document: await hydrateResourceDocument(
              result.document,
              dependencies.actorDirectory
            ),
            kind: "resource-conflict",
            reason: "stale-version",
          }
        }
        if (result.kind !== "ok") return result

        return {
          kind: "ok",
          value: await hydrateResourceDocument(
            result.value,
            dependencies.actorDirectory
          ),
        }
      } catch {
        return {
          kind: "resource-persistence-failure",
          operation: "save-document",
        }
      }
    },
  })
}

function readMarkdownFileNameTitle(fileName: string): string | null {
  if (!fileName.toLowerCase().endsWith(".md")) return null
  const title = fileName.slice(0, -3).trim()
  return title.length === 0 ? null : title
}

function sanitizeMarkdownFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]|\p{Cc}/gu, "_")
}
