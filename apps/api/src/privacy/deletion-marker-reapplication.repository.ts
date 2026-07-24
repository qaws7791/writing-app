import { eq, inArray } from "drizzle-orm"
import { authSessions, authUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import { deletedLearnerDisplayName } from "@workspace/identity/learner-profile"
import { learnerProfiles } from "@workspace/identity/schema"
import type { LearnerDeletionMarker } from "@workspace/identity/ports"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { UserId } from "@workspace/types/ids"

import { deleteLearnerOwnedData } from "@/adapters/identity/learner-data-purge"

export type DeletionMarkerBatchResult = Readonly<{
  alreadyAppliedUsers: number
  markedDeletedUsers: number
  missingUsers: number
  purgedUsers: number
}>

type DeletionMarkerReapplicationRepositoryError = Readonly<{
  kind: "deletion-marker-reapplication-persistence-failed"
}>

export function createDeletionMarkerReapplicationRepository(
  database: WritingAppDatabase
) {
  return {
    async applyBatch(input: {
      readonly dryRun: boolean
      readonly markers: readonly LearnerDeletionMarker[]
      readonly purgeCutoff: Date
    }): Promise<
      Result<
        DeletionMarkerBatchResult,
        DeletionMarkerReapplicationRepositoryError
      >
    > {
      try {
        return ok(
          database.transaction(
            (transaction) => {
              const userIds = input.markers.map(({ userId }) => userId)
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
                markers: input.markers,
                profilesByUserId,
                purgeCutoff: input.purgeCutoff,
              })
              if (input.dryRun) return result.counts

              deleteLearnerOwnedData(transaction, result.purgeUserIds)
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
              const retainedUserIds = input.markers
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
      } catch {
        return err({
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
