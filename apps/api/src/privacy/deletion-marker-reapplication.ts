import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  LearnerDeletionMarker,
  LearnerDeletionMarkerStorePort,
} from "@workspace/identity/ports"
import type { Clock } from "@workspace/kernel/clock"
import { err, ok, type Result } from "@workspace/kernel/result"

import { createDeletionMarkerReapplicationRepository } from "@/privacy/deletion-marker-reapplication.repository"

const deletedLearnerRetentionMs = 5 * 24 * 60 * 60 * 1_000

type DeletionMarkerReapplicationResult = Readonly<{
  alreadyAppliedUsers: number
  dryRun: boolean
  markerCount: number
  markedDeletedUsers: number
  missingUsers: number
  purgedUsers: number
  snapshotAt: Date
  uniqueUserCount: number
}>

export type DeletionMarkerReapplicationError = Readonly<{
  kind: "deletion-marker-reapplication-failed"
  stage: "database" | "input" | "marker-read"
}>

export type DeletionMarkerReapplication = Readonly<{
  execute: (input: {
    readonly batchSize: number
    readonly dryRun: boolean
    readonly snapshotAt: Date
  }) => Promise<
    Result<DeletionMarkerReapplicationResult, DeletionMarkerReapplicationError>
  >
}>

export function createDeletionMarkerReapplication(input: {
  readonly clock: Clock
  readonly database: WritingAppDatabase
  readonly markerStore: Pick<LearnerDeletionMarkerStorePort, "readAll">
}): DeletionMarkerReapplication {
  const repository = createDeletionMarkerReapplicationRepository(input.database)

  return {
    async execute(command) {
      const now = input.clock.now()
      if (
        !Number.isFinite(now.getTime()) ||
        !Number.isFinite(command.snapshotAt.getTime()) ||
        command.snapshotAt > now ||
        !Number.isInteger(command.batchSize) ||
        command.batchSize < 1 ||
        command.batchSize > 1_000
      ) {
        return err({
          kind: "deletion-marker-reapplication-failed",
          stage: "input",
        })
      }

      const stored = await input.markerStore.readAll()
      if (stored.isErr()) {
        return err({
          kind: "deletion-marker-reapplication-failed",
          stage: "marker-read",
        })
      }

      const markersAfterSnapshot = stored.value.filter(
        ({ requestedAt }) => requestedAt >= command.snapshotAt
      )
      const markers = selectEarliestMarkerPerUser(markersAfterSnapshot)
      const result = {
        alreadyAppliedUsers: 0,
        markedDeletedUsers: 0,
        missingUsers: 0,
        purgedUsers: 0,
      }
      const purgeCutoff = new Date(now.getTime() - deletedLearnerRetentionMs)

      for (
        let offset = 0;
        offset < markers.length;
        offset += command.batchSize
      ) {
        const applied = await repository.applyBatch({
          dryRun: command.dryRun,
          markers: markers.slice(offset, offset + command.batchSize),
          purgeCutoff,
        })
        if (applied.isErr()) {
          return err({
            kind: "deletion-marker-reapplication-failed",
            stage: "database",
          })
        }
        result.alreadyAppliedUsers += applied.value.alreadyAppliedUsers
        result.markedDeletedUsers += applied.value.markedDeletedUsers
        result.missingUsers += applied.value.missingUsers
        result.purgedUsers += applied.value.purgedUsers
      }

      return ok({
        ...result,
        dryRun: command.dryRun,
        markerCount: markersAfterSnapshot.length,
        snapshotAt: new Date(command.snapshotAt),
        uniqueUserCount: markers.length,
      })
    },
  }
}

function selectEarliestMarkerPerUser(
  markers: readonly LearnerDeletionMarker[]
): readonly LearnerDeletionMarker[] {
  const earliestByUserId = new Map<string, LearnerDeletionMarker>()
  for (const marker of markers) {
    const current = earliestByUserId.get(marker.userId)
    if (
      current === undefined ||
      marker.requestedAt.getTime() < current.requestedAt.getTime()
    ) {
      earliestByUserId.set(marker.userId, marker)
    }
  }
  return [...earliestByUserId.values()].sort(
    (left, right) =>
      left.requestedAt.getTime() - right.requestedAt.getTime() ||
      left.userId.localeCompare(right.userId)
  )
}
