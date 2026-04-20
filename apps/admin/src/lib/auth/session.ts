import { cookies } from "next/headers"
import { eq } from "drizzle-orm"

import { adminUsers } from "@workspace/database"

import { getDb } from "@/lib/db"
import {
  ADMIN_SESSION_COOKIE,
  type AdminSession,
  verifySessionTokenSignature,
} from "@/lib/auth/session-token"

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

export async function verifySessionToken(
  token: string,
  options?: {
    skipFreshnessCheck?: boolean
  }
): Promise<AdminSession | null> {
  const session = await verifySessionTokenSignature(token)

  if (!session) {
    return null
  }

  const currentAdmin = await readCurrentAdminSession(session.adminId)

  if (!currentAdmin) {
    return null
  }

  if (options?.skipFreshnessCheck) {
    return currentAdmin.session
  }

  const issuedAt = new Date(tokenIssuedAt(token))

  if (Number.isNaN(issuedAt.getTime())) {
    return null
  }

  if (currentAdmin.updatedAt.getTime() > issuedAt.getTime()) {
    return null
  }

  return currentAdmin.session
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

function tokenIssuedAt(token: string) {
  const [, payload] = token.split(".")

  if (!payload) {
    return Number.NaN
  }

  try {
    const decoded = JSON.parse(
      atob(payload.replaceAll("-", "+").replaceAll("_", "/"))
    ) as {
      iat?: number
    }

    if (typeof decoded.iat !== "number") {
      return Number.NaN
    }

    return decoded.iat * 1000
  } catch {
    return Number.NaN
  }
}
