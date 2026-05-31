import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const pageMocks = vi.hoisted(() => ({
  adminAuthPage: vi.fn(() => null),
  getAdminWebEnv: vi.fn(() => ({
    adminApiBaseUrl: "http://localhost:4001",
  })),
}))

vi.mock("@/env", () => ({
  getAdminWebEnv: pageMocks.getAdminWebEnv,
}))

vi.mock("@/features/auth/admin-auth-page", () => ({
  AdminAuthPage: pageMocks.adminAuthPage,
}))

import Page from "@/app/login/page"

afterEach(() => {
  vi.clearAllMocks()
})

describe("admin login page", () => {
  it("passes the admin API base URL to the auth page", async () => {
    const element = (await Page({
      searchParams: Promise.resolve({
        next: "/users",
      }),
    })) as React.ReactElement<{
      authBaseUrl?: string
      nextPath?: string
    }>

    expect(element.props.authBaseUrl).toBe("http://localhost:4001")
    expect(element.props.nextPath).toBe("/users")
  })
})
