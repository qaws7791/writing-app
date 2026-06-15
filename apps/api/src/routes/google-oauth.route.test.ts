import { describe, expect, it } from "vitest"
import type { AnySQLiteTable } from "drizzle-orm/sqlite-core"
import { authAccounts } from "@workspace/db/schema/auth.schema"
import { localRuntimeDefaults } from "@workspace/env"

import {
  createGoogleCallbackSetCookies,
  createGoogleOAuthRoute,
} from "@/routes/google-oauth.route"

const authBaseUrl = localRuntimeDefaults.learnerApiBaseUrl
const webOrigin = localRuntimeDefaults.learnerWebOrigin
const googleCallbackUrl = `${authBaseUrl}/api/auth/callback/google`
type AuthAccountInsert = typeof authAccounts.$inferInsert

describe("Google OAuth route", () => {
  it("Google 로그인 시작 요청을 Google authorization endpoint로 보낸다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl,
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      createStateNonce: () => "state-nonce",
      webOrigin,
    })

    const response = await route.request(
      "/sign-in/google?callbackURL=%2Fapp%2Fcourses"
    )

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get("location") ?? "")
    expect(location.origin).toBe("https://accounts.google.com")
    expect(location.pathname).toBe("/o/oauth2/v2/auth")
    expect(location.searchParams.get("client_id")).toBe("google-client-id")
    expect(location.searchParams.get("redirect_uri")).toBe(googleCallbackUrl)
    expect(location.searchParams.get("response_type")).toBe("code")
    expect(location.searchParams.get("scope")).toBe("openid email profile")
    expect(response.headers.get("set-cookie")).toContain("kwep_oauth_state=")
  })

  it("HTTPS origin에서는 OAuth 상태 쿠키에 Secure 속성을 붙인다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl: "https://api.example.test",
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      createStateNonce: () => "state-nonce",
      webOrigin: "https://app.example.test",
    })

    const response = await route.request("/sign-in/google")

    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(response.headers.get("set-cookie")).toContain("Secure")
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax")
  })

  it("HTTPS origin에서는 로그아웃 쿠키에도 Secure 속성을 붙인다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl: "https://api.example.test",
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      webOrigin: "https://app.example.test",
    })

    const response = await route.request("/sign-out")

    expect(response.headers.get("set-cookie")).toContain("kwep_session=")
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(response.headers.get("set-cookie")).toContain("Secure")
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax")
  })

  it("기본 nonce 생성기를 사용해도 Google 로그인 시작 요청을 처리한다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl,
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      webOrigin,
    })

    const response = await route.request("/sign-in/google")

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toContain(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
  })

  it("Google 콜백 성공 쿠키를 세션 쿠키와 state 삭제 쿠키로 분리한다", () => {
    const cookies = createGoogleCallbackSetCookies("session-token")

    expect(cookies).toHaveLength(2)
    expect(cookies[0]).toContain("kwep_session=session-token")
    expect(cookies[0]).toContain("HttpOnly")
    expect(cookies[1]).toContain("kwep_oauth_state=")
    expect(cookies[1]).toContain("Max-Age=0")
    expect(cookies[1]).toContain("HttpOnly")
  })

  it("HTTPS 콜백 쿠키에 Secure 속성을 붙인다", () => {
    const cookies = createGoogleCallbackSetCookies("session-token", true)

    expect(cookies[0]).toContain("Secure")
    expect(cookies[1]).toContain("Secure")
  })

  it("Google 콜백 후 provider token을 DB에 저장하지 않는다", async () => {
    let savedAccount: AuthAccountInsert | null = null
    const saveAccount = (account: AuthAccountInsert) => {
      savedAccount = account
    }
    const db = {
      delete() {
        return {
          where() {
            return {
              run() {},
            }
          },
        }
      },
      insert(table: AnySQLiteTable) {
        return {
          values(value: AuthAccountInsert) {
            return {
              onConflictDoUpdate() {
                return {
                  run() {
                    if (table === authAccounts) {
                      saveAccount(value)
                    }
                  },
                }
              },
              run() {
                if (table === authAccounts) {
                  saveAccount(value)
                }
              },
            }
          },
        }
      },
    }

    const route = createGoogleOAuthRoute({
      authBaseUrl,
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      createSessionToken: () => "session-token",
      createStateNonce: () => "state-nonce",
      db: db as never,
      fetch: createGoogleOAuthTestFetch(),
      now: () => new Date("2026-06-15T10:00:00.000Z"),
      webOrigin,
    })

    const startResponse = await route.request("/sign-in/google")
    const authorizationUrl = new URL(
      startResponse.headers.get("location") ?? ""
    )
    const state = authorizationUrl.searchParams.get("state")
    const stateCookie = startResponse.headers
      .get("set-cookie")
      ?.split(";")
      .at(0)

    const callbackResponse = await route.request(
      `/callback/google?code=google-code&state=${state}`,
      {
        headers: {
          Cookie: stateCookie ?? "",
        },
      }
    )

    expect(callbackResponse.status).toBe(302)
    expect(savedAccount).toMatchObject({
      accessToken: null,
      idToken: null,
      refreshToken: null,
    })
  })
})

function createGoogleOAuthTestFetch(): typeof fetch {
  return Object.assign(
    async (input: Parameters<typeof fetch>[0]) => {
      const url = input.toString()

      if (url === "https://oauth2.googleapis.com/token") {
        return Response.json({
          access_token: "google-access-token",
          expires_in: 3600,
          id_token: "google-id-token",
          refresh_token: "google-refresh-token",
        })
      }

      if (url === "https://openidconnect.googleapis.com/v1/userinfo") {
        return Response.json({
          email: "learner@example.com",
          email_verified: true,
          name: "학습자",
          picture: "https://example.com/profile.png",
          sub: "google-user-1",
        })
      }

      return new Response(null, { status: 404 })
    },
    {
      preconnect() {},
    }
  )
}
