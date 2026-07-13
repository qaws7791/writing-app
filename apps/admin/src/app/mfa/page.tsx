import { redirect } from "next/navigation"

import { AdminMfaPage } from "@/features/auth/admin-mfa-page"
import { createAdminSessionApi } from "@/features/auth/admin-session-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { createAdminLoginPath } from "@/lib/auth/admin-auth-navigation"
import { resolveSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"

export default async function AdminMfaRoute({
  searchParams,
}: {
  readonly searchParams?: Promise<{ readonly next?: string | string[] }>
}) {
  const query = await searchParams
  const nextParameter = query?.next
  const nextPath = resolveSafeAdminNextPath(
    Array.isArray(nextParameter)
      ? (nextParameter[0] ?? "/")
      : (nextParameter ?? "/")
  )
  const token = await getServerAdminSessionToken()
  if (token === null) redirect(createAdminLoginPath(nextPath))

  const session = await createAdminSessionApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).getSession()
  if (session.status === "error") redirect(createAdminLoginPath(nextPath))

  return (
    <AdminMfaPage
      enrollmentRequired={session.value.mfa.enrollmentRequired}
      nextPath={nextPath}
    />
  )
}
