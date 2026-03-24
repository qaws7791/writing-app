import GlobalNavigation from "@/features/navigation/components/global-navigation"
import React from "react"
import { redirectIfProtectedAccessMissing } from "@/features/auth/repositories/server-auth"

export default async function layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await redirectIfProtectedAccessMissing()

  return (
    <div className="flex min-h-screen">
      <GlobalNavigation />
      <div className="max-h-screen flex-1 overflow-y-auto bg-background pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
