export const adminSessionCookieName = "admin_session_token"

export function normalizeAdminSessionToken(
  value: string | undefined
): string | null {
  if (value === undefined || value.trim() === "") {
    return null
  }

  return value.trim()
}
