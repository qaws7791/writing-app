import { describe, expect, it, vi } from "vitest"

import {
  createResourceEventsUpgradeHandler,
  type ResourceEventsUpgrade,
} from "@/collaboration/resource-events-upgrade"
import { createTestAdminSessionResolver } from "@/routes/test-dependencies"

const adminOrigin = "http://admin.example.test"

describe("자료실 이벤트 WebSocket upgrade", () => {
  it("관리자 세션을 인증하고 작업 공간 events 연결로 upgrade한다", async () => {
    const upgrade = vi.fn<ResourceEventsUpgrade>(() => true)
    const request = createRequest()
    const response = await createHandler()(request, upgrade)

    expect(response).toBeUndefined()
    expect(upgrade).toHaveBeenCalledWith(request, {
      actorId: "admin-1",
      channel: "events",
    })
  })

  it("다른 Origin은 upgrade 전에 거부한다", async () => {
    const response = await createHandler()(
      createRequest("http://attacker.example.test"),
      () => true
    )

    expect(response?.status).toBe(403)
  })

  it("events 경로가 아니면 요청을 처리하지 않는다", async () => {
    const response = await createHandler()(
      new Request(`${adminOrigin}/resources/tree`),
      () => true
    )

    expect(response).toBeNull()
  })
})

function createHandler() {
  return createResourceEventsUpgradeHandler({
    adminOrigin,
    onAuthorizationRejected: vi.fn(),
    sessionResolver: createTestAdminSessionResolver(),
  })
}

function createRequest(origin = adminOrigin): Request {
  return new Request(`${adminOrigin}/resources/events`, {
    headers: {
      cookie: "admin_session_token=admin-token",
      origin,
      upgrade: "websocket",
    },
  })
}
