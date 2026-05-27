"use client"

import { Separator } from "@workspace/ui/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/ui/sidebar"

import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator className="h-4" orientation="vertical" />
          <span className="text-sm font-medium">운영 콘솔</span>
        </header>
        <div className="flex flex-1 flex-col bg-background text-foreground">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
