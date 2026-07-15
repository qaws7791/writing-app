import { describe, expect, it, vi } from "vitest"

import { createLearnerOnboardingService } from "#core/modules/auth/application/use-cases/learner-onboarding"
import type { LearnerProfileRepository } from "#core/modules/auth/application/ports/learner-profile.repository"

describe("학습자 온보딩", () => {
  it("회원 가입 후처리를 프로필 저장소 포트로 위임한다", async () => {
    const profileRepository = createFakeProfileRepository()
    const onboardingService = createLearnerOnboardingService({
      profileRepository,
    })

    await onboardingService.ensureLearnerProfile({
      displayName: "학습자",
      userId: "user-1",
    })

    expect(profileRepository.ensureActiveProfile).toHaveBeenCalledWith({
      displayName: "학습자",
      userId: "user-1",
    })
  })
})

function createFakeProfileRepository(): LearnerProfileRepository {
  return {
    ensureActiveProfile: vi.fn(async () => undefined),
    findProfileByUserId: vi.fn(async () => null),
  }
}
