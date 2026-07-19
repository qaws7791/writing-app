import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createAdminIdentityTargetRouteFixture } from "@/test-support/admin-identity-target-route-fixture"

const adminCookie = `${adminSessionCookieName}=admin-token`

describe("통합 관리자 identity route", () => {
  it("목록 query와 상세 응답을 기존 wire 계약으로 제공한다", async () => {
    const fixture = createAdminIdentityTargetRouteFixture("default")
    const listResponse = await fixture.fetch(
      createRequest(
        "/users?page=1&pageSize=12&query=%ED%95%99%EC%8A%B5&status=active&sort=lastActive",
        { headers: { Cookie: adminCookie } }
      )
    )

    expect(listResponse.status).toBe(200)
    await expect(listResponse.json()).resolves.toMatchObject({
      items: [
        {
          id: "user-1",
          name: "학습자",
          status: "active",
        },
      ],
      pagination: {
        page: 1,
        pageSize: 12,
        totalItems: 1,
        totalPages: 1,
      },
    })
    expect(fixture.readEffectJournal()).toEqual([
      {
        effect: "identity.read-users",
        input: {
          page: 1,
          pageSize: 12,
          query: "학습",
          sort: "lastActive",
          status: "active",
        },
        sequence: 1,
      },
    ])

    const detailResponse = await fixture.fetch(
      createRequest("/users/user-1", { headers: { Cookie: adminCookie } })
    )

    expect(detailResponse.status).toBe(200)
    await expect(detailResponse.json()).resolves.toMatchObject({
      id: "user-1",
      progressPercent: 60,
      totalLessons: 5,
    })
  })

  it("owner mutation만 application에 전달하고 soft-delete acknowledgement를 유지한다", async () => {
    const ownerFixture = createAdminIdentityTargetRouteFixture("default")
    const deleteResponse = await ownerFixture.fetch(
      createRequest("/users/user-1", {
        headers: {
          Cookie: adminCookie,
          Origin: localRuntimeDefaults.adminWebOrigin,
          "Sec-Fetch-Site": "same-origin",
        },
        method: "DELETE",
      })
    )

    expect(deleteResponse.status).toBe(200)
    await expect(deleteResponse.json()).resolves.toEqual({ deleted: true })
    expect(ownerFixture.readEffectJournal()).toEqual([
      {
        effect: "identity.delete-user",
        input: {
          actor: { id: "admin-1", role: "owner" },
          now: "2026-07-18T00:00:00.000Z",
          userId: "user-1",
        },
        sequence: 1,
      },
    ])

    const operatorFixture = createAdminIdentityTargetRouteFixture("operator")
    const operatorResponse = await operatorFixture.fetch(
      createRequest("/users/user-1/status", {
        body: JSON.stringify({ status: "suspended" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
          Origin: localRuntimeDefaults.adminWebOrigin,
          "Sec-Fetch-Site": "same-origin",
        },
        method: "PATCH",
      })
    )

    expect(operatorResponse.status).toBe(403)
    await expect(operatorResponse.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
    expect(operatorFixture.readEffectJournal()).toEqual([])
  })

  it("identity OpenAPI path와 public error status를 등록한다", async () => {
    const fixture = createAdminIdentityTargetRouteFixture("default")
    const response = await fixture.fetch(createRequest("/openapi"))
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document).toHaveProperty(
      ["paths", "/api/admin/users", "get", "operationId"],
      "getAdminUsers"
    )
    expect(document).toHaveProperty(
      ["paths", "/api/admin/users/{userId}", "get", "operationId"],
      "getAdminUser"
    )
    expect(document).toHaveProperty(
      ["paths", "/api/admin/users/{userId}/status", "patch", "operationId"],
      "updateAdminUserStatus"
    )
    expect(document).toHaveProperty(
      ["paths", "/api/admin/users/{userId}", "delete", "operationId"],
      "deleteAdminUser"
    )
    expect(document).toHaveProperty([
      "paths",
      "/api/admin/users/{userId}/status",
      "patch",
      "responses",
      "400",
    ])
    expect(document).toHaveProperty([
      "paths",
      "/api/admin/users/{userId}",
      "delete",
      "responses",
      "404",
    ])
  })
})

function createRequest(path: string, init: RequestInit = {}): Request {
  return new Request(new URL(path, "http://api.localhost:4000"), init)
}
