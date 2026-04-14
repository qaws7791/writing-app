import { redirect } from "next/navigation"

import { getSession } from "@/lib/auth/session"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header adminName={session.name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
