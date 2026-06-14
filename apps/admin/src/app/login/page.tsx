import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import { createAdminGoogleSignInPath } from "@/lib/auth/admin-auth-client"

export default function AdminLoginRoute() {
  return <AdminAuthPage signInPath={createAdminGoogleSignInPath("/")} />
}
