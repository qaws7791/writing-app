import { Buffer } from "node:buffer"

import { eq } from "drizzle-orm"
import { Hono } from "hono"

import { learnerAccountStatuses } from "@workspace/core/status"
import type { KwepDatabase } from "@workspace/db/client"
import {
  authAccounts,
  authSessions,
  authUsers,
} from "@workspace/db/schema/auth.schema"
import { learnerProfiles } from "@workspace/db/schema/learning.schema"

const googleAuthorizationEndpoint =
  "https://accounts.google.com/o/oauth2/v2/auth"
const googleTokenEndpoint = "https://oauth2.googleapis.com/token"
const googleUserInfoEndpoint =
  "https://openidconnect.googleapis.com/v1/userinfo"
const oauthStateCookieName = "kwep_oauth_state"
const learnerSessionCookieName = "kwep_session"
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7

export type GoogleOAuthRouteOptions = {
  readonly authBaseUrl: string
  readonly clientId: string
  readonly clientSecret: string
  readonly createSessionToken?: () => string
  readonly createStateNonce?: () => string
  readonly db?: KwepDatabase
  readonly fetch?: typeof fetch
  readonly now?: () => Date
  readonly webOrigin: string
}

export function createGoogleOAuthRoute(options: GoogleOAuthRouteOptions): Hono {
  const route = new Hono()
  const secureCookie = shouldUseSecureCookie(options.webOrigin)

  route.get("/sign-in/google", (context) => {
    const callbackPath = resolveSafeCallbackPath(
      context.req.query("callbackURL")
    )
    const nonce = options.createStateNonce?.() ?? crypto.randomUUID()
    const state = encodeState({ callbackPath, nonce })
    const authorizationUrl = new URL(googleAuthorizationEndpoint)

    authorizationUrl.searchParams.set("client_id", options.clientId)
    authorizationUrl.searchParams.set(
      "redirect_uri",
      createGoogleRedirectUri(options.authBaseUrl)
    )
    authorizationUrl.searchParams.set("response_type", "code")
    authorizationUrl.searchParams.set("scope", "openid email profile")
    authorizationUrl.searchParams.set("state", state)

    context.header(
      "Set-Cookie",
      serializeCookie(oauthStateCookieName, nonce, {
        httpOnly: true,
        maxAge: 600,
        sameSite: "Lax",
        secure: secureCookie,
      })
    )

    return context.redirect(authorizationUrl.toString(), 302)
  })

  route.get("/callback/google", async (context) => {
    if (options.db === undefined) {
      return context.json({ error: { code: "auth_unavailable" } }, 503)
    }

    const state = decodeState(context.req.query("state"))
    const code = context.req.query("code")
    const storedNonce = readCookie(
      context.req.header("Cookie") ?? "",
      oauthStateCookieName
    )

    if (
      code === undefined ||
      state === null ||
      storedNonce === null ||
      storedNonce !== state.nonce
    ) {
      return context.redirect(createWebUrl(options.webOrigin, "/login"), 302)
    }

    const fetcher = options.fetch ?? fetch
    const tokenResponse = await exchangeGoogleCode({
      authBaseUrl: options.authBaseUrl,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      code,
      fetcher,
    })

    if (tokenResponse === null) {
      return context.json({ error: { code: "google_token_unavailable" } }, 502)
    }

    const googleUser = await readGoogleUserInfo(fetcher, tokenResponse)

    if (googleUser === null) {
      return context.json({ error: { code: "google_user_unavailable" } }, 502)
    }

    const now = (options.now ?? (() => new Date()))()
    const userId = `google-${googleUser.sub}`
    const sessionToken = options.createSessionToken?.() ?? crypto.randomUUID()
    const sessionExpiresAt = new Date(
      now.getTime() + sessionMaxAgeSeconds * 1000
    )

    upsertGoogleUser(options.db, {
      googleUser,
      now,
      sessionExpiresAt,
      sessionToken,
      tokenResponse,
      userId,
    })

    for (const cookie of createGoogleCallbackSetCookies(
      sessionToken,
      secureCookie
    )) {
      context.header("Set-Cookie", cookie, { append: true })
    }

    return context.redirect(
      createWebUrl(options.webOrigin, state.callbackPath),
      302
    )
  })

  route.get("/sign-out", (context) => {
    const callbackPath = resolveSafeCallbackPath(
      context.req.query("callbackURL")
    )

    context.header(
      "Set-Cookie",
      serializeCookie(learnerSessionCookieName, "", {
        httpOnly: true,
        maxAge: 0,
        sameSite: "Lax",
        secure: secureCookie,
      })
    )

    return context.redirect(createWebUrl(options.webOrigin, callbackPath), 302)
  })

  return route
}

function createGoogleRedirectUri(authBaseUrl: string): string {
  return `${authBaseUrl.replace(/\/$/, "")}/api/auth/callback/google`
}

function resolveSafeCallbackPath(callbackPath: string | undefined): string {
  if (
    callbackPath === undefined ||
    !callbackPath.startsWith("/") ||
    callbackPath.startsWith("//") ||
    callbackPath.startsWith("/login")
  ) {
    return "/app"
  }

  return callbackPath
}

function createWebUrl(webOrigin: string, path: string): string {
  return new URL(path, webOrigin).toString()
}

function shouldUseSecureCookie(webOrigin: string): boolean {
  return new URL(webOrigin).protocol === "https:"
}

function encodeState(state: {
  readonly callbackPath: string
  readonly nonce: string
}): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url")
}

function decodeState(
  value: string | undefined
): null | { readonly callbackPath: string; readonly nonce: string } {
  if (value === undefined) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))

    if (
      typeof parsed?.callbackPath !== "string" ||
      typeof parsed?.nonce !== "string"
    ) {
      return null
    }

    return {
      callbackPath: resolveSafeCallbackPath(parsed.callbackPath),
      nonce: parsed.nonce,
    }
  } catch {
    return null
  }
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    readonly httpOnly: boolean
    readonly maxAge: number
    readonly sameSite: "Lax"
    readonly secure: boolean
  }
): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
    options.httpOnly ? "HttpOnly" : "",
    options.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ")
}

export function createGoogleCallbackSetCookies(
  sessionToken: string,
  secureCookie = false
): readonly [string, string] {
  return [
    serializeCookie(learnerSessionCookieName, sessionToken, {
      httpOnly: true,
      maxAge: sessionMaxAgeSeconds,
      sameSite: "Lax",
      secure: secureCookie,
    }),
    serializeCookie(oauthStateCookieName, "", {
      httpOnly: true,
      maxAge: 0,
      sameSite: "Lax",
      secure: secureCookie,
    }),
  ]
}

function readCookie(cookieHeader: string, name: string): string | null {
  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=")

    if (rawName === name) {
      return decodeURIComponent(rawValueParts.join("="))
    }
  }

  return null
}

async function exchangeGoogleCode({
  authBaseUrl,
  clientId,
  clientSecret,
  code,
  fetcher,
}: {
  readonly authBaseUrl: string
  readonly clientId: string
  readonly clientSecret: string
  readonly code: string
  readonly fetcher: typeof fetch
}): Promise<GoogleTokenResponse | null> {
  const response = await fetcher(googleTokenEndpoint, {
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: createGoogleRedirectUri(authBaseUrl),
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })

  if (!response.ok) {
    return null
  }

  const body = await response.json()

  if (typeof body.access_token !== "string") {
    return null
  }

  return {
    accessToken: body.access_token,
    expiresIn:
      typeof body.expires_in === "number" ? body.expires_in : undefined,
    idToken: typeof body.id_token === "string" ? body.id_token : null,
    refreshToken:
      typeof body.refresh_token === "string" ? body.refresh_token : null,
  }
}

async function readGoogleUserInfo(
  fetcher: typeof fetch,
  tokenResponse: GoogleTokenResponse
): Promise<GoogleUserInfo | null> {
  const response = await fetcher(googleUserInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${tokenResponse.accessToken}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const body = await response.json()

  if (typeof body.sub !== "string" || typeof body.email !== "string") {
    return null
  }

  return {
    email: body.email,
    emailVerified: body.email_verified === true,
    image: typeof body.picture === "string" ? body.picture : null,
    name: typeof body.name === "string" ? body.name : body.email,
    sub: body.sub,
  }
}

type GoogleTokenResponse = {
  readonly accessToken: string
  readonly expiresIn: number | undefined
  readonly idToken: string | null
  readonly refreshToken: string | null
}

type GoogleUserInfo = {
  readonly email: string
  readonly emailVerified: boolean
  readonly image: string | null
  readonly name: string
  readonly sub: string
}

function upsertGoogleUser(
  db: KwepDatabase,
  {
    googleUser,
    now,
    sessionExpiresAt,
    sessionToken,
    tokenResponse,
    userId,
  }: {
    readonly googleUser: GoogleUserInfo
    readonly now: Date
    readonly sessionExpiresAt: Date
    readonly sessionToken: string
    readonly tokenResponse: GoogleTokenResponse
    readonly userId: string
  }
): void {
  db.insert(authUsers)
    .values({
      createdAt: now,
      email: googleUser.email,
      emailVerified: googleUser.emailVerified,
      id: userId,
      image: googleUser.image,
      name: googleUser.name,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      set: {
        email: googleUser.email,
        emailVerified: googleUser.emailVerified,
        image: googleUser.image,
        name: googleUser.name,
        updatedAt: now,
      },
      target: authUsers.id,
    })
    .run()

  db.insert(learnerProfiles)
    .values({
      deletedAt: null,
      displayName: googleUser.name,
      status: learnerAccountStatuses.active,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        deletedAt: null,
        displayName: googleUser.name,
        status: learnerAccountStatuses.active,
      },
      target: learnerProfiles.userId,
    })
    .run()

  db.insert(authAccounts)
    .values({
      accessToken: null,
      accountId: googleUser.sub,
      createdAt: now,
      expiresAt:
        tokenResponse.expiresIn === undefined
          ? null
          : new Date(now.getTime() + tokenResponse.expiresIn * 1000),
      id: `google-${googleUser.sub}`,
      idToken: null,
      providerId: "google",
      refreshToken: null,
      updatedAt: now,
      userId,
    })
    .onConflictDoUpdate({
      set: {
        accessToken: null,
        expiresAt:
          tokenResponse.expiresIn === undefined
            ? null
            : new Date(now.getTime() + tokenResponse.expiresIn * 1000),
        idToken: null,
        refreshToken: null,
        updatedAt: now,
      },
      target: authAccounts.id,
    })
    .run()

  db.delete(authSessions).where(eq(authSessions.token, sessionToken)).run()
  db.insert(authSessions)
    .values({
      createdAt: now,
      expiresAt: sessionExpiresAt,
      id: crypto.randomUUID(),
      ipAddress: null,
      token: sessionToken,
      updatedAt: now,
      userAgent: null,
      userId,
    })
    .run()
}
