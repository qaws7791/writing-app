import { inArray, or } from "drizzle-orm"
import { authUsers, authVerifications } from "@workspace/auth/schema"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"
import { identityLearnerDataPurge } from "@workspace/identity/module"
import { learningLearnerDataPurge } from "@workspace/learning/module"
import { writingLearnerDataPurge } from "@workspace/writing/module"

/** 인증 사용자 row는 auth infra table이므로 조립 지점이 소유한다. */
const authUserPurge: LearnerDataPurgePort = {
  moduleName: "auth",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    const userEmails = transaction
      .select({ email: authUsers.email })
      .from(authUsers)
      .where(inArray(authUsers.id, userIds))
      .all()
      .map(({ email }) => email)

    transaction
      .delete(authVerifications)
      .where(
        or(
          inArray(authVerifications.identifier, userEmails),
          inArray(authVerifications.value, userIds)
        )
      )
      .run()
    transaction.delete(authUsers).where(inArray(authUsers.id, userIds)).run()
  },
}

/**
 * 학습자 데이터 삭제 순서. FK 의존 때문에 순서가 계약이다.
 * 참조하는 쪽(학습 활동 · 글)을 먼저 지우고 참조되는 쪽(profile · 인증 사용자)을 마지막에 지운다.
 */
export const learnerDataPurgePorts: readonly LearnerDataPurgePort[] = [
  learningLearnerDataPurge,
  writingLearnerDataPurge,
  identityLearnerDataPurge,
  authUserPurge,
]
