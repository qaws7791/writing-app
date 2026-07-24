import { describe, expect, it } from "vitest"
import type { AdminId, CourseId, UserId } from "@workspace/types/ids"

import {
  createStartedAuditEvent,
  type AuditAction,
  type AuditTarget,
} from "#operations/domain/audit-event"

const actorId = "admin-1" as AdminId
const createdAt = new Date("2026-07-24T00:00:00.000Z")

describe("operations audit event", () => {
  it.each([
    [
      "learner.detail.read",
      { id: "user-1" as UserId, type: "learner" },
      "privacy-access",
      "2027-07-24T00:00:00.000Z",
    ],
    [
      "learner.status.suspend",
      { id: "user-1" as UserId, type: "learner" },
      "identity-mutation",
      "2029-07-23T00:00:00.000Z",
    ],
    [
      "learner.status.activate",
      { id: "user-1" as UserId, type: "learner" },
      "identity-mutation",
      "2029-07-23T00:00:00.000Z",
    ],
    [
      "learner.delete",
      { id: "user-1" as UserId, type: "learner" },
      "identity-mutation",
      "2029-07-23T00:00:00.000Z",
    ],
    [
      "course.publish",
      { id: "course-1" as CourseId, type: "course" },
      "content-mutation",
      "2027-07-24T00:00:00.000Z",
    ],
    [
      "course.archive",
      { id: "course-1" as CourseId, type: "course" },
      "content-mutation",
      "2027-07-24T00:00:00.000Z",
    ],
  ] satisfies readonly [AuditAction, AuditTarget, string, string][])(
    "%s의 category와 보존 기한을 action에서 결정한다",
    (action, target, category, retentionUntil) => {
      const event = createStartedAuditEvent({
        action,
        actorId,
        clientIp: "203.0.113.10",
        createdAt,
        id: `audit-${action.replaceAll(".", "-")}`,
        requestId: "request-1",
        target,
      })._unsafeUnwrap()

      expect(event).toMatchObject({
        action,
        category,
        outcome: "started",
        target,
      })
      expect(event.retentionUntil.toISOString()).toBe(retentionUntil)
    }
  )

  it("action과 target 종류가 다르거나 PII 형태 식별자가 들어오면 거절한다", () => {
    expect(
      createStartedAuditEvent({
        action: "course.publish",
        actorId,
        clientIp: null,
        createdAt,
        id: "audit-1",
        requestId: "request-1",
        target: { id: "user-1" as UserId, type: "learner" },
      }).isErr()
    ).toBe(true)
    expect(
      createStartedAuditEvent({
        action: "learner.detail.read",
        actorId,
        clientIp: null,
        createdAt,
        id: "audit-2",
        requestId: "request-1",
        target: {
          id: "person@example.test" as UserId,
          type: "learner",
        },
      }).isErr()
    ).toBe(true)
  })
})
