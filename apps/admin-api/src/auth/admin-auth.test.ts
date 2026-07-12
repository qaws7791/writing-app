import { describe, expect, it, vi } from "vitest"

import {
  createAdminAuth,
  createAdminAuthHandler,
  createAdminSessionResolver,
} from "@/auth/admin-auth"
import { createAdminMfaRecoveryService } from "@/auth/admin-mfa-recovery"
import { adminSessionExpiresAt } from "@/auth/admin-session"
import { adminRoles } from "@workspace/core/admin"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { seedAdminUser } from "@/scripts/seed-admin"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/db/schema"

const adminSession = {
  createdAt: new Date("2026-06-15T09:00:00.000Z"),
  email: "admin@example.com",
  id: "admin-1",
  image: null,
  name: "관리자",
  role: adminRoles.owner,
  twoFactorEnabled: true,
  updatedAt: new Date("2026-06-15T09:00:00.000Z"),
}

describe("Admin Better Auth session resolver", () => {
  it("owner는 MFA 등록 후 비밀번호만으로 세션을 완료할 수 없다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const authBaseUrl = "http://localhost:4001"
    const webOrigin = "http://localhost:3001"

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.com",
        name: "소유자",
        now: new Date(),
        password: "Owner-password-123!",
      })
      const auth = createAdminAuth({
        authBaseUrl,
        db: database.db,
        secret: "x".repeat(32),
        webOrigin,
      })

      const initialLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      const initialCookie = readSetCookiePair(initialLogin)
      const enrollment = await postAuth(
        auth,
        "/api/auth/two-factor/enable",
        { password: "Owner-password-123!" },
        initialCookie
      )
      const { totpURI } = (await enrollment.json()) as { totpURI: string }
      const secret = new URL(totpURI).searchParams.get("secret") ?? ""
      const enrollmentVerification = await postAuth(
        auth,
        "/api/auth/two-factor/verify-totp",
        { code: await createCurrentTotp(secret), trustDevice: false },
        initialCookie
      )
      expect(enrollmentVerification.ok).toBe(true)

      const login = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      await expect(login.json()).resolves.toMatchObject({
        twoFactorRedirect: true,
      })
      expect(login.headers.get("set-cookie")).toContain(
        "admin_session_token=; Max-Age=0"
      )

      const completedLogin = await postAuth(
        auth,
        "/api/auth/two-factor/verify-totp",
        { code: await createCurrentTotp(secret), trustDevice: false },
        readSetCookiePair(login)
      )
      expect(completedLogin.headers.get("set-cookie")).toContain(
        "admin_session_token="
      )
    } finally {
      database.close()
    }
  })

  it("인증 앱 분실 복구는 코드를 한 번만 소비하고 기존 Better Auth 세션을 폐기한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const authBaseUrl = "http://localhost:4001"
    const webOrigin = "http://localhost:3001"

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.com",
        name: "소유자",
        now: new Date(),
        password: "Owner-password-123!",
      })
      const auth = createAdminAuth({
        authBaseUrl,
        db: database.db,
        secret: "x".repeat(32),
        webOrigin,
      })
      const initialLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      const initialCookie = readSetCookiePair(initialLogin)
      const enrollment = await postAuth(
        auth,
        "/api/auth/two-factor/enable",
        { password: "Owner-password-123!" },
        initialCookie
      )
      const { totpURI } = (await enrollment.json()) as { totpURI: string }
      const secret = new URL(totpURI).searchParams.get("secret") ?? ""
      const verification = await postAuth(
        auth,
        "/api/auth/two-factor/verify-totp",
        { code: await createCurrentTotp(secret), trustDevice: false },
        initialCookie
      )
      const authenticatedCookie = readSetCookiePair(verification)
      const resolver = createAdminSessionResolver(auth)
      await expect(
        resolver.resolveSession(new Headers({ Cookie: authenticatedCookie }))
      ).resolves.not.toBeNull()

      const recovery = createAdminMfaRecoveryService({ database })
      const codes = await recovery.replaceRecoveryCodes(
        (await database.db.select().from(adminAuthUsers))[0]?.id ?? ""
      )
      const recoveryInput = {
        code: codes[0] ?? "",
        email: "owner@example.com",
        password: "Owner-password-123!",
      }
      await expect(recovery.recover(recoveryInput)).resolves.toBe(true)
      await expect(recovery.recover(recoveryInput)).resolves.toBe(false)
      await expect(
        resolver.resolveSession(new Headers({ Cookie: authenticatedCookie }))
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it("비밀번호 변경 성공 시 Better Auth가 만든 새 세션까지 모두 폐기한다", async () => {
    const database = createInMemoryWritingAppDatabase()
    const authBaseUrl = "http://localhost:4001"
    const webOrigin = "http://localhost:3001"

    try {
      runBaselineMigration(database.sqlite)
      await seedAdminUser(database.db, {
        email: "owner@example.com",
        name: "소유자",
        now: new Date(),
        password: "Owner-password-123!",
      })
      const auth = createAdminAuth({
        authBaseUrl,
        db: database.db,
        secret: "x".repeat(32),
        webOrigin,
      })
      const authHandler = createAdminAuthHandler({ auth, database })
      const firstLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })
      const secondLogin = await postAuth(auth, "/api/auth/sign-in/email", {
        email: "owner@example.com",
        password: "Owner-password-123!",
      })

      const response = await authHandler(
        createAuthRequest(
          "/api/auth/change-password",
          {
            currentPassword: "Owner-password-123!",
            newPassword: "New-owner-password-123!",
            revokeOtherSessions: true,
          },
          readSetCookiePair(firstLogin)
        )
      )

      expect(response.ok).toBe(true)
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
      await expect(
        database.db.select().from(adminAuthSessions)
      ).resolves.toEqual([])
      await expect(
        createAdminSessionResolver(auth).resolveSession(
          new Headers({ Cookie: readSetCookiePair(secondLogin) })
        )
      ).resolves.toBeNull()
    } finally {
      database.close()
    }
  })

  it.each([
    ["일반 가입 본문", {}],
    ["owner role을 포함한 본문", { role: adminRoles.owner }],
  ])(
    "관리자 email/password %s을 거부하고 인증 row를 만들지 않는다",
    async (_, extraBody) => {
      const database = createInMemoryWritingAppDatabase()

      try {
        runBaselineMigration(database.sqlite)
        const auth = createAdminAuth({
          authBaseUrl: "http://localhost:4001",
          db: database.db,
          secret: "x".repeat(32),
          webOrigin: "http://localhost:3001",
        })
        const response = await auth.handler(
          new Request("http://localhost:4001/api/auth/sign-up/email", {
            body: JSON.stringify({
              email: "admin@example.com",
              name: "관리자",
              password: "admin-password-123",
              ...extraBody,
            }),
            headers: {
              "Content-Type": "application/json",
              Origin: "http://localhost:3001",
            },
            method: "POST",
          })
        )

        expect([403, 404]).toContain(response.status)
        await expect(
          database.db.select().from(adminAuthUsers)
        ).resolves.toEqual([])
        await expect(
          database.db.select().from(adminAuthAccounts)
        ).resolves.toEqual([])
        await expect(
          database.db.select().from(adminAuthSessions)
        ).resolves.toEqual([])
      } finally {
        database.close()
      }
    }
  )

  it("관리자 인증은 Google social sign-in을 열지 않는다", async () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(database.sqlite)
      const auth = createAdminAuth({
        authBaseUrl: "http://localhost:4001",
        db: database.db,
        secret: "x".repeat(32),
        webOrigin: "http://localhost:3001",
      })
      const response = await auth.handler(
        new Request("http://localhost:4001/api/auth/sign-in/social", {
          body: JSON.stringify({
            provider: "google",
          }),
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3001",
          },
          method: "POST",
        })
      )

      expect(response.ok).toBe(false)
    } finally {
      database.close()
    }
  })

  it("Better Auth getSession 결과를 관리자 세션으로 변환한다", async () => {
    const getSession = vi.fn(async () => ({
      session: {
        createdAt: new Date("2026-07-12T23:58:00.000Z"),
        expiresAt: new Date("2026-07-13T00:00:00.000Z"),
      },
      user: adminSession,
    }))
    const resolver = createAdminSessionResolver(
      {
        api: {
          getSession,
        },
      },
      { now: () => new Date("2026-07-13T00:00:00.000Z") }
    )
    const headers = new Headers({
      Cookie: "admin_session_token=admin-token-1.signature",
    })

    await expect(resolver.resolveSession(headers)).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: adminRoles.owner,
        twoFactorEnabled: true,
      },
      authenticationAssurance: "mfa-step-up-verified",
      [adminSessionExpiresAt]: new Date("2026-07-13T00:00:00.000Z"),
    })
    expect(getSession).toHaveBeenCalledWith({
      headers,
    })
  })

  it("Better Auth 세션이 없으면 관리자 세션도 없다", async () => {
    const resolver = createAdminSessionResolver({
      api: {
        getSession: vi.fn(async () => null),
      },
    })

    await expect(resolver.resolveSession(new Headers())).resolves.toBeNull()
  })
})

async function postAuth(
  auth: ReturnType<typeof createAdminAuth>,
  path: string,
  body: Readonly<Record<string, unknown>>,
  cookie?: string
): Promise<Response> {
  return auth.handler(createAuthRequest(path, body, cookie))
}

function createAuthRequest(
  path: string,
  body: Readonly<Record<string, unknown>>,
  cookie?: string
): Request {
  return new Request(`http://localhost:4001${path}`, {
    body: JSON.stringify(body),
    headers: {
      ...(cookie === undefined ? {} : { Cookie: cookie }),
      "Content-Type": "application/json",
      Origin: "http://localhost:3001",
    },
    method: "POST",
  })
}

function readSetCookiePair(response: Response): string {
  const setCookie = response.headers.get("set-cookie") ?? ""
  return setCookie
    .split(/,(?=\s*[^;,]+=)/u)
    .map((value) => value.trim().split(";")[0])
    .filter(Boolean)
    .join("; ")
}

async function createCurrentTotp(secret: string): Promise<string> {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const character of secret.replaceAll("=", "").toUpperCase()) {
    bits += alphabet.indexOf(character).toString(2).padStart(5, "0")
  }
  const secretBytes = Uint8Array.from(
    bits.match(/.{8}/gu)?.map((byte) => Number.parseInt(byte, 2)) ?? []
  )
  const counter = Math.floor(Date.now() / 30_000)
  const counterBytes = new Uint8Array(8)
  new DataView(counterBytes.buffer).setBigUint64(0, BigInt(counter))
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { hash: "SHA-1", name: "HMAC" },
    false,
    ["sign"]
  )
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, counterBytes)
  )
  const offset = (digest.at(-1) ?? 0) & 0x0f
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    ((digest[offset + 1] ?? 0) << 16) |
    ((digest[offset + 2] ?? 0) << 8) |
    (digest[offset + 3] ?? 0)
  return String(binary % 1_000_000).padStart(6, "0")
}
