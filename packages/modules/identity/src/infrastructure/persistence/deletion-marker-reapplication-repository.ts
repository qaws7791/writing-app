import { eq, inArray } from "drizzle-orm"
import { authSessions, authUsers } from "@workspace/auth/schema"
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
        return ok(
          input.database.transaction(
            (transaction) => {
              const userIds = command.markers.map(({ userId }) => userId)
              const existingUserIds = new Set(
                transaction
                  .select({ id: authUsers.id })
                  .from(authUsers)
                  .where(inArray(authUsers.id, userIds))
                  .all()
                  .map(({ id }) => id)
              )
              const profilesByUserId = new Map(
                transaction
                  .select()
                  .from(learnerProfiles)
                  .where(inArray(learnerProfiles.userId, userIds))
                  .all()
                  .map((profile) => [profile.userId, profile])
              )
              const result = classifyMarkers({
                existingUserIds,
                markers: command.markers,
                profilesByUserId,
                purgeCutoff: command.purgeCutoff,
              })
              if (command.dryRun) return result.counts

              for (const port of input.learnerDataPurges) {
                port.purge(transaction, result.purgeUserIds)
              }
              for (const marker of result.markDeletedMarkers) {
                const profile = profilesByUserId.get(marker.userId)
                if (profile === undefined) {
                  transaction
                    .insert(learnerProfiles)
                    .values({
                      deletedAt: marker.requestedAt,
                      displayName: deletedLearnerDisplayName,
                      status: "deleted",
                      userId: marker.userId,
                      version: 0,
                    })
                    .run()
                } else {
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
                    .run()
                }
              }
              const retainedUserIds = command.markers
                .map(({ userId }) => userId)
                .filter(
                  (userId) =>
                    existingUserIds.has(userId) &&
                    !result.purgeUserIds.includes(userId)
                )
              if (retainedUserIds.length > 0) {
                transaction
                  .delete(authSessions)
                  .where(inArray(authSessions.userId, retainedUserIds))
                  .run()
              }

              return result.counts
            },
            { behavior: "immediate" }
          )
        )
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
