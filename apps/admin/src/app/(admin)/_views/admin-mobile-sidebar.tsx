"use client"

import { useState } from "react"

import {
  AdminSidebarContent,
  type AdminSidebarProps,
} from "@/app/(admin)/_views/admin-sidebar"
import { MenuIcon } from "@workspace/ui/components/icons/navigation-icons"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/ui/dialog"

export function AdminMobileSidebar(props: AdminSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button aria-label="메뉴 열기" size="icon" variant="ghost">
            <MenuIcon aria-hidden="true" />
          </Button>
        }
      />
      <DialogContent className="top-0 left-0 h-dvh w-[min(20rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 content-start rounded-none rounded-r-4xl bg-sidebar p-4 text-sidebar-foreground sm:max-w-none">
        <DialogTitle className="sr-only">어드민 메뉴</DialogTitle>
        <AdminSidebarContent {...props} />
      </DialogContent>
    </Dialog>
  )
}
