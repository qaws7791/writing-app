import { err, ok, type Result } from "@workspace/kernel/result"

import type {
  ContentApplicationDependencies,
  OrphanedContentAssetCandidate,
} from "#content/application/ports/content-ports"
import type { ContentError } from "#content/domain/content-error"

export type CleanupOrphanedAssetsInput = Readonly<{
  batchSize: number
  cutoff: Date
  dryRun: boolean
}>

export type CleanupOrphanedAssetsResult = Readonly<{
  deleted: number
  retained: number
  scanned: number
}>

export type CleanupOrphanedAssets = (
  input: CleanupOrphanedAssetsInput
) => Promise<Result<CleanupOrphanedAssetsResult, ContentError>>

export function createCleanupOrphanedAssets(
  dependencies: Pick<
    ContentApplicationDependencies,
    "assetStorage" | "repository"
  >
): CleanupOrphanedAssets {
  return async (input) => {
    if (!isValidInput(input)) {
      return err({ kind: "content-maintenance-invalid" })
    }

    const candidates =
      await dependencies.repository.listOrphanedAssetCandidates(input)
    if (candidates.isErr()) return err(candidates.error)

    if (input.dryRun || candidates.value.length === 0) {
      return ok(
        toCleanupResult({
          candidates: candidates.value,
          deleted: 0,
        })
      )
    }
    if (dependencies.assetStorage === null) {
      return err({
        compensation: "not-required",
        kind: "content-asset-storage-failed",
        operation: "cleanup-delete",
        retryable: false,
      })
    }

    const objectDeletion = await deleteCandidateObjects(
      dependencies.assetStorage,
      candidates.value
    )
    if (objectDeletion.isErr()) return err(objectDeletion.error)

    const deleted = await dependencies.repository.deleteOrphanedAssetCandidates(
      {
        assetIds: candidates.value.map(({ id }) => id),
        cutoff: input.cutoff,
      }
    )
    if (deleted.isErr()) return err(deleted.error)

    return ok(
      toCleanupResult({
        candidates: candidates.value,
        deleted: deleted.value,
      })
    )
  }
}

function isValidInput(input: CleanupOrphanedAssetsInput): boolean {
  return (
    Number.isFinite(input.cutoff.getTime()) &&
    Number.isInteger(input.batchSize) &&
    input.batchSize >= 1 &&
    input.batchSize <= 1_000
  )
}

async function deleteCandidateObjects(
  storage: NonNullable<ContentApplicationDependencies["assetStorage"]>,
  candidates: readonly OrphanedContentAssetCandidate[]
): Promise<
  Result<void, Extract<ContentError, { kind: "content-asset-storage-failed" }>>
> {
  try {
    const deleted = await storage.deleteObjects(
      candidates.map(({ objectKey }) => objectKey)
    )
    return deleted.isOk()
      ? ok(undefined)
      : err({
          compensation: "not-required",
          kind: "content-asset-storage-failed",
          operation: "cleanup-delete",
          retryable: deleted.error.retryable,
        })
  } catch (cause) {
    return err({
      cause,
      compensation: "not-required",
      kind: "content-asset-storage-failed",
      operation: "cleanup-delete",
      retryable: true,
    })
  }
}

function toCleanupResult(input: {
  readonly candidates: readonly OrphanedContentAssetCandidate[]
  readonly deleted: number
}): CleanupOrphanedAssetsResult {
  return {
    deleted: input.deleted,
    retained: input.candidates.length - input.deleted,
    scanned: input.candidates.length,
  }
}
