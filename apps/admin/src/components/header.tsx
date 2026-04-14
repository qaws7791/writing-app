"use client"

import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

export function Header({ adminName }: { adminName: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
  }

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b border-separator bg-surface px-6">
      <span className="text-sm text-muted">{adminName}</span>
      <Button variant="outline" size="sm" onPress={handleLogout}>
        로그아웃
      </Button>
    </header>
  )
}
