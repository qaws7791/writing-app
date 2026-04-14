"use client"

import { useRouter } from "next/navigation"

export function Header({ adminName }: { adminName: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
  }

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b border-border px-6">
      <span className="text-muted-foreground text-sm">{adminName}</span>
      <button
        onClick={handleLogout}
        className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
      >
        로그아웃
      </button>
    </header>
  )
}
