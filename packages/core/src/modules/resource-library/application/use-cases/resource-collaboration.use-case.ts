import type { ResourceCollaborationRepository } from "@workspace/core/modules/resource-library/application/ports/resource-collaboration.repository"
import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import {
  createResourceDocumentSnapshot,
  projectResourceDocumentSnapshot,
} from "@workspace/resource-document"
import { readResourceMarkdownPlainText } from "@workspace/resource-document/resource-markdown"

export type PrepareResourceCollaborationResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "inactive" }
  | { readonly kind: "invalid-state" }
  | {
      readonly kind: "ok"
      readonly value: {
        readonly snapshot: Uint8Array
        readonly stateVersion: number
      }
    }

export type FlushResourceCollaborationResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "inactive" }
  | { readonly kind: "invalid-state" }
  | {
      readonly actualStateVersion: number
      readonly kind: "stale-state-version"
    }
  | {
      readonly kind: "ok"
      readonly value: {
        readonly contentRevision: number
        readonly stateVersion: number
      }
    }

export type ResourceCollaborationUseCase = {
  readonly flush: (input: {
    readonly actorId: string
    readonly documentId: ResourceDocumentId
    readonly expectedStateVersion: number
    readonly now: Date
    readonly snapshot: Uint8Array
  }) => Promise<FlushResourceCollaborationResult>
  readonly prepare: (input: {
    readonly documentId: ResourceDocumentId
  }) => Promise<PrepareResourceCollaborationResult>
}

export function createResourceCollaborationUseCase(
  repository: ResourceCollaborationRepository
): ResourceCollaborationUseCase {
  return {
    async flush(input) {
      const projection = projectResourceDocumentSnapshot(input.snapshot)

      if (projection.status === "invalid") {
        return { kind: "invalid-state" }
      }

      const plainText = readResourceMarkdownPlainText(projection.markdown)

      if (plainText.status === "invalid") {
        return { kind: "invalid-state" }
      }

      return repository.flush({
        ...input,
        bodyText: plainText.text,
        markdown: projection.markdown,
      })
    },
    async prepare({ documentId }) {
      const loaded = await repository.load(documentId)

      if (loaded.kind !== "ok") {
        return loaded
      }

      if (loaded.value.snapshot === null) {
        const initialized = createResourceDocumentSnapshot(
          loaded.value.contentMarkdown
        )

        return initialized.status === "invalid"
          ? { kind: "invalid-state" }
          : {
              kind: "ok",
              value: {
                snapshot: initialized.snapshot,
                stateVersion: loaded.value.stateVersion,
              },
            }
      }

      const projection = projectResourceDocumentSnapshot(loaded.value.snapshot)

      if (
        projection.status === "invalid" ||
        projection.markdown !== loaded.value.contentMarkdown
      ) {
        return { kind: "invalid-state" }
      }

      return {
        kind: "ok",
        value: {
          snapshot: loaded.value.snapshot,
          stateVersion: loaded.value.stateVersion,
        },
      }
    },
  }
}
