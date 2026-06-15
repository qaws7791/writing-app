import { describe, expect, it } from "vitest"
import { authAccounts } from "@workspace/db/schema/auth.schema"

import {
  createGoogleCallbackSetCookies,
  createGoogleOAuthRoute,
} from "@/routes/google-oauth.route"

describe("Google OAuth route", () => {
  it("Google 로그인 시작 요청을 Google authorization endpoint로 보낸다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl: "http://localhost:4000",
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      createStateNonce: () => "state-nonce",
      webOrigin: "http://localhost:3000",
    })

    const response = await route.request(
      "/sign-in/google?callbackURL=%2Fapp%2Fcourses"
    )

    expect(response.status).toBe(302)
    const location = new URL(response.headers.get("location") ?? "")
    expect(location.origin).toBe("https://accounts.google.com")
    expect(location.pathname).toBe("/o/oauth2/v2/auth")
    expect(location.searchParams.get("client_id")).toBe("google-client-id")
    expect(location.searchParams.get("redirect_uri")).toBe(
      "http://localhost:4000/api/auth/callback/google"
    )
    expect(location.searchParams.get("response_type")).toBe("code")
    expect(location.searchParams.get("scope")).toBe("openid email profile")
    expect(response.headers.get("set-cookie")).toContain("kwep_oauth_state=")
  })

  it("기본 nonce 생성기를 사용해도 Google 로그인 시작 요청을 처리한다", async () => {
    const route = createGoogleOAuthRoute({
      authBaseUrl: "http://localhost:4000",
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      webOrigin: "http://localhost:3000",
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
    expect(cookies[0]).not.toContain("HttpOnly")
    expect(cookies[1]).toContain("kwep_oauth_state=")
    expect(cookies[1]).toContain("Max-Age=0")
    expect(cookies[1]).toContain("HttpOnly")
  })

  it("Google 콜백 후 provider token을 DB에 저장하지 않는다", async () => {
    let savedAccount: unknown = null
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
      insert(table: unknown) {
        return {
          values(value: unknown) {
            return {
              onConflictDoUpdate() {
                return {
                  run() {
                    if (table === authAccounts) {
                      savedAccount = value
                    }
                  },
                }
              },
              run() {
                if (table === authAccounts) {
                  savedAccount = value
                }
              },
            }
          },
        }
      },
    }

    const route = createGoogleOAuthRoute({
      authBaseUrl: "http://localhost:4000",
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
      createSessionToken: () => "session-token",
      createStateNonce: () => "state-nonce",
      db: db as never,
      fetch: createGoogleOAuthTestFetch(),
      now: () => new Date("2026-06-15T10:00:00.000Z"),
      webOrigin: "http://localhost:3000",
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
