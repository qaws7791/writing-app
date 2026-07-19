import { AdminAuthPage } from "@/features/authentication/ui/admin-auth-page"
import {
  readAdminApiBaseUrl,
  readLearnerWebOrigin,
} from "@/shared/config/admin-runtime-config"

type AdminLoginRouteProps = {
  readonly searchParams?: Promise<{
    readonly next?: string | string[]
  }>
}

export default async function AdminLoginRoute({
  searchParams,
}: AdminLoginRouteProps) {
  const query = await searchParams
  const nextParameter = query?.next
  const nextPath = Array.isArray(nextParameter)
    ? (nextParameter[0] ?? "/")
    : (nextParameter ?? "/")

  return (
    <AdminAuthPage
      apiBaseUrl={readAdminApiBaseUrl()}
      learnerWebOrigin={readLearnerWebOrigin()}
      nextPath={nextPath}
    />
  )
}
