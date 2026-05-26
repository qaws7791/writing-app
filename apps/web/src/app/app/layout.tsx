import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { getAppUser } from "@/lib/auth/get-app-user"
import { getAuthRedirectPath } from "@/lib/auth/auth-navigation"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const api = await getServerWritingAppApi()
  const currentUser = await getAppUser(api)

  if (!currentUser) {
    redirect(getAuthRedirectPath())
  }

  return <AppShell>{children}</AppShell>
}
