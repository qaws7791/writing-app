import { redirect } from "next/navigation"

import { AdminMfaPage } from "@/features/auth/admin-mfa-page"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminMfaRoute() {
  const token = await getServerAdminSessionToken()
  if (token === null) redirect(createAdminLoginPath("/mfa"))

  const session = await createAdminSessionApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).getSession()
  if (session.status === "error") redirect(createAdminLoginPath("/mfa"))

  return (
    <AdminMfaPage enrollmentRequired={session.value.mfa.enrollmentRequired} />
  )
}
