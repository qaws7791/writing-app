"use client"

import { useRouter } from "next/navigation"
import { Logout03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { env } from "@/env"
import { authClient } from "@/lib/auth-client"

export function AuthSignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    if (env.NEXT_PUBLIC_PHASE_ONE_MODE === "local") {
      router.push("/")
      router.refresh()
      return
    }

    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="로그아웃"
    >
      <HugeiconsIcon
        icon={Logout03Icon}
        size={18}
        color="currentColor"
        strokeWidth={1.7}
      />
      <span className="hidden md:inline">로그아웃</span>
    </button>
  )
}
