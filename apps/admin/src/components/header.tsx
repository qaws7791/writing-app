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
    <header className="flex h-14 items-center justify-between gap-3 border-b border-separator bg-surface px-6">
      <p className="text-sm font-medium text-foreground">
        안녕하세요, <span className="text-accent">{adminName}</span>님
      </p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">{adminName}</span>
        <Button variant="outline" size="sm" onPress={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  )
}
