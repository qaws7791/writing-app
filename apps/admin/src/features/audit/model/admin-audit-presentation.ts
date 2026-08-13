import type { AdminAuditEvent } from "@/entities/admin-audit/model/admin-audit"

const actionLabels = {
  "course.archive": "코스 보관",
  "course.create": "코스 생성",
  "course.draft.save": "코스 초안 저장",
  "course.publish": "커리큘럼 발행",
  "course.restore": "코스 보관 해제",
  "learner.delete": "학습자 삭제 처리",
  "learner.detail.read": "학습자 상세 조회",
  "learner.status.activate": "학습자 활성화",
  "learner.status.suspend": "학습자 정지",
  "writing-task.create": "쓰기 과제 생성",
  "writing-task.draft.save": "쓰기 과제 초안 저장",
  "writing-task.publish": "쓰기 과제 발행",
} as const satisfies Record<AdminAuditEvent["action"], string>

const categoryLabels = {
  "content-mutation": "콘텐츠 변경",
  "identity-mutation": "계정 변경",
  "privacy-access": "개인정보 조회",
} as const satisfies Record<AdminAuditEvent["category"], string>

const targetLabels = {
  course: "코스",
  learner: "학습자",
  "writing-task": "쓰기 과제",
} as const satisfies Record<AdminAuditEvent["target"]["type"], string>

const outcomeLabels = {
  failed: "실패",
  started: "진행 중",
  succeeded: "성공",
} as const satisfies Record<AdminAuditEvent["outcome"], string>

export function readAuditActionLabel(
  action: AdminAuditEvent["action"]
): string {
  return actionLabels[action]
}

export function readAuditCategoryLabel(
  category: AdminAuditEvent["category"]
): string {
  return categoryLabels[category]
}

export function readAuditTargetLabel(
  target: AdminAuditEvent["target"]
): string {
  return targetLabels[target.type]
}

export function readAuditOutcomeLabel(
  outcome: AdminAuditEvent["outcome"]
): string {
  return outcomeLabels[outcome]
}

/** 종결되지 않은 `started`는 조사가 필요한 신호이므로 성공과 다른 톤으로 구분한다. */
export function readAuditOutcomeTone(
  outcome: AdminAuditEvent["outcome"]
): "danger" | "neutral" | "success" {
  switch (outcome) {
    case "failed":
      return "danger"
    case "started":
      return "neutral"
    case "succeeded":
      return "success"
  }
}
