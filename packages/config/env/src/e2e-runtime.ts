/**
 * E2E 실행 topology와 seeded fixture credential의 단일 출처다. 값은 모두 합성이며
 * 실제 사용자 데이터나 production endpoint가 아니다. seeder, Playwright config,
 * Lighthouse wrapper가 같은 값을 각자 다시 적지 않게 하려고 여기에 모았다.
 */
export const e2eRuntimeOrigins = {
  adminOrigin: "http://127.0.0.1:3101",
  apiOrigin: "http://127.0.0.1:4100",
  assetOrigin: "http://127.0.0.1:4199",
  learnerOrigin: "http://localhost:3100",
} as const

export const e2eSeededCredentials = {
  adminPassword: "e2e-password-123",
  learnerEmail: "learner@example.com",
  learnerPassword: "e2e-password-123",
} as const

export const e2eSeededLearnerActors = {
  credentialsPasswordReset: {
    email: "credentials-password-reset@example.test",
    id: "e2e-credentials-password-reset",
    name: "비밀번호 재설정 학습자",
  },
  prSuspension: {
    email: "pr-suspension@example.test",
    id: "e2e-pr-suspension",
    name: "PR 정지 대상",
  },
  releaseDeletion: {
    email: "release-deletion@example.test",
    id: "e2e-release-deletion",
    name: "릴리스 삭제 대상",
  },
  releaseProviderLesson: {
    email: "release-provider-lesson@example.test",
    id: "e2e-release-provider-lesson",
    name: "릴리스 provider 레슨 학습자",
  },
  releaseProfile: {
    email: "release-profile@example.test",
    id: "e2e-release-profile",
    name: "릴리스 프로필 학습자",
  },
  releasePublishedActivities: {
    email: "release-published-activities@example.test",
    id: "e2e-release-published-activities",
    name: "릴리스 발행 활동 학습자",
  },
  releaseRevisionPinning: {
    email: "release-revision-pinning@example.test",
    id: "e2e-release-revision-pinning",
    name: "릴리스 리비전 고정 학습자",
  },
} as const

export function readRequiredE2eEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (value === undefined || value === "") {
    throw new Error(`${name}이 없습니다. E2E 공개 명령을 사용해 주세요.`)
  }

  return value
}
