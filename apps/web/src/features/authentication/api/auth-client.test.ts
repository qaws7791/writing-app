import { afterEach, describe, expect, it, vi } from "vitest"
import type {
  createLearnerAuthClient,
  LearnerAuthClient,
} from "@workspace/auth/learner/client"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createWebAuthClient } from "@/features/authentication/api/auth-client"
import {
  readBrowserApiBaseUrl,
  type BrowserApiBaseUrl,
} from "@/shared/config/runtime-config"

describe("auth client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("로그아웃을 auth package에 위임하고 안전한 이동 경로를 반환한다", async () => {
    const { authClient, learnerAuthClientFactory } = createAuthClientFixture()
    const webAuthClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      learnerAuthClientFactory,
    })

    await expect(webAuthClient.requestLogout("/app/profile")).resolves.toBe(
      "/app/profile"
    )
    expect(authClient.signOut).toHaveBeenCalledOnce()
  })

  it("로그아웃 후 이동 경로는 외부 URL을 허용하지 않는다", async () => {
    const { learnerAuthClientFactory } = createAuthClientFixture()
    const authClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      learnerAuthClientFactory,
    })

    await expect(authClient.requestLogout("https://example.com")).resolves.toBe(
      "/app"
    )
  })

  it("Google 로그인 요청은 runtime 의존성과 안전한 callback URL을 전달한다", async () => {
    vi.stubGlobal("window", {
      location: {
        assign: vi.fn(),
        origin: "http://localhost:3000",
      },
    })
    const fetch = vi.fn(async () => Response.json({ success: true }))
    const navigate = vi.fn()
    const { authClient, learnerAuthClientFactory } = createAuthClientFixture()
    const webAuthClient = createWebAuthClient({
      apiBaseUrl: readBrowserApiBaseUrl({}),
      fetchImplementation: fetch,
      learnerAuthClientFactory,
      navigate,
    })

    await webAuthClient.requestGoogleLogin("/app/courses")

    expect(learnerAuthClientFactory).toHaveBeenCalledWith({
      baseURL: localRuntimeDefaults.apiBaseUrl,
      fetch,
      navigate,
    })
    expect(authClient.signInWithGoogle).toHaveBeenCalledWith(
      "http://localhost:3000/app/courses"
    )
  })

  it("테스트 로그인 요청은 auth package에 callback URL을 전달한다", () => {
    vi.stubGlobal("window", {
      location: {
        assign: vi.fn(),
        origin: "http://localhost:3000",
      },
    })
    const { authClient, learnerAuthClientFactory } = createAuthClientFixture()
    const webAuthClient = createWebAuthClient({
      apiBaseUrl: "http://localhost:4000" as BrowserApiBaseUrl,
      learnerAuthClientFactory,
    })

    webAuthClient.requestTestLogin("/app/courses")

    expect(authClient.signInForTest).toHaveBeenCalledWith(
      "http://localhost:3000/app/courses"
    )
  })
})

function createAuthClientFixture(): {
  readonly authClient: LearnerAuthClient
  readonly learnerAuthClientFactory: LearnerAuthClientFactory
} {
  const authClient: LearnerAuthClient = {
    signInForTest: vi.fn(),
    signInWithGoogle: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
  }

  return {
    authClient,
    learnerAuthClientFactory: vi.fn(() => authClient),
  }
}

type LearnerAuthClientFactory = (
  input: Parameters<typeof createLearnerAuthClient>[0]
) => LearnerAuthClient
