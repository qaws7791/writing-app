import { describe, expect, it, vi } from "vitest"

import {
  createLearnerAuthHooks,
  createLearnerOnboardingService,
  type LearnerProfileRepository,
} from "@/auth/learner-onboarding"

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

  it("Better Auth hook은 도메인 후처리 service만 호출한다", async () => {
    const ensureLearnerProfile = vi.fn(async () => undefined)
    const hooks = createLearnerAuthHooks({
      onboardingService: {
        ensureLearnerProfile,
      },
    })

    await hooks.user.create.after({
      id: "user-1",
      name: "학습자",
    })

    expect(ensureLearnerProfile).toHaveBeenCalledWith({
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
