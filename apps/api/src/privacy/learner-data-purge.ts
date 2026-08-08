import { inArray } from "drizzle-orm"
import { aiFeedbackLearnerDataPurge } from "@workspace/ai-feedback/module"
import { authUsers } from "@workspace/auth/schema"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"
import { identityLearnerDataPurge } from "@workspace/identity/module"
import { learningLearnerDataPurge } from "@workspace/learning/module"
import { writingLearnerDataPurge } from "@workspace/writing/module"

/** 인증 사용자 row는 auth infra table이므로 조립 지점이 소유한다. */
const authUserPurge: LearnerDataPurgePort = {
  moduleName: "auth",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    transaction.delete(authUsers).where(inArray(authUsers.id, userIds)).run()
  },
}

/**
 * 학습자 데이터 삭제 순서. FK 의존 때문에 순서가 계약이다.
 * 참조하는 쪽(AI 피드백 · 학습 활동 · 글)을 먼저 지우고 참조되는 쪽(profile · 인증 사용자)을 마지막에 지운다.
 */
export const learnerDataPurgePorts: readonly LearnerDataPurgePort[] = [
  aiFeedbackLearnerDataPurge,
  learningLearnerDataPurge,
  writingLearnerDataPurge,
  identityLearnerDataPurge,
  authUserPurge,
]
