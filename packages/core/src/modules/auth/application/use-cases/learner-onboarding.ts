import { eq } from "drizzle-orm"

import type { LearnerAccountStatus } from "#core/shared/kernel/status"
import { learnerAccountStatuses } from "#core/shared/kernel/status"
import type { WritingAppDatabase } from "@workspace/db/client"
import { learnerProfiles } from "@workspace/db/schema"

export type LearnerProfileRepository = {
  readonly ensureActiveProfile: (input: {
    readonly displayName: string
    readonly userId: string
  }) => Promise<void>
  readonly findProfileByUserId: (
    userId: string
  ) => Promise<{ readonly status: LearnerAccountStatus } | null>
}

export type LearnerOnboardingService = {
  readonly ensureLearnerProfile: (input: {
    readonly displayName: string
    readonly userId: string
  }) => Promise<void>
}

export function createLearnerOnboardingService({
  profileRepository,
}: {
  readonly profileRepository: LearnerProfileRepository
}): LearnerOnboardingService {
  return {
    async ensureLearnerProfile(input) {
      await profileRepository.ensureActiveProfile(input)
    },
  }
}

export function createDrizzleLearnerProfileRepository(
  db: WritingAppDatabase
): LearnerProfileRepository {
  return {
    async ensureActiveProfile(input) {
      await Promise.resolve(
        db
          .insert(learnerProfiles)
          .values({
            deletedAt: null,
            displayName: input.displayName,
            status: learnerAccountStatuses.active,
            userId: input.userId,
          })
          .onConflictDoNothing()
          .run()
      )
    },
    async findProfileByUserId(userId) {
      const profile = await Promise.resolve(
        db
          .select({
            status: learnerProfiles.status,
          })
          .from(learnerProfiles)
          .where(eq(learnerProfiles.userId, userId))
          .get()
      )

      return profile ?? null
    },
  }
}

export function createLearnerAuthHooks({
  onboardingService,
}: {
  readonly onboardingService: LearnerOnboardingService
}) {
  return {
    user: {
      create: {
        after: async (user: { readonly id: string; readonly name: string }) => {
          await onboardingService.ensureLearnerProfile({
            displayName: user.name,
            userId: user.id,
          })
        },
      },
    },
  }
}
