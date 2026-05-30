import { describe, expect, it, vi } from "vitest"

import {
  requestGoogleAuth,
  type CreateSocialAuthClient,
} from "@/lib/auth/auth-client"

describe("requestGoogleAuth", () => {
  it("starts Google social auth through the same-origin auth route by default", async () => {
    const social = vi.fn(async () => undefined)
    const createClient = vi.fn<CreateSocialAuthClient>(() => ({
      signIn: {
        social,
      },
    }))

    await requestGoogleAuth({
      appOrigin: "http://localhost:3001",
      callbackPath: "/app/courses",
      createClient,
    })

    expect(createClient).toHaveBeenCalledWith({})
    expect(social).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3001/app/courses",
      provider: "google",
    })
  })

  it("starts Google social auth with the requested app callback path", async () => {
    const social = vi.fn(async () => undefined)
    const createClient = vi.fn<CreateSocialAuthClient>(() => ({
      signIn: {
        social,
      },
    }))

    await requestGoogleAuth({
      appOrigin: "http://localhost:3001",
      baseUrl: "http://localhost:4000/",
      callbackPath: "/app/courses/sentence-structure",
      createClient,
    })

    expect(createClient).toHaveBeenCalledWith({
      baseURL: "http://localhost:4000",
    })
    expect(social).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3001/app/courses/sentence-structure",
      provider: "google",
    })
  })

  it("falls back to the app home when the callback path is unsafe", async () => {
    const social = vi.fn(async () => undefined)
    const createClient = vi.fn<CreateSocialAuthClient>(() => ({
      signIn: {
        social,
      },
    }))

    await requestGoogleAuth({
      appOrigin: "http://localhost:3001",
      baseUrl: "http://localhost:4000",
      callbackPath: "https://example.com/phishing",
      createClient,
    })

    expect(social).toHaveBeenCalledWith({
      callbackURL: "http://localhost:3001/app",
      provider: "google",
    })
  })
})
