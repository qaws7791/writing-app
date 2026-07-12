import { redirect } from "next/navigation"

import { AdminMfaPage } from "@/features/auth/admin-mfa-page"
import { getServerAdminApi } from "@/lib/api/get-server-admin-api"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminMfaRoute() {
  const token = await getServerAdminSessionToken()
  if (token === null) redirect(createAdminLoginPath("/mfa"))

  const session = await getServerAdminApi({
    tokenProvider: () => token,
  }).getSession()
  if (session.status === "error") redirect(createAdminLoginPath("/mfa"))

  return (
    <AdminMfaPage enrollmentRequired={session.value.mfa.enrollmentRequired} />
  )
}
