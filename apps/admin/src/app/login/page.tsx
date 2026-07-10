import { AdminAuthPage } from "@/features/auth/admin-auth-page"

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

  return <AdminAuthPage nextPath={nextPath} />
}
