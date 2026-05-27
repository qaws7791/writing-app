"use client"

import * as React from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/ui/sidebar"

import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col bg-background text-foreground">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
