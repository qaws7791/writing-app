import { describe, expect, it } from "vitest"

import { adminAuditEventDtoSchema } from "#contracts/operations/admin-audit"

const event = {
  action: "learner.detail.read",
  actorId: "admin-1",
  category: "privacy-access",
  clientIp: null,
  createdAt: "2026-07-24T00:00:00.000Z",
  id: "audit-1",
  outcome: "succeeded",
  requestId: "request-1",
  retentionUntil: "2027-07-24T00:00:00.000Z",
  target: { id: "user-1", type: "learner" },
} as const

describe("admin audit contract", () => {
  it("허용 목록 필드만 수락한다", () => {
    expect(adminAuditEventDtoSchema.safeParse(event).success).toBe(true)
    expect(
      adminAuditEventDtoSchema.safeParse({
        ...event,
        email: "person@example.test",
      }).success
    ).toBe(false)
    expect(
      adminAuditEventDtoSchema.safeParse({
        ...event,
        target: { ...event.target, prompt: "system prompt" },
      }).success
    ).toBe(false)
  })
})
