import type { AdminId, UserId } from "@workspace/types/ids"

import type { StartAuditEventInput } from "#operations/domain/audit-event"

declare const actorId: AdminId
declare const userId: UserId

const validAuditInput: StartAuditEventInput = {
  action: "learner.detail.read",
  actorId,
  clientIp: null,
  createdAt: new Date(),
  id: "audit-1",
  requestId: "request-1",
  target: { id: userId, type: "learner" },
}

void validAuditInput

const auditInputWithPii: StartAuditEventInput = {
  action: "learner.detail.read",
  actorId,
  clientIp: null,
  createdAt: new Date(),
  // @ts-expect-error audit 입력은 email payload를 허용하지 않는다.
  email: "person@example.test",
  id: "audit-2",
  requestId: "request-2",
  target: { id: userId, type: "learner" },
}

void auditInputWithPii
