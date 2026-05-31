import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const pageMocks = vi.hoisted(() => ({
  authPage: vi.fn(() => null),
  getAuthenticatedAppRedirectPath: vi.fn(async () => null),
  getServerWritingAppApi: vi.fn(async () => ({})),
  getWebEnv: vi.fn(() => ({
    browserApiBaseUrl: "http://localhost:4000",
    serverApiBaseUrl: "http://localhost:4000",
  })),
  redirect: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: pageMocks.redirect,
}))

vi.mock("@/env", () => ({
  getWebEnv: pageMocks.getWebEnv,
}))

vi.mock("@/features/auth/auth-page", () => ({
  AuthPage: pageMocks.authPage,
}))

vi.mock("@/lib/api/get-server-writing-app-api", () => ({
  getServerWritingAppApi: pageMocks.getServerWritingAppApi,
}))

vi.mock("@/lib/auth/get-authenticated-app-redirect-path", () => ({
  getAuthenticatedAppRedirectPath: pageMocks.getAuthenticatedAppRedirectPath,
}))

import Page from "@/app/login/page"

afterEach(() => {
  vi.clearAllMocks()
})

describe("login page", () => {
  it("passes the browser API base URL to the auth page", async () => {
    const element = (await Page({
      searchParams: Promise.resolve({
        next: "/app/courses",
      }),
    })) as React.ReactElement<{
      authBaseUrl?: string
      nextPath?: string
    }>

    expect(element.props.authBaseUrl).toBe("http://localhost:4000")
    expect(element.props.nextPath).toBe("/app/courses")
  })
})
