import { SignJWT, jwtVerify } from "jose"

export const ADMIN_SESSION_COOKIE = "admin_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 8 // 8 hours

export type AdminSession = {
  adminId: number
  email: string
  name: string
}

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET

  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET 환경변수가 설정되지 않았습니다")
  }

  return new TextEncoder().encode(secret)
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

export async function verifySessionTokenSignature(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const adminId = payload.adminId
    const email = payload.email
    const name = payload.name

    if (
      typeof adminId !== "number" ||
      typeof email !== "string" ||
      typeof name !== "string"
    ) {
      return null
    }

    return {
      adminId,
      email,
      name,
    }
  } catch {
    return null
  }
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
