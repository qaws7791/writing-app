import {
  executeBatch,
  requireBatchCondition,
  type DatabaseStatement,
} from "@workspace/db/batch"
import { eq, inArray, sql } from "drizzle-orm"
import { authSessions, authUsers } from "@workspace/auth/schema"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"
import { err, ok } from "@workspace/kernel/result"
import type { UserId } from "@workspace/types/ids"

import type {
  DeletionMarkerReapplicationRepository,
  LearnerDeletionMarker,
} from "#identity/application/identity-ports"
import { deletedLearnerDisplayName } from "#identity/domain/learner-profile"
import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

export function createDeletionMarkerReapplicationRepository(input: {
  readonly database: WritingAppDatabase
  readonly learnerDataPurges: readonly LearnerDataPurgePort[]
}): DeletionMarkerReapplicationRepository {
  return {
    async applyBatch(command) {
      try {
        const transaction = input.database
        const statements: DatabaseStatement[] = []
        const userIds = command.markers.map(({ userId }) => userId)
        const existingUserIds = new Set(
          (
            await Promise.all(
              chunkByBoundParameters(userIds, {
                fixedParameters: 0,
                parametersPerItem: 1,
              }).map(async (userIdChunk) =>
                (
                  await transaction
                    .select({ id: authUsers.id })
                    .from(authUsers)
                    .where(inArray(authUsers.id, userIdChunk))
                    .all()
                ).map(({ id }) => id)
              )
            )
          ).flat()
        )
        const profilesByUserId = new Map(
          (
            await Promise.all(
              chunkByBoundParameters(userIds, {
                fixedParameters: 0,
                parametersPerItem: 1,
              }).map(async (userIdChunk) =>
                (
                  await transaction
                    .select()
                    .from(learnerProfiles)
                    .where(inArray(learnerProfiles.userId, userIdChunk))
                    .all()
                ).map((profile) => [profile.userId, profile] as const)
              )
            )
          ).flat()
        )
        const result = classifyMarkers({
          existingUserIds,
          markers: command.markers,
          profilesByUserId,
          purgeCutoff: command.purgeCutoff,
        })
        if (command.dryRun) return ok(result.counts)

        for (const port of input.learnerDataPurges) {
          statements.push(...port.statements(transaction, result.purgeUserIds))
        }
        for (const marker of result.markDeletedMarkers) {
          const profile = profilesByUserId.get(marker.userId)
          statements.push(
            requireBatchCondition(
              transaction,
              profile === undefined
                ? sql`NOT EXISTS (SELECT 1 FROM ${learnerProfiles} WHERE ${learnerProfiles.userId} = ${marker.userId})`
                : sql`EXISTS (SELECT 1 FROM ${learnerProfiles} WHERE ${learnerProfiles.userId} = ${marker.userId} AND ${learnerProfiles.version} = ${profile.version})`
            )
          )
          if (profile === undefined) {
            statements.push(
              transaction.insert(learnerProfiles).values({
                deletedAt: marker.requestedAt,
                displayName: deletedLearnerDisplayName,
                status: "deleted",
                userId: marker.userId,
                version: 0,
              })
            )
          } else {
            statements.push(
              transaction
                .update(learnerProfiles)
                .set({
                  deletedAt:
                    profile.deletedAt === null ||
                    marker.requestedAt < profile.deletedAt
                      ? marker.requestedAt
                      : profile.deletedAt,
                  displayName: deletedLearnerDisplayName,
                  status: "deleted",
                  version: profile.version + 1,
                })
                .where(eq(learnerProfiles.userId, marker.userId))
            )
          }
        }
        const retainedUserIds = command.markers
          .map(({ userId }) => userId)
          .filter(
            (userId) =>
              existingUserIds.has(userId) &&
              !result.purgeUserIds.includes(userId)
          )
        for (const userIdChunk of chunkByBoundParameters(retainedUserIds, {
          fixedParameters: 0,
          parametersPerItem: 1,
        })) {
          statements.push(
            transaction
              .delete(authSessions)
              .where(inArray(authSessions.userId, userIdChunk))
          )
        }

        await executeBatch(transaction, statements)
        return ok(result.counts)
      } catch (cause) {
        return err({
          cause,
          kind: "deletion-marker-reapplication-persistence-failed",
        })
      }
    },
  }
}

function classifyMarkers(input: {
  readonly existingUserIds: ReadonlySet<string>
  readonly markers: readonly LearnerDeletionMarker[]
  readonly profilesByUserId: ReadonlyMap<
    string,
    typeof learnerProfiles.$inferSelect
  >
  readonly purgeCutoff: Date
}) {
  const markDeletedMarkers: LearnerDeletionMarker[] = []
  const purgeUserIds: UserId[] = []
  let alreadyAppliedUsers = 0
  let markedDeletedUsers = 0
  let missingUsers = 0
  let purgedUsers = 0

  for (const marker of input.markers) {
    if (!input.existingUserIds.has(marker.userId)) {
      missingUsers += 1
      continue
    }
    if (marker.requestedAt <= input.purgeCutoff) {
      purgeUserIds.push(marker.userId)
      purgedUsers += 1
      continue
    }

    const profile = input.profilesByUserId.get(marker.userId)
    if (
      profile?.status === "deleted" &&
      profile.deletedAt !== null &&
      profile.deletedAt <= marker.requestedAt
    ) {
      alreadyAppliedUsers += 1
      continue
    }
    markDeletedMarkers.push(marker)
    markedDeletedUsers += 1
  }

  return {
    counts: {
      alreadyAppliedUsers,
      markedDeletedUsers,
      missingUsers,
      purgedUsers,
    },
    markDeletedMarkers,
    purgeUserIds,
  }
}
