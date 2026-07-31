import { resolveAdminLoginReason } from "@/features/authentication/model/admin-auth-navigation"
import { AdminAuthPage } from "@/features/authentication/ui/admin-auth-page"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

type AdminLoginRouteProps = {
  readonly searchParams?: Promise<{
    readonly next?: string | string[]
    readonly reason?: string | string[]
  }>
}

export default async function AdminLoginRoute({
  searchParams,
}: AdminLoginRouteProps) {
  const query = await searchParams

  return (
    <AdminAuthPage
      learnerWebOrigin={readLearnerWebOrigin()}
      nextPath={readFirstValue(query?.next) ?? "/"}
      reason={resolveAdminLoginReason(readFirstValue(query?.reason))}
    />
  )
}

function readFirstValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
