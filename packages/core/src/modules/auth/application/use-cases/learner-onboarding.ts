import type { LearnerProfileRepository } from "#core/modules/auth/application/ports/learner-profile.repository"

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
