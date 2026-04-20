import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"

import { adminUsers } from "@workspace/database"

import { env } from "@/env"
import { getDb } from "@/lib/db"

export const ADMIN_SESSION_COOKIE = "admin_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 8 // 8 hours

export type AdminSession = {
  adminId: number
  email: string
  name: string
}

function getSecret() {
  return new TextEncoder().encode(env.ADMIN_JWT_SECRET)
}

async function readCurrentAdminSession(adminId: number): Promise<{
  session: AdminSession
  updatedAt: Date
} | null> {
  const [admin] = await getDb()
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, adminId))
    .limit(1)

  if (!admin) {
    return null
  }

  return {
    session: {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    },
    updatedAt: admin.updatedAt,
  }
}

export async function createSessionToken(
  payload: AdminSession
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string,
  options?: {
    skipFreshnessCheck?: boolean
  }
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const adminId = payload.adminId

    if (typeof adminId !== "number") {
      return null
    }

    const currentAdmin = await readCurrentAdminSession(adminId)

    if (!currentAdmin) {
      return null
    }

    if (options?.skipFreshnessCheck) {
      return currentAdmin.session
    }

    if (typeof payload.iat !== "number") {
      return null
    }

    const issuedAt = payload.iat * 1000

    if (currentAdmin.updatedAt.getTime() > issuedAt) {
      return null
    }

    return currentAdmin.session
  } catch {
    return null
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export function sessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  }
}
