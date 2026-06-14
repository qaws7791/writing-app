import { describe, expect, it } from "vitest"

import { createGoogleOAuthRoute } from "@/routes/google-oauth.route"

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
})
