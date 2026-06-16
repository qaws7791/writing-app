import { AdminAuthPage } from "@/features/auth/admin-auth-page"

type AdminLoginRouteProps = {
  readonly searchParams?: Promise<{
    readonly next?: string
  }>
}

export default async function AdminLoginRoute({
  searchParams,
}: AdminLoginRouteProps) {
  const query = await searchParams

  return <AdminAuthPage nextPath={query?.next ?? "/"} />
}
