import type { ReactNode } from "react"

import { AppShell } from "@/app/(learner)/app/_views/app-shell"

export const dynamic = "force-dynamic"

export default function AppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AppShell>{children}</AppShell>
}
