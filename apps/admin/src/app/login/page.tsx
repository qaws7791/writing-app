import { AdminAuthPage } from "@/features/authentication/ui/admin-auth-page"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

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
      learnerWebOrigin={readLearnerWebOrigin()}
      nextPath={nextPath}
    />
  )
}
