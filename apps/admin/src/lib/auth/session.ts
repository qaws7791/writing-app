import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

import { env } from "@/env"

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
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      name: payload.name as string,
    }
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
