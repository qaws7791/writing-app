import type { AdminUserStatus } from "@/entities/learner-account/model/admin-learner-account"
import type { LearnerOperationalStatus } from "@workspace/contracts/identity/status"

export type UserStatusTransition = {
  readonly confirmation: string
  readonly label: string
  readonly successMessage: string
  readonly targetStatus: LearnerOperationalStatus
}

export function readUserStatusTransition(
  status: AdminUserStatus
): UserStatusTransition | null {
  switch (status) {
    case "active":
      return {
        confirmation: "사용자를 정지 상태로 전환합니다.",
        label: "정지",
        successMessage: "사용자를 정지했습니다.",
        targetStatus: "suspended",
      }
    case "suspended":
      return {
        confirmation: "사용자를 활성 상태로 전환합니다.",
        label: "활성화",
        successMessage: "사용자를 활성화했습니다.",
        targetStatus: "active",
      }
    case "deleted":
      return null
  }
}
